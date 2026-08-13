const express = require("express");
const router = express.Router();
const axios = require("axios");

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://127.0.0.1:11434/api/generate";
const OLLAMA_TIMEOUT = process.env.OLLAMA_TIMEOUT || 60000;

router.post("/", async (req, res) => {
    try {
        const { history } = req.body;

        if (!history || !Array.isArray(history) || history.length < 2) {
            return res.status(400).json({ success: false, error: "Insufficient chat history provided" });
        }

        // Format chat history for prompt
        const chatLog = history.map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`).join("\n");

        const systemPrompt = `Based on this conversation, generate a short, specific, creative chat title. Maximum 4-5 words. No quotes. No generic titles like 'New Chat' or 'Chat 1'. Make it descriptive and specific to what was actually discussed. Examples: '3D Vector Calculator Python', 'React Auth Flow Setup', 'Tailwind Landing Page Build'`;

        const prompt = `
${systemPrompt}

Conversation:
${chatLog}

Title:`;

        const response = await axios.post(OLLAMA_API_URL, {
            model: "qwen3:8b", // Fast contextual reading model
            prompt: prompt,
            stream: false
        }, {
            timeout: OLLAMA_TIMEOUT,
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.data && response.data.response) {
            // Clean up the response (remove quotes and markdown)
            let rawTitle = response.data.response.trim();
            rawTitle = rawTitle.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
            rawTitle = rawTitle.replace(/\*\*/g, ''); // Remove bold markdown

            return res.json({ success: true, title: rawTitle });
        }

        throw new Error("Invalid response from LLM");

    } catch (error) {
        console.error("Generate Title API error:", error.message);
        res.status(500).json({ success: false, error: "Internal Title Generation Error" });
    }
});

module.exports = router;
