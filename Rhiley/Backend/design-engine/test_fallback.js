const fs = require('fs');
const { selectTemplate } = require('./engine/templateSelector');

const web1_blueprint = {
  "layout": "vertical",
  "designStyle": "dark, minimal",
  "colorPalette": ["#000000", "#0011ff", "#ffffff"],
  "sections": [
    { "type": "section" },
    { "type": "section" }
  ]
};

const web2_blueprint = {
  "layout": "vertical",
  "designStyle": "minimalist, high contrast",
  "colorPalette": ["#000000", "#ffffff", "#808080"],
  "sections": [
    { "type": "hero" }
  ]
};

console.log("WEB1 Template Selection:");
const web1_res = selectTemplate({ blueprint: web1_blueprint, target: "react-ts", mode: "standard" });
console.log(`- ID: ${web1_res.id}`);
console.log(`- Reason: ${web1_res.selection_reason}`);

console.log("\nWEB2 Template Selection:");
const web2_res = selectTemplate({ blueprint: web2_blueprint, target: "react-ts", mode: "standard" });
console.log(`- ID: ${web2_res.id}`);
console.log(`- Reason: ${web2_res.selection_reason}`);
