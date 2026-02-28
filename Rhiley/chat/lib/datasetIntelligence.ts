// ── TYPES ─────────────────────────────────────────────────

export interface ScrapedExample {
    type: string;   // "github" | "css" | "js"
    tag: string;   // "framer-motion" | "gsap" | "3d-card"
    priority: string;   // "high" | "medium" | "low"
    instruction: string;
    code: string;
    repo?: string;
    source?: string;
    path?: string;
}

export interface RankedExample {
    example: ScrapedExample;
    score: number;
    matchReason: string;
}

// ── CACHE ─────────────────────────────────────────────────

const MASTER_DATA: ScrapedExample[] = [];
const TAG_INDEX = new Map<string, ScrapedExample[]>();
const KEYWORD_INDEX = new Map<string, ScrapedExample[]>();
let INDEXED = false;

// ── LOAD + INDEX ──────────────────────────────────────────

export async function initDatasetIntelligence(): Promise<void> {
    if (INDEXED) return;

    try {
        const isServer = typeof window === "undefined";
        let data: ScrapedExample[] = [];

        if (isServer) {
            // Use dynamic require for Node modules to prevent browser bundling
            const fs = require("fs");
            const path = require("path");

            const filePath = path.join(process.cwd(), "public", "datasets", "rhiley-master-dataset.json");
            if (fs.existsSync(filePath)) {
                data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
            } else {
                console.warn("[Rhiley] Master dataset not found at:", filePath);
                return;
            }
        } else {
            // Load master dataset (all 8,017 examples)
            const res = await fetch("/datasets/rhiley-master-dataset.json");
            if (!res.ok) {
                console.warn("[Rhiley] Master dataset not found in public/datasets/");
                return;
            }
            data = await res.json();
        }

        MASTER_DATA.length = 0;
        MASTER_DATA.push(...data);

        // Build TAG_INDEX → { "gsap": [ex1, ex2...], "r3f": [...] }
        for (const ex of data) {
            if (!ex.tag) continue;
            const list = TAG_INDEX.get(ex.tag) ?? [];
            list.push(ex);
            TAG_INDEX.set(ex.tag, list);
        }

        // Build KEYWORD_INDEX from instructions + file paths
        // → { "card": [ex1...], "hero": [ex2...], "button": [...] }
        for (const ex of data) {
            const words = extractWords(
                `${ex.instruction} ${ex.path ?? ""} ${ex.tag}`
            );
            for (const word of words) {
                const list = KEYWORD_INDEX.get(word) ?? [];
                list.push(ex);
                KEYWORD_INDEX.set(word, list);
            }
        }

        INDEXED = true;
        console.log(
            `[Rhiley Dataset] ✅ Indexed ${data.length} examples | ` +
            `${TAG_INDEX.size} tags | ${KEYWORD_INDEX.size} keywords`
        );
    } catch (err) {
        console.warn("[Rhiley Dataset] Load failed:", err);
    }
}

// Pre-load on import
if (typeof window !== "undefined") {
    initDatasetIntelligence();
}

// ── WORD EXTRACTOR ────────────────────────────────────────

function extractWords(text: string): string[] {
    const stop = new Set([
        "the", "a", "an", "is", "it", "to", "and", "or", "for", "of", "in",
        "on", "at", "by", "with", "can", "you", "me", "my", "i", "we", "write",
        "create", "build", "make", "like", "from", "using", "component", "file",
    ]);
    return text
        .toLowerCase()
        .split(/[\s\-_/.:,]+/)
        .filter(w => w.length > 3 && !stop.has(w) && !/^\d+$/.test(w));
}

// ── QUALITY SCORER ────────────────────────────────────────
// Scores each example on multiple dimensions

