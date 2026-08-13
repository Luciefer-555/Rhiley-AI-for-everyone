/**
 * Rhiley Browser Intelligence — Core Scraper Engine
 *
 * Uses Playwright (headless Chromium) to navigate to a URL,
 * wait for the page to fully load, and extract:
 *   - All code blocks (TSX/JSX/CSS)
 *   - A screenshot for vision analysis
 *   - CSS custom properties (design tokens)
 *   - Animation library hints from loaded scripts
 */

const { chromium } = require("playwright");
const { getProfile } = require("./siteProfiles/index.js");
const { cleanCode, mergeCodeBlocks } = require("./codeCleaner.js");

const SCRAPE_TIMEOUT_MS = 30_000;
const NAV_TIMEOUT_MS = 20_000;

/**
 * Main scrape function.
 * @param {string} url - The page URL to scrape.
 * @returns {Promise<ScrapeResult>}
 */
async function scrapeUrl(url) {
  const profile = getProfile(url);
  console.log(`[Scraper] Scraping: ${url}`);
  console.log(`[Scraper] Using profile: ${profile.name}`);

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  try {
    // Navigate
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: NAV_TIMEOUT_MS,
    });

    // Wait for content to be present
    try {
      await page.waitForSelector(profile.waitFor, { timeout: 8000 });
    } catch (_) {
      console.warn("[Scraper] waitFor selector not found, continuing anyway...");
    }

    // Try clicking any "Code" tab/button if present (common pattern on UI sites)
    try {
      const codeTab = await page.$("[role=tab]:has-text('Code'), button:has-text('Code'), [data-tab='code']");
      if (codeTab) {
        await codeTab.click();
        await page.waitForTimeout(600);
      }
    } catch (_) {}

    // ── Extract Code Blocks ────────────────────────────────────────────────
    const rawBlocks = await page.evaluate((selectors) => {
      const blocks = [];
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const text = el.innerText || el.textContent || "";
          if (text.trim().length > 50) {
            blocks.push(text.trim());
          }
        }
      }
      return blocks;
    }, profile.codeSelectors);

    // ── Extract CSS Custom Properties ─────────────────────────────────────
    const cssVars = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      const vars = {};
      for (const prop of styles) {
        if (prop.startsWith("--")) {
          const val = styles.getPropertyValue(prop).trim();
          if (val) vars[prop] = val;
        }
      }
      return vars;
    });

    // ── Detect Animation Libraries From Script Tags ───────────────────────
    const detectedLibraries = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll("script[src]")).map((s) => s.src);
      const all = document.documentElement.innerHTML;
      const found = [];
      if (scripts.some((s) => s.includes("framer-motion")) || all.includes("framer-motion")) found.push("framer-motion");
      if (scripts.some((s) => s.includes("gsap")) || all.includes("gsap")) found.push("gsap");
      if (all.includes("@radix-ui") || all.includes("radix")) found.push("radix-ui");
      if (all.includes("lucide-react") || all.includes("lucide")) found.push("lucide-react");
      if (all.includes("tailwind")) found.push("tailwind");
      if (all.includes("motion/react") || all.includes("motion.div")) found.push("motion");
      return [...new Set(found)];
    });

    // ── Take Screenshot ───────────────────────────────────────────────────
    const screenshot = await page.screenshot({ type: "png", fullPage: false });
    const screenshotBase64 = screenshot.toString("base64");

    // ── Page Title & Description ──────────────────────────────────────────
    const pageTitle = await page.title();
    const pageDescription = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="description"]');
      return meta ? meta.getAttribute("content") || "" : "";
    });

    await browser.close();

    // ── Post-process Extracted Code ───────────────────────────────────────
    const mergedRaw = mergeCodeBlocks(rawBlocks);
    const { code, language, imports } = cleanCode(mergedRaw, profile);

    const allLibraries = [...new Set([...detectedLibraries, ...(profile.animationLibraries || [])])];

    return {
      success: true,
      url,
      profile: profile.name,
      pageTitle,
      pageDescription,
      code,
      language,
      imports,
      rawBlockCount: rawBlocks.length,
      libraries: allLibraries,
      techStack: profile.techStack || [],
      cssVars,
      screenshotBase64,
    };
  } catch (err) {
    await browser.close().catch(() => {});
    console.error("[Scraper] Error:", err.message);
    return {
      success: false,
      url,
      profile: profile.name,
      error: err.message,
      code: "",
      libraries: [],
      cssVars: {},
      screenshotBase64: null,
    };
  }
}

/**
 * Resolve a site name alias to a full URL.
 * Allows users to say "grab from react bits" without typing a full URL.
 */
const SITE_ALIASES = {
  "react bits": "https://react-bits.dev",
  "reactbits": "https://react-bits.dev",
  "skiper": "https://skiper.dev",
  "skiper ui": "https://skiper.dev",
  "aceternity": "https://ui.aceternity.com",
  "aceternity ui": "https://ui.aceternity.com",
  "magic ui": "https://magicui.design",
  "magicui": "https://magicui.design",
  "watermelon": "https://watermelon-ui.com",
  "watermelon ui": "https://watermelon-ui.com",
  "shadcn": "https://ui.shadcn.com",
  "shadcn ui": "https://ui.shadcn.com",
  "framer motion": "https://www.framer.com/motion",
};

function resolveUrl(input) {
  const lower = input.trim().toLowerCase();
  if (SITE_ALIASES[lower]) return SITE_ALIASES[lower];
  // If it looks like a URL already
  if (lower.startsWith("http://") || lower.startsWith("https://")) return input.trim();
  // Last resort: try prepending https://
  return `https://${input.trim()}`;
}

module.exports = { scrapeUrl, resolveUrl, SITE_ALIASES };
