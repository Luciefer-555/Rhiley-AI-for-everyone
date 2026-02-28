import Anthropic from "@anthropic-ai/sdk";
import { ENHANCER_SYSTEM_PROMPT } from "@/lib/promptEnhancer";

// Initialize Anthropic client
// Ensure ANTHROPIC_API_KEY is in your .env.local
const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        if (!process.env.ANTHROPIC_API_KEY) {
            console.warn("[Rhiley] ANTHROPIC_API_KEY is missing. Falling back to original prompt.");
            return Response.json({ enhanced: prompt });
        }

        const message = await client.messages.create({
            model: "claude-3-5-sonnet-20241022", // Fixed model name to a valid version
            max_tokens: 300,
            system: ENHANCER_SYSTEM_PROMPT,
            messages: [{ role: "user", content: prompt }],
        });

        const enhanced = message.content[0].type === "text"
            ? message.content[0].text.trim()
            : prompt;

        return Response.json({ enhanced });
    } catch (error: any) {
        console.error("Claude API Error:", error.message);
        return Response.json({ error: "Failed to enhance prompt", details: error.message }, { status: 500 });
    }
}
