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

  // 2. Check for balanced JSX tags to detect token truncation
  function hasBalancedTags(c) {
    const withoutSelfClosing = c.replace(/<[^>]+?\/>/g, '');
    const tagsToCheck = ['div', 'section', 'h1', 'h2', 'p', 'button', 'motion.div', 'motion.h1', 'motion.h2', 'motion.p', 'motion.button'];
    for (const tag of tagsToCheck) {
      const safeTag = tag.replace('.', '\\.');
      const openCount = (withoutSelfClosing.match(new RegExp(`<${safeTag}(>|\\s)`, 'g')) || []).length;
      const closeCount = (withoutSelfClosing.match(new RegExp(`</${safeTag}>`, 'g')) || []).length;
      if (openCount !== closeCount) return false;
    }
    return true;
  }

  if (!hasBalancedTags(code) || !code.trim().endsWith("}")) {
    return { valid: false, reason: "Incomplete or unbalanced TSX output (likely token truncation)" };
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
