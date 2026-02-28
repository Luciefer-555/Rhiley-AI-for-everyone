import Anthropic from "@anthropic-ai/sdk";
import { QUESTION_ENGINE_PROMPT } from "@/lib/questionEngine";

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(req: Request) {
    try {
        const { request, questions, answers, stage } = await req.json();

        if (!process.env.ANTHROPIC_API_KEY) {
            console.warn("[Rhiley] ANTHROPIC_API_KEY is missing for Question Engine.");
            return Response.json({
                questions: "1. What are we building?\n2. What's the vibe?\n3. Any specific features?",
                aesthetic: "cinematic",
                enhancedPrompt: request
            });
        }

        if (stage === "finalize") {
            // Build the final prompt + pick aesthetic
            const message = await client.messages.create({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 500,
                system: QUESTION_ENGINE_PROMPT,
                messages: [{
                    role: "user",
                    content: `
            Original request: "${request}"
            Questions asked: "${questions}"  
            User answers: "${answers}"
            
            Now output the JSON block with aesthetic + enhancedPrompt + vibe.
          `
                }]
            });

            const text = message.content[0].type === "text"
                ? message.content[0].text : "";

            // Extract JSON
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {
                aesthetic: "cinematic",
                enhancedPrompt: request,
                vibe: "Standard cinematic design"
            };

            return Response.json(parsed);

        } else {
            // Ask 3 questions
            const message = await client.messages.create({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 200,
                system: QUESTION_ENGINE_PROMPT,
                messages: [{
                    role: "user",
                    content: `User wants: "${request}". Ask your 3 questions.`
                }]
            });

            const questionsText = message.content[0].type === "text"
                ? message.content[0].text : "";

            return Response.json({ questions: questionsText });
        }
    } catch (error: any) {
        console.error("Question Engine Error:", error.message);
        return Response.json({ error: "Failed to process questions", details: error.message }, { status: 500 });
    }
}
