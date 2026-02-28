// ─── Output Validator ─────────────────────────────────────────────────────────
// Validates that compiled TSX output satisfies all design system constraints.

function validateReactOutput(code, mappedSections) {
  if (!code || typeof code !== "string") {
    return { valid: false, reason: "Empty output" };
  }

  // 1. Must have a default export named Component
  if (!code.includes("export default function Component")) {
    return { valid: false, reason: "Missing export default function Component" };
  }

  // 2. Must import from the design system — no raw token injection allowed
  if (!code.includes(`from "@/ui-lib/designSystem"`)) {
    return { valid: false, reason: "Missing @/ui-lib/designSystem import" };
  }

  // 3. Must NOT contain inline animation objects (hallucination guard)
  const inlineAnimationPattern = /initial=\{\{|animate=\{\{|transition=\{\{/;
  if (inlineAnimationPattern.test(code)) {
    return { valid: false, reason: "Inline animation objects detected — must use motionPresets from design system" };
  }

  // 4. Every mapped section id must appear in the output
  const expectedSections = mappedSections.length;
  let matchedCount = 0;

  mappedSections.forEach((m) => {
    if (code.includes(m.slotName)) {
      matchedCount++;
    }
  });

  if (matchedCount !== expectedSections) {
    return {
      valid: false,
      reason: `Section mismatch: expected ${expectedSections}, found ${matchedCount}`
    };
  }

  return { valid: true };
}

module.exports = { validateReactOutput };
