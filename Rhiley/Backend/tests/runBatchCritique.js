import fs from "fs";
import path from "path";
import { analyzeImage } from "../vision.js";
import { judgeDesign } from "../judge.js";
import { evaluatePerformance } from "../performanceEvaluator.js";

const imagesDir = "./tests/images";

async function runBatchCritique() {
  try {
    // Read all files in images directory
    const files = fs.readdirSync(imagesDir);
    
    // Filter for image files
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    console.log(`Found ${imageFiles.length} images to analyze...\n`);

    for (const filename of imageFiles) {
      try {
        const imagePath = path.join(imagesDir, filename);
        const image = fs.readFileSync(imagePath);
        const base64 = image.toString("base64");

        console.log(`Analyzing: ${filename}`);
        console.log("-".repeat(50));

        // Analyze image
        const vision = await analyzeImage(base64);
        
        // Judge design
        const critique = await judgeDesign({ 
          visionText: vision, 
          intent: "" 
        });

        // Normalize principle analysis
        const principleAnalysis = Array.isArray(critique.principle_analysis) 
          ? critique.principle_analysis 
          : Object.values(critique.principle_analysis || {}).filter(Boolean);

        // Evaluate performance
        const performance = evaluatePerformance(principleAnalysis);

        // Print results
        console.log(`Filename: ${filename}`);
        console.log(`Detected principles: ${principleAnalysis.length}`);
        principleAnalysis.forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.principle_id} (${p.severity})`);
        });
        console.log(`Performance score: ${performance.overall.toFixed(3)}`);
        console.log("");

      } catch (error) {
        console.error(`Error processing ${filename}:`, error.message);
        console.log("");
      }
    }

  } catch (error) {
    console.error("Batch critique failed:", error.message);
  }
}

runBatchCritique();
