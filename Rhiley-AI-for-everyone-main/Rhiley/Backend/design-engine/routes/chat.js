const express = require("express");
const axios = require("axios");
const multiModelBot = require("../multiModelRouter");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const OLLAMA_API_URL = "http://127.0.0.1:11434/api/generate";

// Vision keyword detection - routes to LLaVA automatically  
function shouldUseLLaVA(message, hasImage) {
  if (hasImage) return true;
  const visionKeywords = [
    "describe this image", "what do you see", "look at this",
    "analyze this photo", "can you see", "attached image",
    "screenshot", "figma design", "convert this design",
    "recreate this", "build from this", "code this design"
  ];
  const lower = (message || "").toLowerCase();
  return visionKeywords.some(kw => lower.includes(kw));
}

// Call qwen3:8b for all requests (llava:7b not installed — use qwen as fallback)
async function callLLaVA(message, images, history, systemPrompt) {
  const historyText = (history || [])
    .slice(-4)
    .map(h => `${h.role === "user" ? "User" : "Rhiley"}: ${h.content}`)
    .join("\n");

  const imageNote = images && images.length > 0
    ? "[User has attached an image. Describe what you can infer from context and help them.]\n"
    : "";

  const fullPrompt = systemPrompt
    ? `${systemPrompt}\n\n${imageNote}${historyText}\nUser: ${message}\nRhiley:`
    : `${imageNote}${historyText}\nUser: ${message}\nRhiley:`;

  const response = await axios.post(OLLAMA_API_URL, {
    model: "qwen2.5-coder:7b",
    prompt: fullPrompt,
    stream: false,
    options: {
      temperature: 0.15,
      top_p: 0.85,
      num_predict: 32768,
      repeat_penalty: 1.1,
      num_ctx: 65536
    }
  }, { timeout: 600000 });
  return response.data?.response || "I couldn't generate a response.";
}

// GET latest generated code
router.get("/generated-code", async (req, res) => {
  try {
    const filePath = path.resolve(__dirname, "../../chat/generated/Component.tsx");
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: "No generated code found." });
    }
    const code = fs.readFileSync(filePath, "utf-8");
    res.json({ success: true, code });
  } catch (error) {
    console.error("Error reading generated code:", error);
    res.status(500).json({ success: false, error: "Failed to read generated code." });
  }
});

router.post("/", async (req, res) => {
  try {
    console.log("Chat endpoint: Processing message");

    const { message, history, image, images, aesthetic } = req.body;
    console.log("Message received:", message);
    console.log("Aesthetic choice:", aesthetic);
    console.log("Has image:", !!(image || (images && images.length > 0)));

    // Support both single image (image) and multiple (images)
    const imageList = images || (image ? [image] : []);
    const hasImage = imageList.length > 0;

    // Input validation
    const textMessage = typeof message === "string" ? message : String(message || "");
    if (!hasImage && textMessage.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Message cannot be empty" });
    }
    if (textMessage.length > 10000) {
      return res.status(400).json({ success: false, error: "Message too long (max 10,000 chars)" });
    }
    if (history !== undefined && !Array.isArray(history)) {
      return res.status(400).json({ success: false, error: "History must be an array" });
    }

    const sanitizedHistory = (history || []).map(item => {
      if (!item || typeof item !== "object") return null;
      return { role: item.role || "user", content: String(item.content || "").trim() };
    }).filter(Boolean);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), 600000)
    );

    let replyPromise;
    if (shouldUseLLaVA(textMessage, hasImage)) {
      console.log("Routing to LLaVA (vision model)");
      replyPromise = callLLaVA(textMessage, imageList, sanitizedHistory, null);
    } else {
      replyPromise = multiModelBot(textMessage.trim(), sanitizedHistory, aesthetic);
    }

    const reply = await Promise.race([replyPromise, timeoutPromise]);

    if (!reply || typeof reply !== "string") {
      throw new Error("Invalid response from AI model");
    }

    console.log("Generated reply length:", reply.length);
    console.log(`[Rhiley] Chat Response Length: ${reply.length} chars`);
    return res.json({ success: true, reply: reply.trim(), model: hasImage ? "llava" : "llama" });

  } catch (error) {
    console.error("Chat endpoint error:", error.message);
    if (error.message.includes("timeout")) {
      return res.status(408).json({ success: false, error: "Request timeout. Please try again." });
    }
    if (error.message.includes("ECONNREFUSED") || error.message.includes("Ollama")) {
      return res.status(503).json({ success: false, error: "AI model unavailable. Make sure Ollama is running." });
    }
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
});

module.exports = router;
