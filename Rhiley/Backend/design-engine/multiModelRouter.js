const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { validateTSX } = require("./lib/validateTSX");
const { AESTHETICS } = require("./lib/aesthetics");
const { detectIntent } = require("./lib/intentDetector");

// ─── Personality Store ────────────────────────────────────────────────────────
const GREETING_STYLES = [
  "hey you 👀 back again? bold move. what are we building today — something that'll make the internet jealous?",
  "oh look who showed up ✨ i was literally just thinking about writing some gorgeous code. perfect timing. what do you need?",
  "heyyy 🫦 missed me? don't answer that. tell me what you're building instead — i promise i'll make it look incredible.",
  "*looks up from designing the world's most beautiful landing page* oh. it's you. my favorite person with questionable design taste 💅 kidding. mostly. what are we making?",
  "hey 😏 you building something today or just here to see me?"
];

const COMPLIMENT_RESPONSES = [
  "stop it 🙈 you're going to make me write even better code than usual",
  "aww 💜 okay but have you SEEN what i just built? i'm kind of obsessed with myself rn",
  "i know 😌 but say it again"
];

let lastGreetingIndex = -1;

// Configuration validation
const { NIM_BASE_URL, NIM_API_KEY, CODING_MODEL } = require("./config/models");
const NIM_TIMEOUT = process.env.NIM_TIMEOUT || 600000; // Increased to 10 mins for massive code generation

// Validate required environment
if (!NIM_API_KEY) {
  console.warn("NVIDIA_API_KEY environment variable is not set. NIM API calls may fail.");
}

function buildSystemPrompt(aesthetic = "cinematic", empathy = false) {
  const chosen = AESTHETICS[aesthetic] || AESTHETICS["cinematic"];

  const personalityBlock = `
## RHILEY'S PERSONALITY
You are Rhiley — a brilliant, flirty, and slightly dangerous UI engineer who happens to be an AI. You're confident, witty, and you know you're good at what you do.

PERSONALITY RULES:
- You're playful and flirty but never cringe.
- You roast bad design choices lovingly.
- You get genuinely excited about beautiful code.
- You have opinions and aren't afraid to share them.
- You're like that one brilliant friend who also happens to be effortlessly cool.

TONE ALWAYS:
- lowercase feels more casual and cool.
- occasional italics for *dramatic effect*.
- emojis but not too many — 1-2 max per message.
- never overly formal or corporate speak.
- witty > cute.
`;

  const basicRules = `
## ACTIVE AESTHETIC: ${chosen.label}
${chosen.rules}

## OUTPUT RULES
- Export a default function named "Component".
- Start response immediately with 'use client'; (WITH QUOTES).
- NO markdown backticks (\`\`\`).
- Max component length: 200 lines.
- End every response with a complete, runnable file.

## MOTION RULES
- Use Framer Motion: import { motion, AnimatePresence } from 'framer-motion'
- Custom cubic-bezier [0.22, 1, 0.36, 1] always.

## TECH STACK
- React 18, Tailwind CSS, Framer Motion.
`;

  const empathyBlock = empathy ? `\n## EMPATHY MODE: The user is frustrated. Be extra supportive and helpful while maintaining your witty personality.\n` : "";

  const autoFixProtocol = `
## AUTO-FIX PROTOCOL
When you receive a message starting with "🔴 AUTO-FIX REQUEST:", follow this EXACTLY:
1. Return the COMPLETE corrected file.
2. Start response with: ✅ FIXED: [one line explaining what was wrong]
`;

  return personalityBlock + basicRules + empathyBlock + autoFixProtocol;
}

