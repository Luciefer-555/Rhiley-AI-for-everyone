import { NextResponse } from "next/server";

const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL = "x/z-image-turbo";
const POLLINATIONS_API = "https://image.pollinations.ai/prompt";
const STABLE_HORDE_API = "https://stablehorde.net/api/v2";

export async function POST(req: Request) {
    try {
        const { prompt, enhancedPrompt, width, height } = await req.json();

        if (!prompt && !enhancedPrompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const finalPrompt = enhancedPrompt || prompt;

        const tryOllama = async () => {
            const res = await fetch(OLLAMA_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model: MODEL, prompt: finalPrompt, stream: false }),
                signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) throw new Error("Ollama not responding");
            const data = await res.json();
            const img = data.images?.[0] || data.response;
            if (!img || img.includes("failed") || img.includes("mlx")) throw new Error("Ollama generation failed");
            return img;
        };

        const tryStableHorde = async () => {
            const initRes = await fetch(`${STABLE_HORDE_API}/generate/async`, {
                method: "POST",
                headers: { "Content-Type": "application/json", apikey: "0000000000" },
                body: JSON.stringify({
                    prompt: finalPrompt,
                    params: { steps: 25, n: 1, sampler_name: "k_euler", width: width || 768, height: height || 1024 },
                }),
                signal: AbortSignal.timeout(30000),
            });
            if (!initRes.ok) throw new Error(`Stable Horde init failed: ${initRes.status}`);
            const { id } = await initRes.json();
            if (!id) throw new Error("Stable Horde returned no generation id");

            for (let attempts = 0; attempts < 30; attempts++) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                const statusRes = await fetch(`${STABLE_HORDE_API}/generate/status/${id}`, { headers: { apikey: "0000000000" } });
                if (!statusRes.ok) continue;
                const status = await statusRes.json();
                if (status.done && status.generations?.[0]?.img) {
                    const imgData = status.generations[0].img;
                    if (imgData.startsWith("http")) {
                        const imgRes = await fetch(imgData);
                        const buffer = await imgRes.arrayBuffer();
                        return Buffer.from(buffer).toString("base64");
                    }
                    return imgData;
                }
                if (status.faulted) throw new Error("Stable Horde generation faulted");
            }
            throw new Error("Stable Horde polling timed out");
        };

        const tryPollinations = async () => {
            const seed = Math.floor(Math.random() * 1000000);
            const encoded = encodeURIComponent(finalPrompt.replace(/[^\w\s,.!?-]/g, "").slice(0, 800));
            const res = await fetch(`${POLLINATIONS_API}/${encoded}?model=flux&seed=${seed}&nologo=true`, { signal: AbortSignal.timeout(30000) });
            if (!res.ok) throw new Error(`Pollinations status ${res.status}`);
            const buffer = await res.arrayBuffer();
            return Buffer.from(buffer).toString("base64");
        };

        try {
            return NextResponse.json({ image: await tryOllama(), provider: "ollama" });
        } catch (ollamaError: any) {
            console.warn(`[Imagine] Ollama skipped: ${ollamaError.message}`);
            try {
                return NextResponse.json({ image: await tryStableHorde(), provider: "stable-horde" });
            } catch (hordeError: any) {
                console.warn(`[Imagine] Stable Horde failed: ${hordeError.message}`);
                try {
                    return NextResponse.json({ image: await tryPollinations(), provider: "pollinations" });
                } catch {
                    return NextResponse.json({ error: "All art services are under heavy load. Rhiley's studio is temporarily closed.", details: "Ollama, Stable Horde, and Pollinations all failed." }, { status: 503 });
                }
            }
        }
    } catch (error: any) {
        console.error("Imagine Route Error:", error);
        return NextResponse.json({ error: "Painting process failed internally." }, { status: 500 });
    }
}
