import { NextRequest, NextResponse } from "next/server";

const DESIGN_ENGINE_URL = "http://localhost:3002";

/**
 * POST /api/scrape
 * Proxies the browser intelligence scrape request to the design-engine.
 *
 * Body: { url: string, userRequest: string, aesthetic?: string }
 * Returns: { success, adaptedCode, originalCode, libraries, pageTitle, profile, screenshotBase64 }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, userRequest, aesthetic } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "url is required" },
        { status: 400 }
      );
    }

    const res = await fetch(`${DESIGN_ENGINE_URL}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, userRequest, aesthetic }),
      // Allow up to 60 seconds for scraping + adaptation
      signal: AbortSignal.timeout(60_000),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return NextResponse.json(
        { success: false, error: data.error || "Scrape failed" },
        { status: res.status || 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[Scrape API] Error:", err);

    if (err?.name === "TimeoutError" || err?.name === "AbortError") {
      return NextResponse.json(
        { success: false, error: "Scrape timed out after 60 seconds. The site may be slow or blocking access." },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scrape/aliases
 * Returns the list of supported site name aliases.
 */
export async function GET() {
  try {
    const res = await fetch(`http://localhost:3005/aliases`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: false, aliases: [], sites: {} });
  }
}
