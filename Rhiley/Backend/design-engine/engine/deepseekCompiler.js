const axios = require("axios");
const { NIM_BASE_URL, NIM_API_KEY, CODING_MODEL } = require("../config/models");

// ─── Deterministic Prompt Builder ─────────────────────────────────────────────
// Instruct the model to use self-contained inline Tailwind and Framer Motion.
function buildCompilerPrompt({ mappedSections, designStyle, motionPreset }) {
  const sectionList = mappedSections
    .map((s, i) => `${i + 1}. id="${s.slotName}" — ${s.label || s.slotName}`)
    .join("\n");

  return `You are a deterministic React TypeScript UI compiler.

Environment:
- React (Web, TSX)
- Tailwind CSS
- Framer Motion
- Only allowed elements: div, section, h1, h2, p, button
- No React Native
- No styled-components
- No markdown
- No comments
- Output valid TSX only

STRICT COMPONENT ENFORCEMENT:
You must NOT:
- Import from "@/ui-lib/*" or any non-standard local path.
- Assume any external design system files exist.
- Use made-up variables like designTokens or motionPresets.
- Invent layout patterns that aren't possible with Tailwind.

You must ONLY:
- Use inline Tailwind CSS classes for ALL styling.
- Define Framer Motion animations inline using initial/animate/transition props.
- Import directly from installed npm packages (e.g., framer-motion, lucide-react).

Structural Rules:
- Export default function Component().
- Create exactly ${mappedSections.length} sections.
- Wrap each section in <section id="{slotName}">.
- Do not change order.
- Do not invent sections.

${designStyle === "cinematic-dark"
      ? `If designStyle = "cinematic-dark":
- Use dark background colors (bg-gray-900 or bg-black) on the root div.
- Use white or light gray text (text-white, text-gray-200) for headings.
- Use an accent color (e.g. text-blue-500 or bg-blue-600) for buttons and highlights.
- Use Tailwind shadow classes (shadow-2xl) and border radius (rounded-2xl) on cards.
- Keep layout centered and dramatic.`
      : ""
    }

${motionPreset === "staggerRise"
      ? `If motionPreset = "staggerRise":
- Import { motion } from "framer-motion".
- Use staggerChildren in transition for parent containers.
- Use y: 20, opacity: 0 for initial state, and y: 0, opacity: 1 for animate state on children.
- Use inline animation properties.`
      : ""
    }

Required imports (exactly these or similar standard packages, no local files):
import { motion } from "framer-motion"

Sections to generate (in this exact order):
${sectionList}

DesignStyle: ${designStyle}
MotionPreset: ${motionPreset}

Output valid TSX only. No markdown fences. No explanation. No comments.`.trim();
}

// ─── Compiler ─────────────────────────────────────────────────────────────────
async function compileWithNim(payload) {
  const {
    designStyle = "cinematic-dark",
    motionPreset = "staggerRise",
    mappedSections
  } = payload;

  const prompt = buildCompilerPrompt({ mappedSections, designStyle, motionPreset });

  console.log("[nimCompiler] Sending prompt to NIM...");

  const response = await axios.post(
    `${NIM_BASE_URL}/chat/completions`,
    {
      model: CODING_MODEL,
      messages: [
        { role: "user", content: prompt }
      ],
      stream: false,
      temperature: 0.1,
      max_tokens: 8192
    },
    { 
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NIM_API_KEY}`
      }
    }
  );

  let output = response.data?.choices?.[0]?.message?.content || "";

  // Strip markdown fences if model adds them
  output = output.replace(/```[a-z]*\n?/gi, "");
  output = output.replace(/```/g, "");
  output = output.trim();

  // Next.js App Router requires "use client" for Framer Motion
  if (!output.includes('"use client"') && !output.includes("'use client'")) {
    output = '"use client";\n\n' + output;
  }

  // Safety guard
  if (!output || output.length < 200) {
    require('fs').writeFileSync('raw_model_response.json', JSON.stringify(response.data, null, 2));
    console.error("[nimCompiler] Raw response:", response.data);
    throw new Error("Compiled output too small or empty — model may have failed");
  }

  const tokens = response.data?.usage?.completion_tokens || "unknown";
  console.log(`[nimCompiler] Compilation successful, output length: ${output.length}, completion tokens: ${tokens}`);

  return output;
}

module.exports = {
  buildCompilerPrompt,
  compileWithNim
};
