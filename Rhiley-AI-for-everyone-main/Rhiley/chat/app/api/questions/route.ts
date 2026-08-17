import { QUESTION_ENGINE_PROMPT } from "@/lib/questionEngine";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MODEL = process.env.RHILEY_WRITER_MODEL || "qwen3:8b";

async function askOllama(content: string, maxTokens = 500) {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, stream: false, messages: [{ role: "system", content: QUESTION_ENGINE_PROMPT }, { role: "user", content }], options: { temperature: 0.25, num_predict: maxTokens } }),
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
    const data = await res.json();
    return String(data.message?.content || "").trim();
}

function fallbackQuestions(request: string) {
    return { questions: "1. What are we building?\n2. What's the vibe?\n3. Any specific features?", aesthetic: "cinematic", enhancedPrompt: request };
}

export async function POST(req: Request) {
    try {
        const { request, questions, answers, stage } = await req.json();
        if (!request || typeof request !== "string") return Response.json({ error: "Request is required" }, { status: 400 });

        try {
            if (stage === "finalize") {
                const text = await askOllama(`Original request: "${request}"\nQuestions asked: "${questions || ""}"\nUser answers: "${answers || ""}"\n\nNow output only the JSON object with aesthetic, enhancedPrompt, and vibe.`, 700);
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error("Question engine did not return JSON");
                return Response.json(JSON.parse(jsonMatch[0]));
            }
            const questionsText = await askOllama(`User wants: "${request}". Ask your 3 questions.`, 300);
            return Response.json({ questions: questionsText || fallbackQuestions(request).questions });
        } catch (error: any) {
            console.warn("[Rhiley] Question engine unavailable; using fallback.", error.message);
            return Response.json(fallbackQuestions(request));
        }
    } catch (error: any) {
        return Response.json({ error: "Failed to process questions", details: error.message }, { status: 500 });
    }
}
