const fs = require("fs");
const path = require("path");
const { MIN_CONTENT_THRESHOLD } = require("../config/models");

const registryPath = path.join(
  __dirname,
  "../../UI COMP/ui-library-registry.json"
);

function loadRegistry() {
  const raw = fs.readFileSync(registryPath, "utf-8");
  return JSON.parse(raw);
}

function scoreTemplate(template, blueprint) {
  if (!Array.isArray(template.slots) || template.slots.length === 0) return 0;

  let matches = 0;
  const usedSlots = new Set();

  blueprint.sections.forEach((section) => {
    for (let i = 0; i < template.slots.length; i++) {
      const slot = template.slots[i];
      if (usedSlots.has(i)) continue;

      if (Array.isArray(slot.allowedTypes)) {
        const isExactMatch = slot.allowedTypes.includes(section.type);
        const isFallbackMatch = section.type === "contentBlock" && slot.allowedTypes.includes("section");
        
        if (isExactMatch || isFallbackMatch) {
          matches += 1;
          usedSlots.add(i);
          break; // move to next blueprint section
        }
      }
    }
  });

  return matches / Math.max(template.slots.length, blueprint.sections.length);
}

function selectTemplate({ blueprint, target, mode }) {
  const registry = loadRegistry();

  let candidates = registry.projects.filter(
    (p) =>
      p.target === target &&
      p.layout === blueprint.layout
  );

  if (mode === "3d-lite") {
    candidates = candidates.filter(
      (p) => p.stylingHints?.supports3d === true
    );
  }

  if (candidates.length === 0) {
    throw new Error("No matching templates found");
  }

  if (blueprint.layout === "vertical" && blueprint.sections.length < MIN_CONTENT_THRESHOLD) {
    const minimalTemplate = registry.projects.find((p) => p.id === "serene-hero");
    if (minimalTemplate) {
      minimalTemplate.selection_reason = "sparse_content_fallback";
      return minimalTemplate;
    }
  }

  let best = null;
  let bestScore = -1;

  candidates.forEach((template) => {
    const score = scoreTemplate(template, blueprint);
    if (score > bestScore) {
      best = template;
      bestScore = score;
    }
  });

  if (best) {
    best.selection_reason = "scored_match";
  }

  return best;
}

module.exports = {
  selectTemplate
};
