import fs from "fs";
import { analyzeImage } from "../vision.js";
import { judgeDesign } from "../judge.js";
import { translateProblems } from "../phase2/problemTranslator.js";

const image = fs.readFileSync("./tests/sample.jpg");
const base64 = image.toString("base64");

async function run() {
  const vision = await analyzeImage(base64);
  const critique = await judgeDesign({ visionText: vision, intent: "" });

  const result = translateProblems({
    principle_analysis: critique.principle_analysis,
    intent_analysis: {},
    performance: { overall: 0.8 }
  });

  console.log(JSON.stringify(result, null, 2));
}

run();
