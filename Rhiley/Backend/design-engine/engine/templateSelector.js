const fs = require("fs");
const path = require("path");

const registryPath = path.join(
  __dirname,
  "../../UI COMP/ui-library-registry.json"
);

function loadRegistry() {
  const raw = fs.readFileSync(registryPath, "utf-8");
  return JSON.parse(raw);
}

function scoreTemplate(template, blueprint) {
  if (!Array.isArray(template.slots)) return 0;

  let score = 0;

  blueprint.sections.forEach((section) => {
    template.slots.forEach((slot) => {
      if (
        Array.isArray(slot.allowedTypes) &&
        slot.allowedTypes.includes(section.type)
      ) {
        score += 1;
      }
    });
  });

  return score;
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

  let best = null;
  let bestScore = -1;

  candidates.forEach((template) => {
    const score = scoreTemplate(template, blueprint);
    if (score > bestScore) {
      best = template;
      bestScore = score;
    }
  });

  return best;
}

module.exports = {
  selectTemplate
};
