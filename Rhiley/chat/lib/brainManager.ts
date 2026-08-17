"use client";

// ── TYPES ─────────────────────────────────────────────────

export interface SkillBlock {
    id: string;
    name: string;
    trigger: string[];
    systemInject: string;    // max 800 chars
    codePatterns: string[];
    libraries: string[];
    createdAt: number;
    trainCount: number;
    lastUsed?: number;
}

export interface BrainSnapshot {
    timestamp: number;
    skills: SkillBlock[];
    reason: string;
}

export interface RhileyBrain {
    version: number;
    lastUpdated: string;
    coreDNA: {
        identity: string;
        defaultStack: string;
        codeRules: string[];
    };
    skills: SkillBlock[];
    history: BrainSnapshot[];   // last 10 states for rollback
    rewireLog: { prompt: string; skillName: string; timestamp: number }[];
}

// ── CONSTANTS ─────────────────────────────────────────────

const BRAIN_KEY = "rhiley_brain";
const MAX_SKILLS_INJECT = 3;        // max skills per request
const MAX_INJECT_CHARS = 800;      // max chars per skill systemInject
const MAX_HISTORY = 10;       // max rollback snapshots
const MAX_REWIRE_LOG = 50;

// ── DEFAULT BRAIN ─────────────────────────────────────────

export const DEFAULT_BRAIN: RhileyBrain = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    coreDNA: {
        identity: "Rhiley — elite AI frontend engineer",
        defaultStack: "React 18 + TypeScript + Tailwind CSS + Framer Motion",
        codeRules: [
            "Always output complete files — never truncate",
            "React is always the default framework",
            "Tailwind CSS for all styling",
            "Framer Motion for all animations",
            "TypeScript always unless told otherwise",
            "Single self-contained .tsx file",
            "Last line: export default ComponentName",
            "No placeholder comments, no TODOs",
        ],
    },
    skills: [],
    history: [],
    rewireLog: [],
};

// ── HELPERS ──────────────────────────────────────────────

function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

// ── READ / WRITE ──────────────────────────────────────────

// In-memory storage for non-browser environments (tests, SSR)
let memoryBrain: RhileyBrain | null = null;

export function getBrain(): RhileyBrain {
    if (typeof window === "undefined") {
        return memoryBrain || deepClone(DEFAULT_BRAIN);
    }
    try {
        const raw = localStorage.getItem(BRAIN_KEY);
        if (!raw) return deepClone(DEFAULT_BRAIN);
        const parsed = JSON.parse(raw);
        // Merge with defaults to handle missing fields
        return { ...deepClone(DEFAULT_BRAIN), ...parsed, coreDNA: { ...DEFAULT_BRAIN.coreDNA, ...parsed.coreDNA } };
    } catch {
        return deepClone(DEFAULT_BRAIN);
    }
}

export function saveBrain(brain: RhileyBrain): void {
    const cloned = deepClone(brain);
    cloned.lastUpdated = new Date().toISOString();

    if (typeof window === "undefined") {
        memoryBrain = cloned;
        return;
    }
    try {
        localStorage.setItem(BRAIN_KEY, JSON.stringify(cloned));
    } catch (e) {
        console.error("[Brain] Save failed — localStorage may be full:", e);
    }
}

// ── SNAPSHOT / ROLLBACK ───────────────────────────────────

function takeSnapshot(brain: RhileyBrain, reason: string): void {
    const snapshot: BrainSnapshot = {
        timestamp: Date.now(),
        skills: JSON.parse(JSON.stringify(brain.skills)), // deep copy
        reason,
    };
    brain.history = [snapshot, ...brain.history].slice(0, MAX_HISTORY);
}

export function rollbackBrain(): { success: boolean; message: string } {
    const brain = getBrain();
    if (brain.history.length === 0) {
        return { success: false, message: "No previous brain state to roll back to." };
    }
    const last = brain.history[0];
    brain.skills = last.skills;
    brain.history = brain.history.slice(1);
    saveBrain(brain);
    return { success: true, message: `Rolled back to brain state from ${new Date(last.timestamp).toLocaleTimeString()} (${last.reason})` };
}

// ── RELEVANCE SCORING ─────────────────────────────────────

function scoreSkill(skill: SkillBlock, message: string): number {
    const msg = message.toLowerCase();
    let score = 0;
    skill.trigger.forEach(t => {
        if (msg.includes(t.toLowerCase())) score++;
    });

    // ONLY apply boosts if there was at least one keyword match
    if (score > 0) {
        // Boost recently used skills slightly
        if (skill.lastUsed && Date.now() - skill.lastUsed < 3_600_000) score += 0.5;
        // Boost highly trained skills
        score += skill.trainCount * 0.1;
    }

    return score;
}

