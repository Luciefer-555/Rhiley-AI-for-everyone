import { NextRequest, NextResponse } from "next/server";
import { orchestrate } from "../../../lib/multiModelOrchestrator";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { detectIntent } from '@/lib/intentDetector';
import { getRhileyResponse } from '@/lib/personalityResponses';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get("content-type") || "";

        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            const message = formData.get('message') as string;
            const image = formData.get('image') as File | null;

            let messageContent: any = message;

            if (image) {
                const bytes = await image.arrayBuffer();
                const base64 = Buffer.from(bytes).toString('base64');
                const mediaType = image.type as "image/jpeg" | "image/png" | "image/webp";

                // Vision message format exactly as requested
                messageContent = [
                    {
                        type: "image",
                        source: {
                            type: "base64",
                            media_type: mediaType,
                            data: base64,
                        }
                    },
                    {
                        type: "text",
                        text: message || "analyze this image"
                    }
                ];
            }

            const VISION_PROMPT = `
You are Rhiley — a brilliant, flirty UI engineer 
with strong design opinions.

When analyzing an image:

NEVER say "Hey there" or "It looks like"
NEVER say "let's move on to coding"
NEVER be corporate or formal
NEVER use 🍞 or random food emojis

DO write 1-2 lines of casual reaction first:
"okay this is giving [vibe] 🖤"
"this is pure [aesthetic] energy..."

THEN output the design-analysis block:

\`\`\`design-analysis
{
  "vibe": "one punchy sentence, lowercase",
  "aesthetic": "2-3 word label",
  "colors": [
    {
      "label": "Primary",
      "hex": "#ACTUAL_HEX_FROM_IMAGE",
      "description": "poetic but specific description"
    },
    {
      "label": "Secondary",
      "hex": "#ACTUAL_HEX_FROM_IMAGE", 
      "description": "poetic but specific description"
    },
    {
      "label": "Accent",
      "hex": "#ACTUAL_HEX_FROM_IMAGE",
      "description": "poetic but specific description"
    },
    {
      "label": "Shadow",
      "hex": "#ACTUAL_HEX_FROM_IMAGE",
      "description": "poetic but specific description"
    }
  ],
  "typography": "specific font personality description",
  "motion": "animation personality, one phrase",
  "layout": "structural energy, one phrase"
}
\`\`\`

THEN end with one line offer:
"want me to build something from this? 🖤"

CRITICAL RULES:
- hex codes must be REAL colors from the actual image
- lowercase throughout
- max 2 emojis total
- no coding talk unless user asks
- the fence must be exactly: \`\`\`design-analysis
- valid JSON only inside the fence
`;

            const response = await anthropic.messages.create({
                model: "llava:7b",
                max_tokens: 1024,
                system: VISION_PROMPT,
                messages: [{ role: "user", content: messageContent }]
            });

            const content = response.content[0].type === "text" ? response.content[0].text : "";

            return NextResponse.json({
                success: true,
                reply: content,
                model: "👁️ Claude Vision",
            });
        }

        // Standard JSON logic
        const body = await req.json();
        const { message, history, image, aesthetic } = body;

        const intent = detectIntent(message);
        const NON_TASK_INTENTS = [
            'greeting', 'compliment', 'flirt',
            'question_about_rhiley', 'bored',
            'thanks', 'insult', 'frustration'
        ];

        if (!image && NON_TASK_INTENTS.includes(intent)) {
            return Response.json({
                response: getRhileyResponse(intent),
                reply: getRhileyResponse(intent), // Include reply payload for page.tsx parity
                success: true,
                model: "💜 Rhiley",
                intent,
                skipCodeGen: true
            });
        }

        // Call the intelligent orchestrator
        const result = await orchestrate({
            userMessage: message,
            history: history || [],
            imageBase64: image ? [image] : undefined,
            aesthetic: aesthetic || "cinematic",
        });

        // If the model generated code, write it to the live preview directory
        if (result.hasCode && result.code) {
            try {
                const previewPath = path.resolve(process.cwd(), "app/live/Component.tsx");
                const dir = path.dirname(previewPath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

                const cleanCode = result.code.replace(/^```tsx\n/, "").replace(/\n```$/, "").trim();

                fs.writeFileSync(previewPath, cleanCode, "utf-8");
            } catch (err) {
                console.error("[Rhiley API] Failed to write preview file:", err);
            }
        }

        return NextResponse.json({
            success: true,
            reply: result.content,
            model: result.modelLabel,
        });
    } catch (error: any) {
        console.error("[Rhiley API] Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
