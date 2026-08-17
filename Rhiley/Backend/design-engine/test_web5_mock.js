const { mergeBlueprints } = require('./engine/blueprintMerger');

const pBP = {
  layout: "vertical",
  designStyle: "cinematic-dark", // Schema default
  sections: [
    { type: "hero", source: "inferred_default", content: { title: "Portfolio" } },
    { type: "section", purpose: "work_gallery", source: "inferred_default", content: { text: "My works" } }
  ]
};

const iBP = {
  layout: "vertical",
  designStyle: "playful, colorful", // Visually inferred by Vision model
  colorPalette: ["#ff00ff", "#00ffff"],
  sections: [
    { type: "hero", source: "visually_inferred", content: { title: "Denis Turbin", title_source: "ocr_read" } },
    { type: "section", source: "visually_inferred", content: { description: "Designer", description_source: "ocr_read" } }
  ]
};

const merged = mergeBlueprints(pBP, iBP, "hybrid_image_vague");
console.log(JSON.stringify(merged, null, 2));
