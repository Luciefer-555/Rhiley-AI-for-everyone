import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { orchestrate } from "@/lib/multiModelOrchestrator";

function stripCodeFence(text: string) {
    const codeMatch = text.match(/```(?:tsx?|jsx?|react)?\n([\s\S]*?)```/i);
    return (codeMatch ? codeMatch[1] : text).trim();
}

function withClientDirective(code: string) {
    const cleaned = code.replace(/^[ '\"]?use client[ '\"]?;?\n?/gm, "").trim();
    return `'use client';\n\n${cleaned}`;
}

export async function POST(req: Request) {
    try {
        const { prompt, aesthetic } = await req.json();
        if (!prompt || typeof prompt !== "string") return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });

        const result = await orchestrate({ userMessage: prompt, history: [], aesthetic: aesthetic || "cinematic" });
        const finalCode = withClientDirective(stripCodeFence(result.code || result.content));
        const liveDir = path.join(process.cwd(), "app", "live");
        if (!fs.existsSync(liveDir)) fs.mkdirSync(liveDir, { recursive: true });
        fs.writeFileSync(path.join(liveDir, "Component.tsx"), finalCode, "utf-8");
        fs.writeFileSync(path.join(liveDir, "meta.json"), JSON.stringify({ timestamp: Date.now(), status: "ready", model: result.modelLabel }), "utf-8");
        return NextResponse.json({ success: true, timestamp: Date.now(), model: result.modelLabel });
    } catch (error: any) {
        console.error("Generate error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
