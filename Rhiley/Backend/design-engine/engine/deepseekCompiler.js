const axios = require("axios");

// ─── Deterministic Prompt Builder ─────────────────────────────────────────────
// DO NOT pass raw theme JSON to the model.
// All tokens/presets come from @/ui-lib/designSystem — period.
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

STRICT DESIGN SYSTEM ENFORCEMENT:
You must NOT:
- Define inline animation objects.
- Create new motion variants.
- Create new Tailwind utility combinations.
- Create new color values.
- Modify or extend the design system.
- Invent layout patterns.

You must ONLY:
- Import from "@/ui-lib/designSystem".
- Use designTokens by exact key.
- Use motionPresets by exact key.
- Spread motion presets (never redefine).
- Apply spacing using designTokens.spacing.section and designTokens.spacing.container.
- Apply palette using designTokens.palettes.cinematicDark.

Structural Rules:
- Export default function Component().
- Create exactly ${mappedSections.length} sections.
- Wrap each section in <section id="{slotName}">.
- Do not change order.
- Do not invent sections.

${designStyle === "cinematic-dark"
      ? `If designStyle = "cinematic-dark":
- Use designTokens.palettes.cinematicDark.background on the root div.
- Use designTokens.palettes.cinematicDark.textPrimary for headings.
- Use designTokens.palettes.cinematicDark.accent for accent text.
- Use designTokens.shadows["2xl"] and designTokens.radius["2xl"] on cards.
- Keep layout centered and dramatic.`
      : ""
    }

${motionPreset === "staggerRise"
      ? `If motionPreset = "staggerRise":
- Import { motion } from "framer-motion".
- Spread motionPresets.staggerRise.container onto motion.div wrappers: {...motionPresets.staggerRise.container}
- Use variants={motionPresets.staggerRise.item} on motion.h1, motion.h2, motion.p, motion.button children.
- Do NOT redefine animation properties.
- Do NOT use initial/animate/transition inline.`
      : ""
    }

Required imports (exactly these, no others):
import { motion } from "framer-motion"
import { designTokens, motionPresets } from "@/ui-lib/designSystem"

Sections to generate (in this exact order):
${sectionList}

DesignStyle: ${designStyle}
MotionPreset: ${motionPreset}

Output valid TSX only. No markdown fences. No explanation. No comments.`.trim();
}

// ─── Compiler ─────────────────────────────────────────────────────────────────
async function compileWithDeepSeek(payload) {
  const {
    designStyle = "cinematic-dark",
    motionPreset = "staggerRise",
    mappedSections
  } = payload;

  const prompt = buildCompilerPrompt({ mappedSections, designStyle, motionPreset });

  console.log("[deepseekCompiler] Sending prompt to Ollama...");

  const response = await axios.post(
    "http://localhost:11434/api/generate",
    {
      model: "deepseek-coder:6.7b",
      prompt,
      stream: false,
      options: {
        temperature: 0.1,
        top_p: 0.8
      }
    },
    { timeout: 60000 }
  );

  let output = response.data.response;

  // Strip markdown fences if model adds them
  output = output.replace(/```[a-z]*\n?/gi, "");
  output = output.replace(/```/g, "");
  output = output.trim();

  // Safety guard
  if (!output || output.length < 200) {
    console.error("[deepseekCompiler] Raw response:", response.data.response);
    throw new Error("Compiled output too small or empty — model may have failed");
  }

  console.log("[deepseekCompiler] Compilation successful, output length:", output.length);

  return output;
}

module.exports = {
  buildCompilerPrompt,
  compileWithDeepSeek
};
