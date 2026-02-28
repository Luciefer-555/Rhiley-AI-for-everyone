import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import fs from 'fs';
import path from 'path';

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(req: Request) {
    try {
        const { prompt, aesthetic } = await req.json();

        const systemPrompt = `You are a world-class React developer. Use the ${aesthetic} aesthetic.
    Rules: Max 150 lines. Complete file only. Return ONLY code block.
    Always use default export for the main component.`;

        const message = await client.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 2000,
            system: systemPrompt,
            messages: [{ role: "user", content: prompt }],
        });

        const rawText = message.content[0].type === "text" ? message.content[0].text : "";

        // Extract clean code
        const codeMatch = rawText.match(/```(?:tsx?|jsx?|react)?\n([\s\S]*?)```/i);
        const extractedCode = codeMatch ? codeMatch[1].trim() : rawText.trim();

        const componentPath = path.join(process.cwd(), 'app', 'live', 'Component.tsx');
        const metaPath = path.join(process.cwd(), 'app', 'live', 'meta.json');

        // Clean code
        const cleaned = extractedCode
            .replace(/^['"]?use client['"]?;?\n?/gm, '') // Strip any variation of use client at start of lines
            .trim();

        const finalCode = `'use client';\n\n${cleaned}`;

        // Write files
        fs.writeFileSync(componentPath, finalCode, 'utf-8');
        fs.writeFileSync(metaPath, JSON.stringify({
            timestamp: Date.now(),
            status: 'ready'
        }), 'utf-8');

        console.log('✅ Component written to app/live/Component.tsx');

        return NextResponse.json({ success: true, timestamp: Date.now() });
    } catch (error: any) {
        console.error("Generate error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
