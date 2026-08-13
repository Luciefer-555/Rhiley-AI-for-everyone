import fs from "fs";
import path from "path";
import { analyzeImage } from "../vision.js";
import { judgeDesign } from "../judge.js";
import { evaluatePerformance } from "../performanceEvaluator.js";

const imagesDir = "./tests/images";

async function evaluateEngine() {
  try {
    // Read all files in images directory
    const files = fs.readdirSync(imagesDir);
    
    // Filter for image files
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    console.log(`Evaluating engine on ${imageFiles.length} images...\n`);

    for (const filename of imageFiles) {
      try {
        const imagePath = path.join(imagesDir, filename);
        const image = fs.readFileSync(imagePath);
        const base64 = image.toString("base64");

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

        // Get top principle
        const topPrinciple = principleAnalysis.length > 0 
          ? principleAnalysis[0].principle_id 
          : null;

        // Print summary metrics
        console.log(`Filename: ${filename}`);
        console.log(`Performance: ${performance.overall.toFixed(3)}`);
        console.log(`Principles detected: ${principleAnalysis.length}`);
        console.log(`Top principle: ${topPrinciple || 'None'}`);
        console.log("");

      } catch (error) {
        console.error(`Error evaluating ${filename}:`, error.message);
        console.log("");
      }
    }

  } catch (error) {
    console.error("Engine evaluation failed:", error.message);
  }
}

evaluateEngine();
