/**
 * Rhiley Design Engine — /scrape route
 *
 * Flow:
 *   1. Receive { url, userRequest, aesthetic } from the chat frontend
 *   2. Forward to browser-service (port 3005) for Playwright scraping
 *   3. Feed scraped code + user request to Qwen for adaptation
 *   4. Return adapted TSX component ready for Sandpack preview
 */

const express = require("express");
const axios = require("axios");
const router = express.Router();

const BROWSER_SERVICE_URL = "http://localhost:3005";
const { NIM_BASE_URL, NIM_API_KEY, CODING_MODEL } = require("../config/models");
const NIM_TIMEOUT = 600_000;

// ── Build the Adaptation Prompt for Qwen ─────────────────────────────────────
function buildAdaptationPrompt({ code, language, imports, libraries, techStack, cssVars, userRequest, pageTitle }) {
  const cssVarsSummary = Object.entries(cssVars || {})
    .slice(0, 20)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");

  const importsList = (imports || []).slice(0, 10).join("\n");

  return `You are Rhiley — expert React/TypeScript engineer.

## SCRAPED COMPONENT SOURCE
Source: ${pageTitle || "Unknown page"}
Language: ${language || "tsx"}
Detected libraries: ${(libraries || []).join(", ") || "unknown"}
Tech stack: ${(techStack || []).join(", ") || "unknown"}

## ORIGINAL IMPORTS (for reference)
${importsList || "None detected"}

## DESIGN TOKENS (CSS vars from source page)
${cssVarsSummary || "None detected"}

## ORIGINAL CODE
\`\`\`${language || "tsx"}
${code || "// No code extracted — use your expertise to build from scratch"}
\`\`\`

## USER REQUEST
${userRequest || "Adapt this component to be clean and reusable"}

## YOUR TASK
1. Adapt the component above to fulfil the user's request.
2. Keep the core animation/interaction logic intact — this is what makes it special.
3. Replace any hardcoded branding, dummy text, or placeholder content.
4. Use: React 18, TypeScript, Tailwind CSS, Framer Motion (if animations are present).
5. Export a default function named "Component".
6. Start your response with 'use client'; (WITH QUOTES, NO MARKDOWN FENCES).
7. Return a COMPLETE, single-file, runnable TSX component.
8. Add a brief comment at the top: // Adapted from: ${pageTitle || "Web"}`;
}

// ── POST /scrape ─────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const { url, userRequest, aesthetic } = req.body;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ success: false, error: "url is required" });
  }

  console.log(`[Scrape Route] url=${url}, request=${userRequest}`);

  // ── Step 1: Scrape via Browser Service ─────────────────────────────────
  let scrapeResult;
  try {
    const scrapeRes = await axios.post(
      `${BROWSER_SERVICE_URL}/scrape`,
      { url, userRequest },
      { timeout: 35_000 }
    );
    scrapeResult = scrapeRes.data;
  } catch (err) {
    console.error("[Scrape Route] Browser service error:", err.message);
    return res.status(503).json({
      success: false,
      error: "Browser service unavailable. Make sure it's running on port 3005.",
      details: err.message,
    });
  }

  if (!scrapeResult.success) {
    return res.status(500).json({
      success: false,
      error: `Scraping failed: ${scrapeResult.error}`,
      url: scrapeResult.url,
    });
  }

  const { code, language, imports, libraries, techStack, cssVars, pageTitle, screenshotBase64, profile } = scrapeResult;

  console.log(`[Scrape Route] Scraped from: ${profile} — code length: ${code?.length || 0}`);

  // ── Step 2: Adapt via Qwen ────────────────────────────────────────────
  const adaptationPrompt = buildAdaptationPrompt({
    code,
    language,
    imports,
    libraries,
    techStack,
    cssVars,
    userRequest,
    pageTitle,
  });

  let adaptedCode = "";
  try {
    const qwenRes = await axios.post(
      `${NIM_BASE_URL}/chat/completions`,
      {
        model: CODING_MODEL,
        messages: [{ role: "user", content: adaptationPrompt }],
        stream: false,
        temperature: 0.15,
        max_tokens: 4096
      },
      { 
        timeout: NIM_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${NIM_API_KEY}`
        }
      }
    );

    let raw = qwenRes.data?.choices?.[0]?.message?.content || "";

    // Strip markdown fences if Qwen wraps output
    const fenceMatch = raw.match(/```(?:tsx?|jsx?|react)?\n([\s\S]*?)```/i);
    if (fenceMatch) raw = fenceMatch[1];

    // Fix missing quotes around 'use client'
    if (raw.trim().startsWith("use client;")) {
      raw = raw.replace(/use client;/i, "'use client';");
    }

    adaptedCode = raw.trim();
    console.log(`[Scrape Route] Adaptation complete — ${adaptedCode.length} chars`);
  } catch (err) {
    console.error("[Scrape Route] Qwen adaptation error:", err.message);
    // Return scraped code unmodified if Qwen fails
    adaptedCode = code;
  }

  return res.json({
    success: true,
    adaptedCode,
    originalCode: code,
    language,
    libraries,
    techStack,
    cssVars,
    pageTitle,
    profile,
    screenshotBase64,
    url: scrapeResult.url,
    userRequest: userRequest || "",
  });
});

module.exports = router;
