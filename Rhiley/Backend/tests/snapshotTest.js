import fs from "fs";
import path from "path";
import { analyzeImage } from "../vision.js";
import { judgeDesign } from "../judge.js";
import { evaluatePerformance } from "../performanceEvaluator.js";
import { translateProblems } from "../phase2/problemTranslator.js";

const imagesDir = "./tests/images";
const snapshotDir = "./tests/snapshots";
const snapshotPath = path.join(snapshotDir, "latest.json");

async function runSnapshotTest() {
  try {
    // Ensure snapshots directory exists
    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }

    // Get test image
    const files = fs.readdirSync(imagesDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    if (imageFiles.length === 0) {
      console.log("No test images found in /tests/images/");
      return;
    }

    const testImage = imageFiles[0]; // Use first image for snapshot
    const imagePath = path.join(imagesDir, testImage);
    const image = fs.readFileSync(imagePath);
    const base64 = image.toString("base64");

    console.log(`Running snapshot test with: ${testImage}`);

    // Run pipeline
    const vision = await analyzeImage(base64);
    const critique = await judgeDesign({ 
      visionText: vision, 
      intent: "" 
    });

    const principleAnalysis = Array.isArray(critique.principle_analysis) 
      ? critique.principle_analysis 
      : Object.values(critique.principle_analysis || {}).filter(Boolean);

    const performance = evaluatePerformance(principleAnalysis);

    const result = translateProblems({
      principle_analysis: principleAnalysis,
      intent_analysis: {},
      performance: performance
    });

    // Create current snapshot
    const currentSnapshot = {
      timestamp: Date.now(),
      image: testImage,
      performance: performance.overall,
      principles: principleAnalysis.map(p => p.principle_id),
      result: result
    };

    // Check if previous snapshot exists
    if (fs.existsSync(snapshotPath)) {
      const previousSnapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
      
      console.log("\n=== SNAPSHOT COMPARISON ===");
      
      // Compare performance
      const perfDiff = currentSnapshot.performance - previousSnapshot.performance;
      if (Math.abs(perfDiff) > 0.01) {
        console.log(`Performance changed: ${previousSnapshot.performance.toFixed(3)} → ${currentSnapshot.performance.toFixed(3)} (${perfDiff > 0 ? '+' : ''}${perfDiff.toFixed(3)})`);
      } else {
        console.log("Performance: No significant change");
      }

      // Compare principles
      const prevPrinciples = new Set(previousSnapshot.principles);
      const currPrinciples = new Set(currentSnapshot.principles);
      
      const added = currPrinciples.difference(prevPrinciples);
      const removed = prevPrinciples.difference(currPrinciples);

      if (added.size > 0) {
        console.log(`Principles added: ${Array.from(added).join(', ')}`);
      }
      if (removed.size > 0) {
        console.log(`Principles removed: ${Array.from(removed).join(', ')}`);
      }
      if (added.size === 0 && removed.size === 0) {
        console.log("Principles: No changes detected");
      }

    } else {
      console.log("No previous snapshot found - creating baseline");
    }

    // Save current snapshot
    fs.writeFileSync(snapshotPath, JSON.stringify(currentSnapshot, null, 2));
    console.log(`\nSnapshot saved to: ${snapshotPath}`);

  } catch (error) {
    console.error("Snapshot test failed:", error.message);
  }
}

runSnapshotTest();
