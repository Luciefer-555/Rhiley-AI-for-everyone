/**
 * Rhiley Browser Intelligence — Express Server
 * Port: 3005
 *
 * Endpoints:
 *   GET  /health          — health check
 *   POST /scrape          — scrape a URL and return extracted code + metadata
 *   GET  /aliases         — list supported site name aliases
 */

const express = require("express");
const cors = require("cors");
const { scrapeUrl, resolveUrl, SITE_ALIASES } = require("./scraper.js");

const app = express();
const PORT = 3005;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "browser-intelligence",
    version: "1.0.0",
    port: PORT,
  });
});

// ── List Supported Site Aliases ────────────────────────────────────────────
app.get("/aliases", (req, res) => {
  res.json({
    success: true,
    aliases: Object.keys(SITE_ALIASES),
    sites: SITE_ALIASES,
  });
});

// ── Main Scrape Endpoint ───────────────────────────────────────────────────
/**
 * POST /scrape
 * Body: { url: string, userRequest?: string }
 *
 * url can be:
 *   - A full URL: "https://ui.aceternity.com/components/3d-card-effect"
 *   - A site alias: "react bits", "skiper ui", "aceternity"
 *
 * Returns:
 *   { success, code, language, imports, libraries, techStack, cssVars,
 *     screenshotBase64, pageTitle, profile, url, userRequest }
 */
app.post("/scrape", async (req, res) => {
  const { url, userRequest } = req.body;

  if (!url || typeof url !== "string") {
    return res.status(400).json({
      success: false,
      error: "Missing required field: url (string)",
    });
  }

  const resolvedUrl = resolveUrl(url);
  console.log(`[Browser Service] Scraping: ${resolvedUrl}`);
  console.log(`[Browser Service] User request: ${userRequest || "(none)"}`);

  try {
    const result = await scrapeUrl(resolvedUrl);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || "Scraping failed",
        url: resolvedUrl,
        profile: result.profile,
      });
    }

    return res.json({
      ...result,
      userRequest: userRequest || "",
    });
  } catch (err) {
    console.error("[Browser Service] Unexpected error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      url: resolvedUrl,
    });
  }
});

// ── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[Browser Service] Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Browser Intelligence running on http://localhost:${PORT}`);
  console.log(`   Playwright headless Chromium ready`);
  console.log(`   Supported aliases: ${Object.keys(SITE_ALIASES).length} sites pre-configured`);
});
