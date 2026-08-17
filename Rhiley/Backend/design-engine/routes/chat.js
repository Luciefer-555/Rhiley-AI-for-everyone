const express = require("express");
const axios = require("axios");
const multiModelBot = require("../multiModelRouter");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const { NIM_BASE_URL, NIM_API_KEY, VISION_MODEL, CODING_MODEL } = require("../config/models");

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

async function callLLaVA(message, images, history, systemPrompt) {
  const requestMessages = [];
  if (systemPrompt) requestMessages.push({ role: "system", content: systemPrompt });

  const historyMessages = (history || [])
    .slice(-4)
    .map(h => ({ role: h.role === "user" ? "user" : "assistant", content: h.content }));
  requestMessages.push(...historyMessages);

  const contentArray = [];
  if (images && images.length > 0) {
    // Add instruction note as text first
    contentArray.push({ type: "text", text: "[User has attached an image. Describe what you can infer from context and help them.]" });
    for (const img of images) {
      let dataUrl = img;
      if (!dataUrl.startsWith("data:")) {
        let mimeType = "image/jpeg"; // default
        if (img.startsWith("iVBORw0KGgo")) {
          mimeType = "image/png";
        } else if (img.startsWith("/9j/")) {
          mimeType = "image/jpeg";
        } else if (img.startsWith("UklGR")) {
          mimeType = "image/webp";
        } else if (img.startsWith("R0lGOD")) {
          mimeType = "image/gif";
        }
        dataUrl = `data:${mimeType};base64,${img}`;
      }
      contentArray.push({ type: "image_url", image_url: { url: dataUrl } });
    }
  }

  if (message) {
    contentArray.push({ type: "text", text: message });
  }

  requestMessages.push({ role: "user", content: contentArray });

  const response = await axios.post(`${NIM_BASE_URL}/chat/completions`, {
    model: VISION_MODEL,
    messages: requestMessages,
    stream: false,
    temperature: 0.15,
    max_tokens: 4096
  }, { 
    timeout: 600000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NIM_API_KEY}`
    }
  });

  return response.data?.choices?.[0]?.message?.content || "I couldn't generate a response.";
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
    return res.json({ success: true, reply: reply.trim(), model: hasImage ? VISION_MODEL : CODING_MODEL });

  } catch (error) {
    console.error("Chat endpoint error:", error.message);
    if (error.message.includes("timeout")) {
      return res.status(408).json({ success: false, error: "Request timeout. Please try again." });
    }
    if (error.message.includes("ECONNREFUSED") || error.message.includes("NIM")) {
      return res.status(503).json({ success: false, error: "AI model unavailable. Make sure NIM API key is valid." });
    }
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
});

module.exports = router;
