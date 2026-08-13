/**
 * Rhiley Browser Intelligence — Code Cleaner
 *
 * Sanitizes raw scraped code before it's sent to Qwen for adaptation.
 * Removes noise, normalises imports, and strips site-specific branding.
 */

/**
 * Main entry point: cleans raw scraped code text.
 * @param {string} rawCode
 * @param {object} profile - site profile from siteProfiles/index.js
 * @returns {{ code: string; language: string; imports: string[] }}
 */
function cleanCode(rawCode, profile = {}) {
  if (!rawCode || typeof rawCode !== "string") {
    return { code: "", language: "tsx", imports: [] };
  }

  let code = rawCode;

  // 1. Strip markdown code fences if present
  code = code.replace(/^```(?:tsx?|jsx?|javascript|typescript|react)?\n?/gim, "");
  code = code.replace(/\n?```$/gim, "");

  // 2. Strip HTML entities
  code = code
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // 3. Remove Playwright/browser injected scripts
  code = code.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // 4. Trim excessive whitespace / blank lines (max 2 consecutive)
  code = code.replace(/\n{3,}/g, "\n\n");

  // 5. Detect language
  const language = detectLanguage(code);

  // 6. Extract import statements
  const imports = extractImports(code);

  // 7. Remove duplicate imports that the AI will re-add
  // (keep them — we'll pass them as metadata to the LLM instead)

  // 8. Strip site-specific dummy data placeholders
  code = stripBranding(code, profile.name);

  return {
    code: code.trim(),
    language,
    imports,
  };
}

/**
 * Detect whether the code is TSX, JSX, CSS, etc.
 */
function detectLanguage(code) {
  if (/import\s+.*from\s+['"]react['"]/i.test(code)) return "tsx";
  if (/<[A-Z][A-Za-z]*/.test(code) && /return\s*\(/.test(code)) return "jsx";
  if (/^\.[\w-]+\s*\{/m.test(code)) return "css";
  return "tsx";
}

/**
 * Extract all import statements from code.
 */
function extractImports(code) {
  const importLines = [];
  const importRegex = /^import\s+.+from\s+['"'].+['"'];?/gm;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    importLines.push(match[0].trim());
  }
  return [...new Set(importLines)];
}

/**
 * Strip site-specific branding text and placeholder content.
 */
function stripBranding(code, siteName) {
  if (!siteName) return code;

  const brandPatterns = {
    "Aceternity UI": [
      /aceternity/gi,
      /ui\.aceternity\.com/gi,
    ],
    "React Bits": [
      /react-bits\.dev/gi,
    ],
    "Skiper UI": [
      /skiper\.dev/gi,
    ],
    "Magic UI": [
      /magicui\.design/gi,
    ],
  };

  const patterns = brandPatterns[siteName] || [];
  for (const pattern of patterns) {
    code = code.replace(pattern, "");
  }

  return code;
}

/**
 * Merge multiple code blocks extracted from a page into one clean string.
 * Prefers TSX/JSX blocks over plain CSS or HTML.
 */
function mergeCodeBlocks(blocks) {
  if (!blocks || blocks.length === 0) return "";

  // Sort: prefer longer blocks with React imports
  const ranked = blocks
    .map((b) => ({
      code: b,
      score:
        (b.includes("import") ? 10 : 0) +
        (b.includes("React") ? 5 : 0) +
        (b.includes("export default") ? 5 : 0) +
        (b.includes("framer-motion") ? 3 : 0) +
        b.length / 100,
    }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.code || blocks[0] || "";
}

module.exports = { cleanCode, mergeCodeBlocks, detectLanguage, extractImports };
