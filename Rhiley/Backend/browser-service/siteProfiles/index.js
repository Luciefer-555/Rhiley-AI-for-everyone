/**
 * Rhiley Browser Intelligence — Site Profiles
 *
 * Each profile teaches the scraper HOW to extract code from a specific site.
 * Falls back to the "generic" profile for any unknown URL.
 */

const PROFILES = {
  // ── React Bits ─────────────────────────────────────────────────────────────
  "react-bits.dev": {
    name: "React Bits",
    waitFor: ".component-showcase, [data-component], pre code",
    codeSelectors: ["pre code", ".shiki code", "[data-rehype-pretty-code-fragment] code"],
    previewSelector: ".preview-container, .component-preview, iframe",
    animationLibraries: ["framer-motion", "motion"],
    techStack: ["react", "typescript", "tailwind"],
    notes: "Code is in syntax-highlighted blocks. Multiple tabs may exist (preview/code).",
  },

  // ── Skiper UI ──────────────────────────────────────────────────────────────
  "skiper.dev": {
    name: "Skiper UI",
    waitFor: "[data-component], .component-container, pre",
    codeSelectors: ["pre code", ".code-block code", ".hljs"],
    previewSelector: ".demo-container, .preview",
    animationLibraries: ["framer-motion", "radix-ui"],
    techStack: ["react", "typescript", "tailwind", "radix-ui"],
    notes: "Skiper uses Radix primitives. Extract both the component and its CSS vars.",
  },

  // ── Aceternity UI ──────────────────────────────────────────────────────────
  "ui.aceternity.com": {
    name: "Aceternity UI",
    waitFor: ".tab-content, pre code, [role=tabpanel]",
    codeSelectors: ["pre code", ".code-snippet code", ".token-line"],
    previewSelector: ".preview-card, .bg-dot-black",
    animationLibraries: ["framer-motion", "tailwind-merge", "clsx"],
    techStack: ["react", "typescript", "tailwind", "framer-motion"],
    notes: "Has tabs for Preview / Code. Click code tab first if needed.",
  },

  // ── Magic UI ───────────────────────────────────────────────────────────────
  "magicui.design": {
    name: "Magic UI",
    waitFor: "pre code, .code-block",
    codeSelectors: ["pre code"],
    previewSelector: ".demo-wrapper, .rounded-xl",
    animationLibraries: ["framer-motion", "motion"],
    techStack: ["react", "tailwind", "framer-motion"],
    notes: "Similar to Aceternity. Look for the source tab.",
  },

  // ── Watermelon UI ──────────────────────────────────────────────────────────
  "watermelon-ui.com": {
    name: "Watermelon UI",
    waitFor: "pre, code",
    codeSelectors: ["pre code", ".code-block"],
    previewSelector: ".preview",
    animationLibraries: ["framer-motion"],
    techStack: ["react", "tailwind"],
    notes: "Straightforward component site.",
  },

  // ── Shadcn UI ──────────────────────────────────────────────────────────────
  "ui.shadcn.com": {
    name: "Shadcn UI",
    waitFor: "[data-slot=code], pre code",
    codeSelectors: ["pre code", "figure code"],
    previewSelector: ".preview, [data-chart]",
    animationLibraries: ["framer-motion", "radix-ui"],
    techStack: ["react", "typescript", "tailwind", "radix-ui", "lucide-react"],
    notes: "CLI-first, code blocks are in tabs.",
  },

  // ── Framer Motion Docs ──────────────────────────────────────────────────────
  "www.framer.com": {
    name: "Framer Motion",
    waitFor: "pre code",
    codeSelectors: ["pre code", ".codeBlock code"],
    previewSelector: ".preview",
    animationLibraries: ["framer-motion"],
    techStack: ["react", "framer-motion"],
    notes: "Direct source. Usually clean, minimal code.",
  },

  // ── GENERIC fallback ───────────────────────────────────────────────────────
  generic: {
    name: "Generic",
    waitFor: "pre code, code",
    codeSelectors: [
      "pre code",
      "code.language-tsx",
      "code.language-jsx",
      "code.language-typescript",
      "code.language-javascript",
      ".shiki code",
      ".hljs",
    ],
    previewSelector: null,
    animationLibraries: [],
    techStack: [],
    notes: "Generic fallback — extracts any code blocks found on the page.",
  },
};

/**
 * Returns the best matching profile for a given URL.
 * Falls back to "generic" if no hostname match found.
 */
function getProfile(url) {
  try {
    const hostname = new URL(url).hostname;
    for (const [key, profile] of Object.entries(PROFILES)) {
      if (key !== "generic" && hostname.includes(key)) {
        return { ...profile, matchedKey: key };
      }
    }
  } catch (_) {}
  return { ...PROFILES.generic, matchedKey: "generic" };
}

module.exports = { getProfile, PROFILES };
