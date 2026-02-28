"use client";

import { addSkill, getSkillCount, type SkillBlock } from "./brainManager";

const OLLAMA = "http://localhost:11434";
const REWIRE_TIMEOUT_MS = 30_000; // 30 second max

// ── DETECT REWIRE INTENT ──────────────────────────────────

const REWIRE_PATTERNS = [
    /rewire (yourself|your brain|rhiley)/i,
    /train (yourself|rhiley|your brain)/i,
    /get better at/i,
    /learn to (write|build|create|make)/i,
    /specialize in/i,
    /become (expert|great|world.?class|best) at/i,
    /upgrade your (brain|skills|ability)/i,
    /from now on.*(always|never|use|write|build)/i,
    /make yourself better at/i,
    /focus on being/i,
    /master (the art of|how to)/i,
];

export function isRewireCommand(message: string): boolean {
    return REWIRE_PATTERNS.some(p => p.test(message));
}

// ── GENERATE SKILL BLOCK via DeepSeek ────────────────────

export async function generateSkillBlock(
    userRequest: string
): Promise<{ skill: SkillBlock | null; wasReinforced: boolean; error?: string }> {

    const system = `You are Rhiley's brain architect.
Generate a skill block as valid JSON ONLY.
No explanation. No markdown fences. No preamble. Just the raw JSON object.

Required JSON shape:
{
  "name": "Short skill name max 30 chars (e.g. GSAP Scroll Expert)",
  "trigger": ["keyword1", "keyword2", "keyword3", "keyword4"],
  "systemInject": "Specific technical instructions — at least 300 chars. Include exact code patterns, library imports, and rules Rhiley must follow when this skill activates.",
  "codePatterns": ["Pattern 1", "Pattern 2", "Pattern 3"],
  "libraries": ["library-name"]
}

Rules for systemInject:
- Be extremely specific and technical
- Include real code snippets where helpful
- Max 800 characters total
- Focus on what makes THIS skill unique`;

    try {
        // Race against timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REWIRE_TIMEOUT_MS);

        const res = await fetch(`${OLLAMA}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
                model: "deepseek-coder",
                system,
                prompt: `Generate skill block for this rewire request: "${userRequest}"`,
                stream: false,
                options: { temperature: 0.2, num_predict: 800 },
            }),
        });

        clearTimeout(timeout);

        if (!res.ok) {
            return { skill: null, wasReinforced: false, error: "Ollama returned an error. Make sure it's running." };
        }

        const data = await res.json();
        const raw = (data.response ?? "").trim();

        // Extract JSON — handle cases where model wraps in markdown
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { skill: null, wasReinforced: false, error: "Could not parse skill JSON from model output." };
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Validate required fields
        if (!parsed.name || !Array.isArray(parsed.trigger) || !parsed.systemInject) {
            return { skill: null, wasReinforced: false, error: "Skill block missing required fields." };
        }

        // Save to brain
        const { skill, wasReinforced } = addSkill({
            name: String(parsed.name).slice(0, 30),
            trigger: (parsed.trigger as string[]).slice(0, 8),
            systemInject: String(parsed.systemInject),
            codePatterns: Array.isArray(parsed.codePatterns) ? parsed.codePatterns.slice(0, 5) : [],
            libraries: Array.isArray(parsed.libraries) ? parsed.libraries : [],
        });

        return { skill, wasReinforced, error: undefined };

    } catch (err: any) {
        if (err?.name === "AbortError") {
            return { skill: null, wasReinforced: false, error: "Rewire timed out after 30 seconds. Try again." };
        }
        if (err?.message?.includes("fetch")) {
            return { skill: null, wasReinforced: false, error: "Cannot reach Ollama. Make sure it's running on port 11434." };
        }
        return { skill: null, wasReinforced: false, error: `Rewire failed: ${err?.message ?? "unknown error"}` };
    }
}

// ── RESPONSE FORMATTER — Qwen writes these ───────────────

export function formatRewireSuccess(skill: SkillBlock, wasReinforced: boolean): string {
    const count = getSkillCount();
    const action = wasReinforced
        ? `🔁 **Skill reinforced:** ${skill.name} (trained ${skill.trainCount}x now)`
        : `🧠 **Brain rewired — new skill installed:** ${skill.name}`;

    return `${action}

**Activates when you mention:** ${skill.trigger.slice(0, 4).join(", ")}
**Libraries:** ${skill.libraries.length > 0 ? skill.libraries.join(", ") : "none specific"}

From now on I'll apply **${skill.name}** expertise automatically whenever it's relevant. You don't need to ask.

*${count} skill${count !== 1 ? "s" : ""} total in brain — type "show my skills" to see all of them.*`;
}

export function formatRewireError(error: string): string {
    return `⚠️ **Brain rewire failed**

${error}

Try being more specific:
*"rewire yourself to write GSAP scroll animations with ScrollTrigger"*`;
}

export function formatRewireLoading(): string {
    return "🧠 Rewiring brain... generating skill block...";
}
