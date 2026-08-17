const fs = require('fs');
const path = require('path');

const registryPath = path.join(__dirname, "../UI COMP/ui-library-registry.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"));

function scoreTemplate(template, blueprint) {
  if (!Array.isArray(template.slots) || template.slots.length === 0) return 0;
  
  let matches = 0;
  const usedSlots = new Set();
  
  blueprint.sections.forEach((section) => {
    for (let i = 0; i < template.slots.length; i++) {
      const slot = template.slots[i];
      if (usedSlots.has(i)) continue;
      
      if (Array.isArray(slot.allowedTypes)) {
        if (slot.allowedTypes.includes(section.type) || 
           (section.type === "contentBlock" && slot.allowedTypes.includes("section"))) {
          matches += 1;
          usedSlots.add(i);
          break;
        }
      }
    }
  });
  return matches / Math.max(template.slots.length, blueprint.sections.length);
}

const target = "react-ts";

function runScoring(name, blueprint) {
  let candidates = registry.projects.filter(p => p.target === target && p.layout === blueprint.layout);
  const scores = candidates.map(t => {
    return { id: t.id, score: scoreTemplate(t, blueprint) };
  }).sort((a, b) => b.score - a.score);

  console.log(`\nTemplate Scoring Breakdown for ${name}:`);
  scores.slice(0, 10).forEach(s => console.log(`- ${s.id}: ${s.score.toFixed(2)}`));
}

const bpVague = {
  layout: "vertical",
  sections: [
    { type: "hero" },
    { type: "section" },
    { type: "section" },
    { type: "section" },
    { type: "section" },
    { type: "nav" }
  ]
};

const bpDetailed = {
  layout: "vertical",
  sections: [
    { type: "hero" },
    { type: "section" },
    { type: "section" },
    { type: "nav" },
    { type: "section" }
  ]
};

runScoring("Hybrid Vague (bakery)", bpVague);
runScoring("Hybrid Detailed (fitness)", bpDetailed);