function scoreExample(
    ex: ScrapedExample,
    query: string,
    tags: string[]
): number {
    let score = 0;
    const q = query.toLowerCase();

    // Priority boost
    if (ex.priority === "high") score += 3;
    if (ex.priority === "medium") score += 1;

    // Tag exact match
    if (tags.includes(ex.tag)) score += 5;

    // Tag partial match
    tags.forEach(t => {
        if (ex.tag.includes(t) || t.includes(ex.tag)) score += 2;
    });

    // Instruction relevance
    const instrWords = extractWords(ex.instruction);
    const queryWords = extractWords(q);
    const overlap = instrWords.filter(w => queryWords.includes(w)).length;
    score += overlap * 1.5;

    // File type preference: tsx/jsx > ts/js > css
    if (ex.path?.endsWith(".tsx") || ex.path?.endsWith(".jsx")) score += 2;
    if (ex.path?.endsWith(".ts") || ex.path?.endsWith(".js")) score += 1;

    // Code quality signals
    if (ex.code.includes("export default")) score += 1;
    if (ex.code.includes("framer-motion")) score += 1;
    if (ex.code.includes("useFrame")) score += 1; // Three.js
    if (ex.code.includes("@keyframes")) score += 1; // CSS animations
    if (ex.code.includes("ScrollTrigger")) score += 1; // GSAP
    if (ex.code.includes("motion.")) score += 1; // Framer

    // Length sweet spot: 500-3000 chars (not too short, not too long)
    const len = ex.code.length;
    if (len > 500 && len < 3000) score += 2;
    if (len > 3000 && len < 6000) score += 1;
    if (len < 200) score -= 2; // too short = useless

    return score;
}

// ── INTENT → TAGS MAPPER ──────────────────────────────────
// Converts user message to dataset tag names

function messageToTags(message: string): string[] {
    const m = message.toLowerCase();
    const tags: string[] = [];

    // Direct tag detection
    const tagMap: Record<string, string[]> = {
        "framer-motion": ["framer", "motion", "animate", "variant", "spring", "stagger"],
        "gsap": ["gsap", "greensock", "scrolltrigger", "timeline", "tween"],
        "threejs": ["three.js", "threejs", "webgl", "scene", "mesh", "geometry"],
        "r3f": ["r3f", "react-three", "fiber", "canvas", "useframe"],
        "drei": ["drei", "float", "orbitcontrols", "environment", "text3d"],
        "glsl-noise": ["shader", "glsl", "noise", "vertex", "fragment"],
        "css-art": ["css art", "pure css", "css only", "no js"],
        "css-filters": ["filter", "blur", "hue", "saturate", "backdrop"],
        "css-animations": ["keyframe", "@keyframes", "css animation", "transition"],
        "page-transitions": ["page transition", "route change", "navigate"],
        "card-effect": ["card", "flip", "expand", "reveal card"],
        "magnetic-btn": ["magnetic", "cursor", "follow mouse"],
        "cursor-effect": ["cursor", "mouse trail", "pointer"],
        "scroll-anim": ["scroll", "scrolltrigger", "on scroll", "scroll reveal"],
        "parallax": ["parallax", "depth", "layer"],
        "text-effects": ["text effect", "split text", "word animation", "letter"],
        "marquee": ["marquee", "ticker", "infinite scroll", "loop text"],
        "glassmorphism": ["glass", "glassmorphism", "frosted", "backdrop blur"],
        "landing": ["landing", "hero", "homepage", "marketing"],
        "saas-dark": ["saas", "dashboard", "product", "dark mode"],
        "shadcn": ["shadcn", "button", "dialog", "modal", "dropdown"],
        "magic-ui": ["magic", "sparkle", "glow", "beam", "particle"],
        "bg-effects": ["background", "gradient mesh", "aurora", "noise bg"],
        "recharts": ["chart", "graph", "recharts", "bar", "line", "pie"],
        "d3": ["d3", "data viz", "visualization", "svg chart"],
        "generative-art": ["generative", "procedural", "random", "noise"],
        "3d-card": ["3d card", "tilt", "perspective", "rotate card"],
        "webgl-hover": ["webgl", "distortion", "image hover", "liquid"],
        "morph-transition": ["morph", "shape shift", "svg morph"],
        "grid-animation": ["grid", "masonry", "gallery animation"],
        "motion-primitives": ["motion primitive", "animated", "reveal", "entrance"],
        "locomotive-scroll": ["smooth scroll", "locomotive", "lenis"],
        "lenis": ["lenis", "smooth scroll", "lerp scroll"],
        "react-spring": ["spring", "react-spring", "physics animation"],
        "draggable": ["drag", "drop", "sortable", "reorder"],
        "toast": ["toast", "notification", "sonner", "alert"],
        "command-menu": ["command", "cmd+k", "search palette", "cmdk"],
    };

    for (const [tag, keywords] of Object.entries(tagMap)) {
        if (keywords.some(k => m.includes(k))) {
            tags.push(tag);
        }
    }

    return [...new Set(tags)]; // deduplicate
}

