const express = require("express");
const router = express.Router();
const axios = require("axios");

const { NIM_BASE_URL, NIM_API_KEY, LIGHT_MODEL } = require("../config/models");
const NIM_TIMEOUT = process.env.NIM_TIMEOUT || 60000;

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

        const response = await axios.post(`${NIM_BASE_URL}/chat/completions`, {
            model: LIGHT_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Conversation:\n${chatLog}\n\nTitle:` }
            ],
            stream: false,
            temperature: 0.7,
            max_tokens: 15
        }, {
            timeout: NIM_TIMEOUT,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${NIM_API_KEY}`
            }
        });

        if (response.data?.choices?.[0]?.message?.content) {
            // Clean up the response (remove quotes and markdown)
            let rawTitle = response.data.choices[0].message.content.trim();
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