// ── BUILD CONTEXT — called before every AI request ───────

export function buildBrainContext(userMessage: string): string {
    const brain = getBrain();
    const lines: string[] = [];

    // Always inject core rules
    lines.push("## RHILEY CORE");
    lines.push(`Stack: ${brain.coreDNA.defaultStack}`);
    brain.coreDNA.codeRules.forEach(r => lines.push(`- ${r}`));

    // Score all skills against this message
    const scored = brain.skills
        .map(s => ({ skill: s, score: scoreSkill(s, userMessage) }))
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_SKILLS_INJECT); // only top 3

    if (scored.length > 0) {
        lines.push("\n## ACTIVE SKILLS");
        scored.forEach(({ skill }) => {
            // Update lastUsed
            skill.lastUsed = Date.now();
            const inject = skill.systemInject.slice(0, MAX_INJECT_CHARS);
            lines.push(`\n### ${skill.name} (trained ${skill.trainCount}x)`);
            lines.push(inject);
            if (skill.codePatterns.length > 0) {
                lines.push("Patterns: " + skill.codePatterns.slice(0, 3).join(" | "));
            }
        });
        saveBrain(brain); // save lastUsed updates
    }

    return lines.join("\n");
}

// ── ADD / REINFORCE SKILL ─────────────────────────────────

export function addSkill(
    skill: Omit<SkillBlock, "id" | "createdAt" | "trainCount" | "lastUsed">
): { skill: SkillBlock; wasReinforced: boolean } {
    const brain = getBrain();

    // Take snapshot before modifying
    takeSnapshot(brain, `before adding skill: ${skill.name}`);

    // Check for existing skill with same name (case-insensitive)
    const existingIdx = brain.skills.findIndex(
        s => s.name.toLowerCase() === skill.name.toLowerCase()
    );

    if (existingIdx !== -1) {
        // REINFORCE existing skill
        const existing = brain.skills[existingIdx];
        existing.trainCount++;
        existing.systemInject = skill.systemInject.slice(0, MAX_INJECT_CHARS);
        // Merge triggers (unique only)
        existing.trigger = [...new Set([...existing.trigger, ...skill.trigger])];
        // Merge code patterns (unique, max 10)
        existing.codePatterns = [...new Set([...existing.codePatterns, ...skill.codePatterns])].slice(0, 10);
        saveBrain(brain);
        return { skill: existing, wasReinforced: true };
    }

    // NEW skill
    const newSkill: SkillBlock = {
        ...skill,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        trainCount: 1,
        systemInject: skill.systemInject.slice(0, MAX_INJECT_CHARS),
    };

    brain.skills.push(newSkill);

    // Log rewire
    brain.rewireLog = [{
        prompt: skill.name,
        skillName: skill.name,
        timestamp: Date.now(),
    }, ...brain.rewireLog].slice(0, MAX_REWIRE_LOG);

    saveBrain(brain);
    return { skill: newSkill, wasReinforced: false };
}

export function removeSkill(id: string): void {
    const brain = getBrain();
    takeSnapshot(brain, `before removing skill ${id}`);
    brain.skills = brain.skills.filter(s => s.id !== id);
    saveBrain(brain);
}

export function listSkills(): SkillBlock[] {
    return getBrain().skills;
}

export function getSkillCount(): number {
    return getBrain().skills.length;
}

// ── EXPORT / IMPORT ───────────────────────────────────────

export function exportBrain(): string {
    return JSON.stringify(getBrain(), null, 2);
}

export function importBrain(jsonString: string): { success: boolean; message: string } {
    try {
        const parsed = JSON.parse(jsonString);
        if (!parsed.coreDNA || !Array.isArray(parsed.skills)) {
            return { success: false, message: "Invalid brain file format." };
        }
        saveBrain({ ...DEFAULT_BRAIN, ...parsed });
        return { success: true, message: `Brain imported — ${parsed.skills.length} skills loaded.` };
    } catch {
        return { success: false, message: "Failed to parse brain file. Make sure it's valid JSON." };
    }
}

export function resetBrain(): void {
    if (typeof window === "undefined") {
        memoryBrain = deepClone(DEFAULT_BRAIN);
        return;
    }
    localStorage.setItem(BRAIN_KEY, JSON.stringify(deepClone(DEFAULT_BRAIN)));
}
