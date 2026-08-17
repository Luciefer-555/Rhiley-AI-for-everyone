const axios = require("axios");
const fs = require("fs");
const path = require("path");

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Imports
const { CODING_MODEL, NIM_BASE_URL, NIM_API_KEY } = require("./config/models");
const { routeIntent } = require("./intentRouter");
const { generateVagueBlueprint } = require("./engine/blueprintFromVague");
const { generateImageBlueprint } = require("./engine/blueprintFromImage");
const { mergeBlueprints } = require("./engine/blueprintMerger");
const { selectTemplate } = require("./engine/templateSelector");
const { mapBlueprintToTemplate } = require("./engine/blueprintMapper");
const { compileWithNim } = require("./engine/deepseekCompiler");
const { validateReactOutput } = require("./engine/outputValidator");

const OUTPUT_DIR = path.join(__dirname, "test-output");

// Ensure output dir exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function runPipeline() {
  console.log("=== Rhiley Full Pipeline Test ===\n");

  const arg1 = process.argv[2];
  const arg2 = process.argv[3];
  
  let userPrompt = null;
  let imageBuffer = null;

  // Check if arg1 is an image
  if (arg1 && (arg1.endsWith(".png") || arg1.endsWith(".jpg") || arg1.endsWith(".jpeg"))) {
    imageBuffer = fs.readFileSync(arg1);
    console.log(`[1] User provided image: ${arg1}\n`);
    if (arg2) {
      userPrompt = arg2;
      console.log(`[1] User provided prompt: "${userPrompt}"\n`);
    }
  } else if (arg1) {
    userPrompt = arg1;
    console.log(`[1] User Prompt: "${userPrompt}"\n`);
  } else {
    userPrompt = "Build me a landing page for a fitness app, hero section with headline 'Train Smarter', pricing section with 3 tiers, testimonials section";
    console.log(`[1] Default User Prompt: "${userPrompt}"\n`);
  }

  console.log("[1.5] Routing Intent...");
  const routeResult = await routeIntent({ prompt: userPrompt, imageBuffer });
  console.log(`✅ Router determined route: "${routeResult.route}"\n`);
  
  let blueprint;

  async function generateDetailedBlueprint(userPrompt) {
    const systemPrompt = `You are an expert UI architect. Convert the user's prompt into a JSON blueprint for a React application.
Respond ONLY with raw JSON matching this schema:
{
  "layout": "vertical",
  "designStyle": "cinematic-dark",
  "motionPreset": "staggerRise",
  "sections": [
    { "type": "hero", "content": { "title": "Headline", "subtitle": "Optional" } },
    { "type": "section", "content": { "title": "Features" } }
  ]
}
Allowed section types: "hero", "section", "contentBlock", "nav".
Usage rules for section types:
- Use "section" for all standard flow content (e.g. pricing, testimonials, features, about, generic text/lists).
- Use "contentBlock" ONLY for highly specialized interactive widgets (e.g. 3D canvases, interactive maps). Do NOT use "contentBlock" for standard nested data like pricing tiers or testimonials.`;

    try {
      const response = await axios.post(
        `${NIM_BASE_URL}/chat/completions`,
        {
          model: CODING_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.1,
          max_tokens: 2000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${NIM_API_KEY}`
          },
          timeout: 60000
        }
      );

      let content = response.data.choices[0].message.content;
      content = content.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "").trim();
      return JSON.parse(content);
    } catch (error) {
      if (error.response) {
        console.error("API Error:", error.response.data);
      }
      throw new Error(`Failed to generate detailed blueprint: ${error.message}`);
    }
  }

  if (routeResult.route === "detailed_prompt") {
    console.log("[2] Generating Blueprint via NIM (CODING_MODEL)...");
    try {
      blueprint = await generateDetailedBlueprint(userPrompt);
      console.log("✅ Blueprint generated successfully:\n", JSON.stringify(blueprint, null, 2), "\n");
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  } else if (routeResult.route === "vague_prompt") {
    console.log("[2] Generating Vague Blueprint via Archetypes (CODING_MODEL)...");
    try {
      blueprint = await generateVagueBlueprint(userPrompt);
      console.log("✅ Vague Blueprint generated successfully:\n", JSON.stringify(blueprint, null, 2), "\n");
    } catch (error) {
      console.error("❌ Failed to generate vague blueprint.");
      console.error(error.message);
      process.exit(1);
    }
  } else if (routeResult.route === "image_only") {
    console.log("[2] Generating Image Blueprint via Vision Model...");
    try {
      blueprint = await generateImageBlueprint(imageBuffer);
      console.log("✅ Image Blueprint generated successfully:\n", JSON.stringify(blueprint, null, 2), "\n");
    } catch (error) {
      console.error("❌ Failed to generate image blueprint.");
      console.error(error.message);
      process.exit(1);
    }
  } else if (routeResult.route === "hybrid_image_detailed") {
    console.log("[2] Generating Hybrid Blueprint (Image + Detailed Prompt)...");
    try {
      const [pBP, iBP] = await Promise.all([
        generateDetailedBlueprint(userPrompt),
        generateImageBlueprint(imageBuffer)
      ]);
      blueprint = mergeBlueprints(pBP, iBP, routeResult.route);
      console.log("✅ Hybrid Blueprint merged successfully:\n", JSON.stringify(blueprint, null, 2), "\n");
    } catch (error) {
      console.error("❌ Failed to generate hybrid blueprint.");
      console.error(error.message);
      process.exit(1);
    }
  } else if (routeResult.route === "hybrid_image_vague") {
    console.log("[2] Generating Hybrid Blueprint (Image + Vague Prompt)...");
    try {
      const [pBP, iBP] = await Promise.all([
        generateVagueBlueprint(userPrompt),
        generateImageBlueprint(imageBuffer)
      ]);
      blueprint = mergeBlueprints(pBP, iBP, routeResult.route);
      console.log("✅ Hybrid Blueprint merged successfully:\n", JSON.stringify(blueprint, null, 2), "\n");
    } catch (error) {
      console.error("❌ Failed to generate hybrid blueprint.");
      console.error(error.message);
      process.exit(1);
    }
  } else {
    console.error(`❌ not yet implemented: ${routeResult.route}`);
    process.exit(1);
  }

  // Ensure blueprint structure is safe
  if (!blueprint.sections || !Array.isArray(blueprint.sections)) {
    console.error("❌ Blueprint validation failed: Missing sections array.");
    process.exit(1);
  }

  console.log("[3] Template Selection & Mapping...");
  let template, mapping;
  try {
    template = selectTemplate({ blueprint, target: "react-ts", mode: "standard" });
    console.log(`✅ Selected Template: ${template.id} (from batch ${template.batch})`);
    if (template.selection_reason) {
      console.log(`   └─ Reason: ${template.selection_reason}`);
    }
    mapping = mapBlueprintToTemplate(blueprint, template);
    console.log(`✅ Mapped ${mapping.mappedSections.length} sections to template slots.\n`);
  } catch (error) {
    console.error("❌ Template matching failed:", error.message);
    process.exit(1);
  }

  console.log("[4] Compiling TSX Code via NIM...");
  let generatedCode;
  try {
    generatedCode = await compileWithNim({
      designStyle: blueprint.designStyle || "cinematic-dark",
      motionPreset: blueprint.motionPreset || "staggerRise",
      mappedSections: mapping.mappedSections
    });
    
    console.log("✅ Code compiled successfully. Validating...");
    let result = validateReactOutput(generatedCode, mapping.mappedSections);
    
    if (!result.valid) {
      console.warn("⚠️ Validation failed:", result.reason);
      console.log("Retrying compilation once...");
      generatedCode = await compileWithNim({
        designStyle: blueprint.designStyle || "cinematic-dark",
        motionPreset: blueprint.motionPreset || "staggerRise",
        mappedSections: mapping.mappedSections
      });
      result = validateReactOutput(generatedCode, mapping.mappedSections);
      if (!result.valid) {
        throw new Error(`Validation failed after retry: ${result.reason}`);
      }
    }
    console.log("✅ TSX Output Validated.");
  } catch (error) {
    console.error("❌ Compilation failed:", error.message);
    process.exit(1);
  }

  console.log("\n[5] Scaffolding Next.js Project...");
  
  // Write the TSX
  const appDir = path.join(OUTPUT_DIR, "app");
  if (!fs.existsSync(appDir)) fs.mkdirSync(appDir);
  
  fs.writeFileSync(path.join(appDir, "page.tsx"), generatedCode, "utf-8");
  
  // Write postcss config
  const postcssConfig = `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }`;
  fs.writeFileSync(path.join(OUTPUT_DIR, "postcss.config.js"), postcssConfig);
  
  console.log(`✅ Wrote generated code to test-output/app/page.tsx`);

  // Write Next.js boilerplate
  fs.writeFileSync(path.join(OUTPUT_DIR, "package.json"), JSON.stringify({
    "name": "rhiley-generated-test",
    "version": "1.0.0",
    "private": true,
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "start": "next start"
    },
    "dependencies": {
      "next": "14.2.3",
      "react": "^18",
      "react-dom": "^18",
      "framer-motion": "^11",
      "lucide-react": "^0.378.0"
    },
    "devDependencies": {
      "typescript": "^5",
      "@types/node": "^20",
      "@types/react": "^18",
      "@types/react-dom": "^18",
      "postcss": "^8",
      "tailwindcss": "^3.4.1",
      "autoprefixer": "^10.4.19"
    }
  }, null, 2));

  fs.writeFileSync(path.join(OUTPUT_DIR, "next.config.js"), `
/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;
  `.trim());

  fs.writeFileSync(path.join(appDir, "layout.tsx"), `
import './globals.css'
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
  `.trim());

  fs.writeFileSync(path.join(appDir, "globals.css"), `
@tailwind base;
@tailwind components;
@tailwind utilities;
  `.trim());

  fs.writeFileSync(path.join(OUTPUT_DIR, "tailwind.config.js"), `
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
  `.trim());

  console.log("✅ Project scaffolded successfully in /test-output.");
  console.log("\n--- GENERATED HERO SECTION CODE (First 30 lines) ---");
  console.log(generatedCode.split("\n").slice(0, 30).join("\n") + "\n...");
  console.log("\nPipeline test complete.");
}

runPipeline().catch(console.error);
