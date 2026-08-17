const fs = require('fs');
const path = require('path');
const registryPath = path.join(__dirname, '../UI COMP/ui-library-registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));

function scoreTemplate(template, blueprint) {
  if (!Array.isArray(template.slots) || template.slots.length === 0) return 0;
  let matches = 0;
  const usedSlots = new Set();
  blueprint.sections.forEach((section) => {
    for (let i = 0; i < template.slots.length; i++) {
      const slot = template.slots[i];
      if (usedSlots.has(i)) continue;
      if (Array.isArray(slot.allowedTypes)) {
        if (slot.allowedTypes.includes(section.type) || (section.type === 'contentBlock' && slot.allowedTypes.includes('section'))) {
          matches += 1;
          usedSlots.add(i);
          break;
        }
      }
    }
  });
  return matches / Math.max(template.slots.length, blueprint.sections.length);
}

const tests = {
  "Phase 2 detailed fitness (3 sections)": [
    { type: "hero" }, { type: "section" }, { type: "section" }
  ],
  "Phase 3 vague bakery (6 sections)": [
    { type: "hero" }, { type: "section" }, { type: "section" }, { type: "section" }, { type: "section" }, { type: "nav" }
  ],
  "Phase 3 vague portfolio (5 sections)": [
    { type: "hero" }, { type: "section" }, { type: "section" }, { type: "section" }, { type: "nav" }
  ],
  "Phase 3 vague fitness (4 sections)": [
    { type: "hero" }, { type: "section" }, { type: "section" }, { type: "nav" }
  ],
  "Phase 5 hybrid vague WEB3 + bakery (6 sections)": [
    { type: "hero" }, { type: "section" }, { type: "section" }, { type: "section" }, { type: "section" }, { type: "nav" }
  ],
  "Phase 5 hybrid detailed WEB4 + fitness (5 sections)": [
    { type: "hero" }, { type: "section" }, { type: "section" }, { type: "nav" }, { type: "section" }
  ]
};

for (const [name, sections] of Object.entries(tests)) {
  const bp = { layout: "vertical", sections };
  let candidates = registry.projects.filter(p => p.target === 'react-ts' && p.layout === bp.layout);
  const scores = candidates.map(t => { return { id: t.id, score: scoreTemplate(t, bp) }; })
                           .sort((a,b) => b.score - a.score);
  
  const uniqueScores = [...new Set(scores.map(s => s.score.toFixed(2)))];
  const winner = scores[0];
  const runnerUp = scores.find(s => s.score.toFixed(2) === uniqueScores[1]);
  
  console.log(`✅ ${name}`);
  console.log(`   └─ Winner: ${winner.id} (${winner.score.toFixed(2)})`);
  if (runnerUp) {
    console.log(`   └─ Runner-up gap: ${runnerUp.id} (${runnerUp.score.toFixed(2)})`);
  }
  console.log("-----------------");
}
