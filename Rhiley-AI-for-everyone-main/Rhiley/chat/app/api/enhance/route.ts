const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MODEL = process.env.RHILEY_WRITER_MODEL || "qwen3:8b";
const ENHANCER_SYSTEM_PROMPT = "Rewrite the user prompt into a concise, vivid design-generation prompt. Preserve the user intent, add useful visual detail, and return only the improved prompt.";

async function enhanceWithOllama(prompt: string) {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, stream: false, messages: [{ role: "system", content: ENHANCER_SYSTEM_PROMPT }, { role: "user", content: prompt }], options: { temperature: 0.35, num_predict: 500 } }),
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
    const data = await res.json();
    return String(data.message?.content || "").trim();
}

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();
        if (!prompt || typeof prompt !== "string") return Response.json({ error: "Prompt is required" }, { status: 400 });
        try {
            const enhanced = await enhanceWithOllama(prompt);
            return Response.json({ enhanced: enhanced || prompt });
        } catch (error: any) {
            console.warn("[Rhiley] Prompt enhancement unavailable; using original prompt.", error.message);
            return Response.json({ enhanced: prompt });
        }
    } catch (error: any) {
        return Response.json({ error: "Failed to enhance prompt", details: error.message }, { status: 500 });
    }
}
