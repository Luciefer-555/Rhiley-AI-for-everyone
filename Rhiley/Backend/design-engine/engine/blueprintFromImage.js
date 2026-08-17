const axios = require("axios");
const { VISION_MODEL, NIM_BASE_URL, NIM_API_KEY } = require("../config/models");

const SYSTEM_PROMPT_TEMPLATE = `You are an expert UI architect processing an image of a website or interface.
Your task is to extract its structure, text, and styling into a canonical JSON blueprint.

INSTRUCTIONS:
1. Scan the image strictly from top to bottom. Identify distinct structural sections.
2. For each section, determine its type ("hero", "section", "contentBlock", "nav") and extract its content.
3. IMPORTANT: ONLY describe what is actually visible. If the image lacks a navigation bar, do NOT include a "nav" section. If the image is non-standard and has no hero, do not invent one. Do NOT assume a standard landing-page structure; map EXACTLY what you see.
4. Provide an approximate color palette (e.g., hex codes or descriptions like "#000000", "#ffffff") and a rough style descriptor (e.g., "dark, minimal", "playful, colorful").
5. Tag every piece of content in each section with its source:
   - Use "source": "ocr_read" for any text you read directly off the image (e.g., headlines, nav labels, body copy).
   - Use "source": "visually_inferred" for structural elements or intent that you had to guess (e.g., recognizing a block is a "pricing" section, or an image is a "product photo").
   - NEVER use "inferred_default".
6. Respond ONLY with raw JSON matching this schema exactly:
{
  "layout": "vertical",
  "designStyle": "Your extracted style descriptor (e.g. dark, minimal)",
  "colorPalette": ["#hex1", "#hex2"],
  "sections": [
    { 
      "type": "nav", 
      "source": "visually_inferred",
      "content": { 
        "links": [
          { "label": "About", "source": "ocr_read" },
          { "label": "Contact", "source": "ocr_read" }
        ]
      }
    },
    { 
      "type": "hero", 
      "source": "visually_inferred", 
      "content": { 
        "title": "Extracted Headline", "title_source": "ocr_read",
        "subtitle": "Extracted subtitle", "subtitle_source": "ocr_read"
      } 
    }
  ]
}

CRITICAL:
- Allowed section types: "hero", "section", "contentBlock", "nav".
- Use "section" for standard flow content.
- Use "contentBlock" ONLY for highly specialized interactive widgets.
- If the entire image is just a single non-standard block, treat it as a single "section" or "hero".
- Provide raw JSON only. No markdown formatting (\`\`\`json).`;

async function callVisionNim(systemPrompt, base64Image) {
  const payload = {
    model: VISION_MODEL,
    messages: [
      { 
        role: "user", 
        content: [
          { type: "text", text: systemPrompt },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
        ]
      }
    ],
    temperature: 0.1,
    max_tokens: 3000
  };

  const response = await axios.post(
    `${NIM_BASE_URL}/chat/completions`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NIM_API_KEY}`
      },
      timeout: 120000
    }
  );

  let content = response.data.choices[0].message.content;
  content = content.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "").trim();
  return JSON.parse(content);
}

async function generateImageBlueprint(imageBuffer) {
  const base64Image = imageBuffer.toString('base64');
  
  let blueprint;
  try {
    blueprint = await callVisionNim(SYSTEM_PROMPT_TEMPLATE, base64Image);
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.warn("[blueprintFromImage] JSON parsing failed. Retrying once...");
      const retryPrompt = `${SYSTEM_PROMPT_TEMPLATE}\n\nCRITICAL RETRY INSTRUCTION: Your previous output was not valid JSON. You MUST output strictly parseable JSON and nothing else.`;
      try {
        blueprint = await callVisionNim(retryPrompt, base64Image);
      } catch (retryErr) {
        throw new Error("Failed to generate image blueprint: Invalid JSON output from VISION_MODEL on retry.");
      }
    } else {
      throw err;
    }
  }

  if (!blueprint.sections || !Array.isArray(blueprint.sections)) {
    console.warn("[blueprintFromImage] Blueprint missing sections array. Retrying once...");
    const retryPrompt = `${SYSTEM_PROMPT_TEMPLATE}\n\nCRITICAL RETRY INSTRUCTION: Your previous output missed the required "sections" array. You MUST follow the schema.`;
    try {
      blueprint = await callVisionNim(retryPrompt, base64Image);
      if (!blueprint.sections || !Array.isArray(blueprint.sections)) {
        throw new Error("Failed to generate image blueprint: Output missing 'sections' array on retry.");
      }
    } catch (retryErr) {
      throw new Error("Failed to generate image blueprint: Schema violation on retry.");
    }
  }

  return blueprint;
}

module.exports = {
  generateImageBlueprint
};