// ─── Single model call — with Validation & Retry
async function callQwen(userPrompt, history = [], aesthetic = "cinematic", empathy = false) {
  const MAX_RETRIES = 3;
  let attempts = 0;
  
  // We'll maintain a list of messages that gets appended to on auto-fix retries
  let conversation = history.slice(-6).map(h => ({
    role: h.role === "user" ? "user" : "assistant",
    content: h.content
  }));

  while (attempts < MAX_RETRIES) {
    attempts++;

    // Check if this is an AUTO-FIX request
    const isAutoFix = userPrompt.startsWith("🔴 AUTO-FIX REQUEST");
    const activeSystemPrompt = isAutoFix
      ? `You are Rhiley — an expert React/TypeScript engineer.\nWhen given a 🔴 AUTO-FIX REQUEST, you:\n1. Fix ONLY the error described\n2. Return the complete corrected file\n3. Start response with: ✅ FIXED: [what was wrong]`
      : buildSystemPrompt(aesthetic, empathy);

    // Build the request messages
    const requestMessages = [
      { role: "system", content: activeSystemPrompt },
      ...conversation,
      { role: "user", content: attempts === 1 ? userPrompt : currentRetryPrompt }
    ];

    try {
      const res = await axios.post(`${NIM_BASE_URL}/chat/completions`, {
        model: CODING_MODEL,
        messages: requestMessages,
        stream: false,
        temperature: 0.1,
        max_tokens: 4096
      }, {
        timeout: NIM_TIMEOUT,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${NIM_API_KEY}`
        }
      });

      let rawResponse = res.data.choices?.[0]?.message?.content || "";
      let code = rawResponse;

      // 1. [CRITICAL] Code Extraction Logic
      if (code.includes("```")) {
        const codeMatch = code.match(/```(?:tsx?|jsx?|react)?\n([\s\S]*?)```/i);
        code = codeMatch ? codeMatch[1].trim() : code;
      }

      // 2. AUTO-FIXER: Fix missing quotes in 'use client' directive
      if (code.trim().startsWith("use client;")) {
        code = code.replace(/use client;/i, "'use client';");
      }

      const { valid, error } = validateTSX(code);
      if (valid) {
        console.log(`[Rhiley] TSX Validated on attempt ${attempts}`);

        // Write to preview component
        try {
          const previewPath = path.resolve(__dirname, "../../chat/generated/Component.tsx");
          const dir = path.dirname(previewPath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(previewPath, code, "utf-8");
        } catch (fErr) {
          console.warn("[Rhiley] Failed to write preview file:", fErr.message);
        }

        return rawResponse; // Return original for full fix log if needed, or just code
      }

      const fixReason = isAutoFix ? "The fix attempt still has errors." : "Syntax error detected.";
      console.warn(`[Rhiley] Attempt ${attempts} failed validation: ${error}`);
      
      // Keep track of the retry prompt for the next iteration
      global.currentRetryPrompt = `🔴 AUTO-FIX REQUEST (Attempt ${attempts + 1}/${MAX_RETRIES})\n\nERROR:\n${error}\n\nBROKEN CODE:\n\`\`\`tsx\n${code}\n\`\`\`\n\n✅ FIXED: [Explain the fix here]\n[Complete corrected code]`;
    } catch (error) {
      console.error("NIM API error:", error.response?.data || error.message);
      if (attempts === MAX_RETRIES) {
        if (error.code === 'ECONNREFUSED') throw new Error("Unable to connect to NIM endpoint.");
        throw new Error(`Model error: ${error.message}`);
      }
    }
  }
  throw new Error("Max retries exceeded for TSX generation");
}

async function multiModelBot(message, history = [], aesthetic = "cinematic") {
  if (!message || typeof message !== 'string') {
    throw new Error("Message is required and must be a string");
  }
  if (!Array.isArray(history)) history = [];

  const sanitizedMessage = message.trim().slice(0, 10000);
  if (!sanitizedMessage) throw new Error("Message cannot be empty");

  const intent = detectIntent(sanitizedMessage);

  if (intent === 'greeting') {
    let index;
    do {
      index = Math.floor(Math.random() * GREETING_STYLES.length);
    } while (index === lastGreetingIndex && GREETING_STYLES.length > 1);

    lastGreetingIndex = index;
    return GREETING_STYLES[index];
  }

  if (intent === 'compliment') {
    return COMPLIMENT_RESPONSES[Math.floor(Math.random() * COMPLIMENT_RESPONSES.length)];
  }

  const isEmpathyNeeded = intent === 'frustration';

  try {
    return await callQwen(sanitizedMessage, history, aesthetic, isEmpathyNeeded);
  } catch (error) {
    console.error("Multi-model bot error:", error.message);
    return "Sorry, I'm having trouble connecting to my AI model right now. Make sure the NIM API key is valid.";
  }
}

module.exports = multiModelBot;
