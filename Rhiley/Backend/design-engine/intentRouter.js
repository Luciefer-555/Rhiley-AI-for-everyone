const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { LIGHT_MODEL, NIM_BASE_URL, NIM_API_KEY } = require('./config/models');

const LOG_FILE = path.join(__dirname, 'logs', 'routing_decisions.jsonl');

// Ensure log directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function logDecision(decision) {
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(decision) + '\n', 'utf-8');
  } catch (err) {
    console.error("Failed to write to routing_decisions.jsonl", err);
  }
}

async function classifyPrompt(prompt, retries = 1) {
  const systemPrompt = `You are an expert intent classifier for a UI design engine.
Analyze the user's prompt and determine if it is "vague" or "detailed".
A "detailed" prompt specifies specific components, layout sections, or exact content (e.g., "hero section with headline 'Train Smarter', pricing with 3 tiers").
A "vague" prompt gives a general idea but leaves the structure entirely up to you (e.g., "make me a website for my bakery", "a portfolio site").
Respond ONLY with raw JSON matching this schema:
{
  "prompt_specificity": "vague" | "detailed",
  "reasoning": "<short explanation>"
}`;

  try {
    const response = await axios.post(
      `${NIM_BASE_URL}/chat/completions`,
      {
        model: LIGHT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 150
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${NIM_API_KEY}`
        },
        timeout: 10000
      }
    );

    let content = response.data?.choices?.[0]?.message?.content || "";
    content = content.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "").trim();
    
    const parsed = JSON.parse(content);
    if (parsed.prompt_specificity !== 'vague' && parsed.prompt_specificity !== 'detailed') {
      throw new Error(`Invalid prompt_specificity: ${parsed.prompt_specificity}`);
    }
    return parsed;
  } catch (err) {
    if (retries > 0) {
      console.warn(`Classification failed, retrying... (${err.message})`);
      return classifyPrompt(prompt, retries - 1);
    }
    throw new Error(`Failed to classify prompt: ${err.message}`);
  }
}

async function routeIntent({ prompt, imageBuffer }) {
  const has_image = !!(imageBuffer && imageBuffer.length > 0);
  const has_prompt = !!(prompt && prompt.trim().length > 0);
  
  let prompt_specificity = "none";
  let reasoning = "";
  let error = null;
  
  if (!has_prompt && !has_image) {
    error = "Invalid request: both prompt and image are missing.";
  } else if (!has_prompt && has_image) {
    prompt_specificity = "none";
    reasoning = "No prompt provided, only image.";
  } else if (has_prompt) {
    try {
      const classification = await classifyPrompt(prompt);
      prompt_specificity = classification.prompt_specificity;
      reasoning = classification.reasoning;
    } catch (err) {
      error = err.message;
    }
  }
  
  let route = null;
  if (!error) {
    if (!has_image && prompt_specificity === "none") {
      error = "Invalid request: no image and no valid prompt.";
    } else if (!has_image && prompt_specificity === "vague") {
      route = "vague_prompt";
    } else if (!has_image && prompt_specificity === "detailed") {
      route = "detailed_prompt";
    } else if (has_image && prompt_specificity === "none") {
      route = "image_only";
    } else if (has_image && prompt_specificity === "vague") {
      route = "hybrid_image_vague";
    } else if (has_image && prompt_specificity === "detailed") {
      route = "hybrid_image_detailed";
    }
  }

  const result = {
    has_image,
    prompt_specificity,
    route,
    reasoning,
    error
  };

  logDecision({
    timestamp: new Date().toISOString(),
    input_summary: {
      has_prompt,
      prompt_length: has_prompt ? prompt.length : 0,
      has_image
    },
    result
  });

  return result;
}

module.exports = { routeIntent };