// ── MAIN LOOKUP FUNCTION ──────────────────────────────────

export interface DatasetContext {
    snippets: string;    // injected into system prompt
    examples: RankedExample[];
    tagsMatched: string[];
    totalFound: number;
}

export function getDatasetContext(
    userMessage: string,
    maxExamples = 3,
    maxCodeChars = 600,
): DatasetContext {
    if (!INDEXED || MASTER_DATA.length === 0) {
        return { snippets: "", examples: [], tagsMatched: [], totalFound: 0 };
    }

    const tags = messageToTags(userMessage);
    const qWords = extractWords(userMessage);

    if (tags.length === 0 && qWords.length === 0) {
        return { snippets: "", examples: [], tagsMatched: [], totalFound: 0 };
    }

    // Gather candidates from tag + keyword indexes
    const candidates = new Set<ScrapedExample>();

    tags.forEach(tag => {
        (TAG_INDEX.get(tag) ?? []).forEach(ex => candidates.add(ex));
    });

    qWords.forEach(word => {
        (KEYWORD_INDEX.get(word) ?? []).slice(0, 20).forEach(ex => candidates.add(ex));
    });

    if (candidates.size === 0) {
        return { snippets: "", examples: [], tagsMatched: [], totalFound: 0 };
    }

    // Score and rank
    const ranked: RankedExample[] = [...candidates].map(ex => ({
        example: ex,
        score: scoreExample(ex, userMessage, tags),
        matchReason: tags.find(t => t === ex.tag) ?? "keyword match",
    }));

    ranked.sort((a, b) => b.score - a.score);
    const top = ranked.slice(0, maxExamples);

    // Build snippet string for prompt injection
    const lines: string[] = ["## REAL CODE FROM YOUR DATASET (8,017 examples)"];

    for (const { example: ex, score, matchReason } of top) {
        const source = ex.repo ? `github.com/${ex.repo}` : ex.source ?? "scraped";
        const codeSnip = ex.code.slice(0, maxCodeChars);
        const hasMore = ex.code.length > maxCodeChars;

        lines.push(`\n### ${ex.tag} — from ${source} (score: ${score})`);
        lines.push(`Instruction: ${ex.instruction}`);
        lines.push("```");
        lines.push(codeSnip + (hasMore ? "\n// ... (truncated)" : ""));
        lines.push("```");
    }

    return {
        snippets: lines.join("\n"),
        examples: top,
        tagsMatched: tags,
        totalFound: candidates.size,
    };
}

// ── STATS ─────────────────────────────────────────────────

export function getDatasetStats(): any {
    return {
        indexed: INDEXED,
        totalExamples: MASTER_DATA.length,
        uniqueTags: TAG_INDEX.size,
        uniqueKeywords: KEYWORD_INDEX.size,
        topTags: [...TAG_INDEX.entries()]
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 10)
            .map(([tag, items]) => ({ tag, count: items.length })),
    };
}

// ── FIND SIMILAR EXAMPLES ─────────────────────────────────
// Given a code snippet, find similar examples in dataset

export function findSimilar(code: string, limit = 3): ScrapedExample[] {
    if (!INDEXED) return [];
    const words = extractWords(code).slice(0, 10);
    const counts = new Map<ScrapedExample, number>();

    words.forEach(word => {
        (KEYWORD_INDEX.get(word) ?? []).forEach(ex => {
            counts.set(ex, (counts.get(ex) ?? 0) + 1);
        });
    });

    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([ex]) => ex);
}
