import { NextResponse } from "next/server";

// ── CONFIG ──────────────────────────────────────────────────
const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL = "x/z-image-turbo";
const POLLINATIONS_API = "https://image.pollinations.ai/prompt";
const SHORDE_API = "https://stablehorde.net/api/v2";

export async function POST(req: Request) {
    try {
        const { prompt, enhancedPrompt, width, height } = await req.json();

        if (!prompt && !enhancedPrompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const finalPrompt = enhancedPrompt || prompt;
        console.log(`[Imagine] AI Painting: ${finalPrompt} `);

        // Helper 1: Local Ollama (Priority 1)
        const tryOllama = async () => {
            console.log("[Imagine] Trying local Ollama...");
            const res = await fetch(OLLAMA_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model: MODEL, prompt: finalPrompt, stream: false }),
                signal: AbortSignal.timeout(8000)
            });
            if (!res.ok) throw new Error("Ollama not responding");
            const data = await res.json();
            const img = data.images?.[0] || data.response;
            if (!img || img.includes("failed") || img.includes("mlx")) throw new Error("Ollama generation failed");
            return img;
        };

        // Helper 2: Stable Horde (Priority 2 - Most reliable free source)
        const tryShorde = async () => {
            console.log("[Imagine] Trying Stable Horde...");
            const initRes = await fetch(`${SHORDE_API} /generate/async`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "apikey": "0000000000" },
                body: JSON.stringify({
                    prompt: finalPrompt,
                    params: {
                        steps: 25,
                        n: 1,
                        sampler_name: "k_euler",
                        width: width || 768,
                        height: height || 1024,
                    }
                }),
                signal: AbortSignal.timeout(30000)
            });

            if (!initRes.ok) throw new Error(`Shorde Init Failed: ${initRes.status} `);
            const { id } = await initRes.json();
            if (!id) throw new Error("Shorde returned no ID");

            // Polling loop (max 60 seconds)
            console.log(`[Imagine] Shorde ID: ${id}, polling...`);
            let attempts = 0;
            while (attempts < 30) {
                attempts++;
                await new Promise(r => setTimeout(r, 2000));

                const statusRes = await fetch(`${SHORDE_API} /generate/status / ${id} `, {
                    headers: { "apikey": "0000000000" }
                });

                if (!statusRes.ok) continue;
                const status = await statusRes.json();

                if (status.done && status.generations?.[0]?.img) {
                    // Shorde returns URLs or Base64. If it's a URL, fetch it.
                    const imgData = status.generations[0].img;
                    if (imgData.startsWith('http')) {
                        const imgRes = await fetch(imgData);
                        const buffer = await imgRes.arrayBuffer();
                        return Buffer.from(buffer).toString('base64');
                    }
                    return imgData; // Base64
                }

                if (status.faulted) throw new Error("Shorde generation faulted");
                console.log(`[Imagine] Shorde Wait... (Queue: ${status.wait_time ?? '?'})`);
            }
            throw new Error("Shorde polling timed out");
        };

        // Helper 3: Pollinations (Priority 3 - Fallback)
        const tryPollinations = async () => {
            console.log("[Imagine] Falling back to Pollinations...");
            const seed = Math.floor(Math.random() * 1000000);
            const encoded = encodeURIComponent(finalPrompt.replace(/[^\w\s,.!?-]/g, '').slice(0, 800));
            const url = `${POLLINATIONS_API}/${encoded}?model=flux&seed=${seed}&nologo=true`;

            const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
            if (!res.ok) throw new Error(`Pollinations Status ${res.status}`);
            const buffer = await res.arrayBuffer();
            return Buffer.from(buffer).toString('base64');
        };

        // Execution Track: Ollama -> Shorde -> Pollinations
        try {
            return NextResponse.json({ image: await tryOllama(), provider: "ollama" });
        } catch (oErr: any) {
            console.warn(`[Imagine] Ollama skipped: ${oErr.message}`);
            try {
                return NextResponse.json({ image: await tryShorde(), provider: "shorde" });
            } catch (sErr: any) {
                console.warn(`[Imagine] Shorde failed: ${sErr.message}`);
                try {
                    return NextResponse.json({ image: await tryPollinations(), provider: "pollinations" });
                } catch (pErr: any) {
                    return NextResponse.json({
                        error: "All art services are under heavy load. Rhiley's studio is temporarily closed.",
                        details: "Ollama (Broken), Shorde (Timeout/Queue), Pollinations (530)."
                    }, { status: 503 });
                }
            }
        }

    } catch (error: any) {
        console.error("Imagine Route Error:", error);
        return NextResponse.json({ error: "Painting process failed internally." }, { status: 500 });
    }
}
