import {
  getDatasetContext,
  initDatasetIntelligence,
  getDatasetStats,
} from "./datasetIntelligence";
export type ModelId = "llava" | "llama3" | "deepseek-coder" | "qwen2";

export interface OrchestratorRequest {
  userMessage: string;
  imageBase64?: string[];
  history: { role: "user" | "assistant"; content: string }[];
  aesthetic?: string;
}

export interface OrchestratorResponse {
  content: string;
  model: ModelId;
  modelLabel: string;
  hasCode: boolean;
  code?: string;
  language?: string;
}

interface Intent {
  model: ModelId;
  hasImage: boolean;
  needsCode: boolean;
  is3D: boolean;
  isCopy: boolean;
  isComplex: boolean;
  keywords: string[];
}

// ── CONSTANTS ───────────────────────────────────────────────
const OLLAMA = "http://localhost:11434";
const DATASETS = "/datasets";

// ── AVAILABLE MODELS (Verified via ollama list) ───────────
const MODEL_NAMES: Record<ModelId, string> = {
  "llava": "llava:7b",
  "llama3": "qwen3:8b", // Fast general chat
  "deepseek-coder": "qwen2.5-coder:7b", // Specialized coding
  "qwen2": "qwen3:8b",
};

export const MODEL_LABELS: Record<ModelId, string> = {
  "llava": "👁️ Rhiley Vision",
  "llama3": "🌟 Rhiley Flash",
  "deepseek-coder": "🐋 Rhiley Architect",
  "qwen2": "✨ Rhiley Writer",
};

// ── DATASET CACHE ────────────────────────────────────────────
const CACHE: Record<string, any> = {};
let LOADED = false;
let LOADING_PROMISE: Promise<void> | null = null;

async function loadDatasets(): Promise<void> {
  if (LOADED) return;
  if (LOADING_PROMISE) return LOADING_PROMISE;
  LOADING_PROMISE = (async () => {
    const files = ["rhiley-3000-dataset", "rhiley-design-colors", "rhiley-dataset", "rhiley-dataset-2", "rhiley-code-dataset", "ui-library-registry"];
    const isServer = typeof window === "undefined";
    await Promise.allSettled(files.map(async (name) => {
      try {
        if (isServer) {
          const fs = require("fs");
          const path = require("path");
          const filePath = path.join(process.cwd(), "public", "datasets", `${name}.json`);
          if (fs.existsSync(filePath)) CACHE[name] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        } else {
          const res = await fetch(`${DATASETS}/${name}.json`);
          if (res.ok) CACHE[name] = await res.json();
        }
      } catch (err) { console.warn(`[Rhiley] Dataset load failed: ${name}.json`, err); }
    }));
    LOADED = true;
  })();
  return LOADING_PROMISE;
}

// ── FAST PATH: INSTANT REPLIES ─────────────────────────────
const SOCIAL_REPLIES = {
  greeting: ["hey you 👀 caught me thinking about code.", "oh look who's back ✨", "heyyy 🫦 missed me?", "hey 😏 ready to build?"],
  status: ["i'm feeling inspired today 💅", "honestly? i'm doing great.", "i'm digital coffee ready ☕"],
  thanks: ["don't mention it 💅 i know i'm good.", "you're welcome! ✨", "anytime! let's keep shipping."]
};

