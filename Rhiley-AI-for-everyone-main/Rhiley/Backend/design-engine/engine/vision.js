const axios = require("axios");
const fs = require("fs");

function extractJSON(text) {
  const firstBrace = text.indexOf("[");
  const lastBrace = text.lastIndexOf("]");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No valid JSON array found in model output");
  }

  const jsonString = text.substring(firstBrace, lastBrace + 1);
  return JSON.parse(jsonString);
}

async function extractBlocks(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");

  const prompt = `
You are a layout detection engine.

Analyze the webpage image.

Return ONLY a valid JSON array.

Each object must contain:
{
  "x": number,
  "y": number,
  "width": number,
  "height": number,
  "text": string
}

Do not include explanations.
Do not include markdown.
Return raw JSON array only.
`;

  const response = await axios.post(
    "http://localhost:11434/api/generate",
    {
      model: "llava:7b",
      prompt: prompt,
      images: [base64Image],
      stream: false
    },
    { timeout: 120000 }
  );

  if (!response.data || !response.data.response) {
    throw new Error("Invalid response from LLaVA");
  }

  console.log("Raw LLaVA Output:", response.data.response);

  const blocks = extractJSON(response.data.response);

  if (!Array.isArray(blocks)) {
    throw new Error("Parsed output is not an array");
  }

  return blocks;
}

module.exports = { extractBlocks };
