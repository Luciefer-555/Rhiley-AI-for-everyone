"use client";

/**
 * Rhiley Browser Intelligence — Frontend Intent Detector
 *
 * Detects when the user's message is asking Rhiley to:
 *   - Scrape/grab/copy a component from a UI library site
 *   - Adapt an animation or interaction pattern from the web
 */

// ── Known site names that trigger browser intelligence ─────────────────────
const KNOWN_SITES = [
  "react bits", "reactbits", "react-bits",
  "skiper", "skiper ui",
  "aceternity", "aceternity ui",
  "magic ui", "magicui",
  "watermelon", "watermelon ui",
  "shadcn", "shadcn ui",
  "framer motion", "framermotion",
  "tailwind ui", "headless ui",
  "radix", "radix ui",
];

// ── Action verbs that signal scraping intent ────────────────────────────────
const SCRAPE_VERBS = [
  /\b(grab|scrape|fetch|get|copy|pull|steal|take|import|borrow|extract)\b/i,
  /\b(from|off of|off)\b/i,
];

// ── URL pattern ─────────────────────────────────────────────────────────────
const URL_PATTERN = /https?:\/\/[^\s]+/i;

export interface BrowserToolIntent {
  isBrowserRequest: boolean;
  url: string | null;           // resolved URL or raw URL from message
  siteName: string | null;      // friendly name like "React Bits"
  userRequest: string;          // what the user wants to do with the component
  rawMessage: string;
}

/**
 * Detects browser intelligence intent from a chat message.
 */
export function detectBrowserIntent(message: string): BrowserToolIntent {
  const lower = message.toLowerCase().trim();

  // 1. Check for an inline URL
  const urlMatch = message.match(URL_PATTERN);
  if (urlMatch) {
    const hasVerb = SCRAPE_VERBS.some((p) => p.test(lower));
    if (hasVerb || lower.includes("from this") || lower.includes("this link") || lower.includes("this url")) {
      return {
        isBrowserRequest: true,
        url: urlMatch[0],
        siteName: extractSiteNameFromUrl(urlMatch[0]),
        userRequest: message.replace(urlMatch[0], "").trim(),
        rawMessage: message,
      };
    }
  }

  // 2. Check for known site name mentions with action verbs
  const mentionedSite = KNOWN_SITES.find((site) => lower.includes(site));
  if (mentionedSite) {
    const hasVerb = SCRAPE_VERBS[0].test(lower);
    const hasFrom = SCRAPE_VERBS[1].test(lower);

    if (hasVerb || hasFrom || lower.includes("like") && lower.includes(mentionedSite)) {
      return {
        isBrowserRequest: true,
        url: siteNameToUrl(mentionedSite),
        siteName: capitalize(mentionedSite),
        userRequest: message,
        rawMessage: message,
      };
    }
  }

  // 3. Explicit browser/web scrape commands
  const EXPLICIT = [
    /browse (to|the) /i,
    /go to .*(and|then) (grab|get|copy|extract)/i,
    /open .* (and|then) (grab|get|copy|steal)/i,
    /web scrape/i,
    /browser (tool|intelligence)/i,
  ];
  if (EXPLICIT.some((p) => p.test(message))) {
    return {
      isBrowserRequest: true,
      url: urlMatch?.[0] || null,
      siteName: mentionedSite ? capitalize(mentionedSite) : null,
      userRequest: message,
      rawMessage: message,
    };
  }

  return {
    isBrowserRequest: false,
    url: null,
    siteName: null,
    userRequest: message,
    rawMessage: message,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const SITE_URL_MAP: Record<string, string> = {
  "react bits": "https://react-bits.dev",
  "reactbits": "https://react-bits.dev",
  "react-bits": "https://react-bits.dev",
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
  "framermotion": "https://www.framer.com/motion",
};

function siteNameToUrl(name: string): string | null {
  return SITE_URL_MAP[name.toLowerCase()] || null;
}

function extractSiteNameFromUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname;
    for (const [alias, siteUrl] of Object.entries(SITE_URL_MAP)) {
      if (siteUrl.includes(host) || host.includes(alias.replace(/\s/g, ""))) {
        return capitalize(alias);
      }
    }
    return host;
  } catch {
    return null;
  }
}

function capitalize(str: string): string {
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Format a confirmation message shown to the user before scraping starts.
 */
export function formatScrapeStartMessage(intent: BrowserToolIntent): string {
  const site = intent.siteName || intent.url || "that site";
  return `🌐 **Browser Intelligence activated** — navigating to ${site}...\n\nI'll grab the component, analyse it, and adapt it to what you need. Give me ~15 seconds 🔍`;
}

/**
 * Format the success message after adaptation is complete.
 */
export function formatScrapeSuccessMessage(
  pageTitle: string,
  libraries: string[],
  profile: string
): string {
  const libStr = libraries.length > 0 ? libraries.join(", ") : "React + Tailwind";
  return `✅ **Grabbed & adapted from ${pageTitle || profile}**\n\nUsed: ${libStr}\n\nHere's your component — rendered live in the preview panel 👇`;
}