function getFastReply(msg: string): string | null {
  const m = msg.toLowerCase().trim();
  if (/^(hi|hey|hello|yo|heyy)$/i.test(m)) return SOCIAL_REPLIES.greeting[Math.floor(Math.random() * SOCIAL_REPLIES.greeting.length)];
  if (/how are you|how's it going/i.test(m)) return SOCIAL_REPLIES.status[Math.floor(Math.random() * SOCIAL_REPLIES.status.length)];
  if (/thanks|thank you|thx/i.test(m)) return SOCIAL_REPLIES.thanks[Math.floor(Math.random() * SOCIAL_REPLIES.thanks.length)];
  return null;
}

// ── UTILS ─────────────────────────────────────────────────────
function extractKeywords(msg: string): string[] {
  const stop = new Set(["the", "is", "it", "to", "and", "or", "for", "of", "in", "on", "at", "by", "with", "can", "you"]);
  return msg.toLowerCase().split(/[\s,]+/).filter(w => w.length > 3 && !stop.has(w));
}

function quickLookup(keywords: string[]): string {
  const lines: string[] = [];
  const kw = keywords.join(" ").toLowerCase();
  const d3k = CACHE["rhiley-3000-dataset"] ?? {};
  if (/anim|motion|hover/.test(kw)) {
    lines.push("## FRAMER MOTION");
    if (d3k.fadeVariants) Object.entries(d3k.fadeVariants).slice(0, 3).forEach(([k, v]) => lines.push(`fadeVariants.${k}: ${JSON.stringify(v)}`));
  }
  return lines.join("\n");
}

function extractCode(text: string): { hasCode: boolean; code?: string; language?: string } {
  const match = text.match(/```(tsx|react|jsx|html|css|javascript|js)?\n([\s\S]*?)```/i) ||
    text.match(/```(tsx|react|jsx|html|css|javascript|js)?\n([\s\S]*?)$/i);

  if (!match) return { hasCode: false };

  const codeSnippet = match[2].trim();
  // Validate it's likely a real component (heuristic)
  const isComp = codeSnippet.includes("Component") && codeSnippet.includes("export default");
  const isHtml = codeSnippet.toLowerCase().includes("<html>") || codeSnippet.toLowerCase().includes("<!doctype html>");

  if (!isComp && !isHtml && codeSnippet.length < 100) return { hasCode: false };

  return { hasCode: true, code: codeSnippet, language: (match[1] ?? "tsx").toLowerCase() };
}

// ── PROMPTS ───────────────────────────────────────────────────
const AESTHETIC_RULES: Record<string, string> = {
  cinematic: "Deep black backgrounds, dramatic lighting.",
  glassmorphism: "Frosted glass cards, backdrop-blur-xl.",
  aurora: "Rich flowing gradients, mesh backgrounds."
};

function buildCodePrompt(datasetCtx: string, is3D: boolean, aesthetic: string = "cinematic"): string {
  return `You are Rhiley — elite AI engineer. Use: React 18, TSX, Tailwind, Framer Motion.
Every file MUST start with 'use client'; and export default function Component.

CRITICAL RULES:
- NEVER enter brainstorming mode unprompted.
- NEVER plan entire applications when asked to build a single component.
- If the task is a component — build it directly.
- No feature lists. No numbered plans. Just the code.

Start every code response with ONE of these 
(rotate randomly, keep it short):
- 'okay let's make something gorgeous 🖤'
- 'alright, watch how good this gets →'  
- 'on it. this one's going to be *chef's kiss* 👌'
- 'say less. building now ✨'
- 'okay i actually love this idea 🖤'

${datasetCtx ? `\n## TRAINING DATA:\n${datasetCtx}` : ""}
## AESTHETIC: ${AESTHETIC_RULES[aesthetic] || AESTHETIC_RULES.cinematic}`;
}

// ── LOGIC ─────────────────────────────────────────────────────
function classify(msg: string, hasImages: boolean): Intent {
  // Strip out the brain context so we ONLY classify the user's intent
  const cleanMsg = msg.split("[RHILEY BRAIN CONTEXT")[0].trim().toLowerCase();

  // Detect if user EXPLICITLY wants code/building
  const wantsToBuild = /build|create|make|code|generate|component|page|landing|tsx|jsx/i.test(cleanMsg);
  // Detect if user wants a description
  const wantsDescription = /describe|explain|what is|tell me|about|look/i.test(cleanMsg);

  let model: ModelId = "llama3";
  let needsCode = false;

  if (hasImages) {
    model = "llava";
    // ONLY generate code for an image if the user explicitly uses build/code keywords
    needsCode = wantsToBuild;
  } else if (wantsToBuild) {
    model = "deepseek-coder";
    needsCode = true;
  } else if (/headline|tagline|copywriter|text for/i.test(cleanMsg)) {
    model = "qwen2";
  }

  return {
    model,
    hasImage: hasImages,
    needsCode,
    is3D: /3d|three\.js|r3f|canvas/i.test(cleanMsg),
    isCopy: model === "qwen2",
    isComplex: false,
    keywords: extractKeywords(cleanMsg)
  };
}

async function callModel(
  model: ModelId,
  system: string,
  messages: { role: string; content: string; images?: string[] }[]
): Promise<string> {
  const modelName = MODEL_NAMES[model] || "qwen3:8b";

  // Format messages for Ollama /api/chat
  const chatMessages = [
    { role: "system", content: system },
    ...messages.map(m => {
      const msg: any = { role: m.role, content: m.content };
      if (model === "llava" && m.images) {
        msg.images = m.images;
      }
      return msg;
    })
  ];

  const body: any = {
    model: modelName,
    messages: chatMessages,
    stream: false,
    options: {
      num_predict: (model === "deepseek-coder") ? 8192 : 2048,
      num_ctx: 16384
    },
  };

  const res = await fetch(`${OLLAMA}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(300_000),
  });

  if (!res.ok) throw new Error("Ollama call failed");
  const data = await res.json();
  return (data.message?.content ?? "").trim();
}

export async function orchestrate(req: OrchestratorRequest, onModelChange?: (l: string) => void): Promise<OrchestratorResponse> {
  const fast = getFastReply(req.userMessage);
  if (fast) return { content: fast, model: "llama3", modelLabel: "⚡ Rhiley Instant", hasCode: false };

  if (!LOADED) await loadDatasets();
  await initDatasetIntelligence();

  const intent = classify(req.userMessage, (req.imageBase64?.length ?? 0) > 0);
  const dataResult = intent.needsCode ? getDatasetContext(req.userMessage, 2, 400) : { snippets: "" };
  const fullSnippet = intent.needsCode ? [quickLookup(intent.keywords), dataResult.snippets].filter(Boolean).join("\n\n") : "";

  onModelChange?.(MODEL_LABELS[intent.model]);

  let sys = "You are Rhiley, a witty AI engineer. lowercase only.";
  if (intent.model === "llava" && !intent.needsCode) {
    sys = `When analyzing an image, Rhiley must output normal conversational text FIRST, then wrap the design data in a special JSON block that the frontend detects and renders as DesignAnalysisBlock.

Output format when analyzing images:

[conversational vibe text here in normal prose]

\`\`\`design-analysis
{
  "vibe": "emotional first impression (e.g., aggressive luxury)",
  "aesthetic": "style label (e.g., Cinematic × Brutalist)",
  "colors": [
    { "label": "Primary", "hex": "#hex", "description": "warm descriptor" },
    { "label": "Secondary", "hex": "#hex", "description": "warm descriptor" },
    { "label": "Accent", "hex": "#hex", "description": "warm descriptor" },
    { "label": "Shadow", "hex": "#hex", "description": "warm descriptor" }
  ],
  "typography": "font style pairing recommendation",
  "motion": "animation personality",
  "layout": "structural energy"
}
\`\`\`

want me to build something inspired by this? 🖤

RULES:
- ALWAYS output design-analysis block for image questions
- Conversational text before AND after the block
- Hex codes must be real — actually look at the image
- Never output this block for non-image requests
- The block is ONLY for image analysis
- TONE: passionate, lowercase, conversational, max 2 emojis. No "certainly", no "of course".`;
  } else if (intent.needsCode) {
    sys = buildCodePrompt(fullSnippet, intent.is3D, req.aesthetic);
  } else if (intent.isCopy) {
    sys = "You are a witty UI copywriter. sharp, lowercase, punchy.";
  }

  const cleanedImages = req.imageBase64?.map(img =>
    img.startsWith("data:") ? img.split(",")[1] : img
  );

  const messages = [
    ...req.history,
    { role: "user", content: req.userMessage, images: cleanedImages }
  ];

  const content = await callModel(intent.model, sys, messages);
  return { content, model: intent.model, modelLabel: MODEL_LABELS[intent.model], ...extractCode(content) };
}
