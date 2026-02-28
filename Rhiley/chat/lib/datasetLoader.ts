// chat/lib/datasetLoader.ts
// Reads scraped JSON datasets from public/datasets/
// Fast in-memory cache — lookup in <1ms

const DATASET_KEYS = [
    "rhiley-master-dataset",    // everything merged
    "rhiley-github-dataset",    // GitHub repos only
    "rhiley-behance-dataset",   // CSS/JS from design sites
    "rhiley-3000-dataset",      // Framer Motion variants
    "rhiley-design-colors",     // Color palettes
    "rhiley-dataset",           // Fonts
    "rhiley-code-dataset",      // Code patterns
    "ui-library-registry",      // Component registry
] as const;

type DatasetKey = typeof DATASET_KEYS[number];

interface ScrapedExample {
    type: string;    // "github" | "css" | "js"
    tag: string;    // "framer-motion" | "gsap" | "3d-card" etc
    priority: string;    // "high" | "medium" | "low"
    instruction: string;
    code: string;
    repo?: string;
    source?: string;
    path?: string;
}

// ── IN-MEMORY CACHE ───────────────────────────────────────

const CACHE = new Map<string, any>();
let READY = false;
let LOAD_PROMISE: Promise<void> | null = null;

// ── TAG INDEX — for fast lookup ───────────────────────────
// Built once from master dataset: { "gsap": [example, ...], ... }

const TAG_INDEX = new Map<string, ScrapedExample[]>();

function buildTagIndex(data: ScrapedExample[]): void {
    TAG_INDEX.clear();
    for (const ex of data) {
        if (!ex.tag) continue;
        const list = TAG_INDEX.get(ex.tag) ?? [];
        list.push(ex);
        TAG_INDEX.set(ex.tag, list);
    }
}

// ── LOAD ALL DATASETS ─────────────────────────────────────

export async function loadAllDatasets(): Promise<void> {
    if (READY) return;
    if (LOAD_PROMISE) return LOAD_PROMISE;

    LOAD_PROMISE = (async () => {
        await Promise.allSettled(
            DATASET_KEYS.map(async (key) => {
                try {
                    const res = await fetch(`/datasets/${key}.json`);
                    if (res.ok) {
                        const data = await res.json();
                        CACHE.set(key, data);
                    }
                } catch {
                    // Dataset might not exist yet if scraper hasn't run
                }
            })
        );

        // Build tag index from master dataset
        const master = CACHE.get("rhiley-master-dataset");
        if (Array.isArray(master)) {
            buildTagIndex(master);
        }

        READY = true;
        const totalExamples = CACHE.get("rhiley-master-dataset")?.length ?? 0;
        if (totalExamples > 0) {
            console.log(`[Rhiley] Datasets loaded — ${totalExamples} training examples ready`);
        }
    })();

    return LOAD_PROMISE;
}

// Pre-load immediately on import (client-side only)
if (typeof window !== "undefined") {
    loadAllDatasets();
}

// ── SMART LOOKUP ──────────────────────────────────────────
// Extracts relevant code snippets for a given user message

export function lookupByMessage(userMessage: string, maxResults = 3): string {
    if (!READY || TAG_INDEX.size === 0) return "";

    const msg = userMessage.toLowerCase();
    const lines: string[] = [];

    // Score each tag against the message
    const scored: { tag: string; score: number; examples: ScrapedExample[] }[] = [];

    for (const [tag, examples] of TAG_INDEX.entries()) {
        const tagWords = tag.replace(/-/g, " ").split(" ");
        let score = 0;
        tagWords.forEach(w => { if (msg.includes(w)) score++; });

        // Bonus for high-priority examples
        const highCount = examples.filter(e => e.priority === "high").length;
        score += highCount * 0.1;

        if (score > 0) scored.push({ tag, score, examples });
    }

    // Sort by score, take top matches
    scored.sort((a, b) => b.score - a.score);
    const topTags = scored.slice(0, maxResults);

    if (topTags.length === 0) return "";

    lines.push("## FROM YOUR SCRAPED DATASET");

    for (const { tag, examples } of topTags) {
        // Pick best example from this tag (prefer high priority tsx/jsx)
        const best = examples
            .filter(e => e.priority === "high")
            .find(e => e.path?.endsWith(".tsx") || e.path?.endsWith(".jsx") || e.type === "css")
            ?? examples[0];

        if (!best) continue;

        lines.push(`\n### ${tag} example (${best.repo ?? best.source ?? "scraped"})`);
        lines.push(best.instruction);
        lines.push("```");
        lines.push(best.code.slice(0, 600)); // first 600 chars of real code
        lines.push("```");
    }

    return lines.join("\n");
}

// ── RAW DATASET ACCESS ────────────────────────────────────

export function getDataset(key: DatasetKey): any {
    return CACHE.get(key);
}

export function getStats(): any {
    return {
        ready: READY,
        datasetsLoaded: CACHE.size,
        tagsIndexed: TAG_INDEX.size,
        totalExamples: CACHE.get("rhiley-master-dataset")?.length ?? 0,
    };
}
