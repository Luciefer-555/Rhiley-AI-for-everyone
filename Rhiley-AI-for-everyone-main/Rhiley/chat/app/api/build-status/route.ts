import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
    try {
        const metaPath = path.join(process.cwd(), "app/live/meta.json");
        if (!fs.existsSync(metaPath)) return NextResponse.json({ timestamp: 0, status: "waiting" });
        return NextResponse.json(JSON.parse(fs.readFileSync(metaPath, "utf8")));
    } catch {
        return NextResponse.json({ timestamp: 0, status: "error" });
    }
}

export async function POST(req: Request) {
    try {
        const { status, code } = await req.json();
        const livePath = path.join(process.cwd(), "app/live/Component.tsx");
        const metaPath = path.join(process.cwd(), "app/live/meta.json");
        const liveDir = path.dirname(livePath);
        const timestamp = Date.now();
        if (!fs.existsSync(liveDir)) fs.mkdirSync(liveDir, { recursive: true });
        if (code) {
            const cleanCode = code.replace(/'use client';?/g, "").trim();
            fs.writeFileSync(livePath, `'use client';\n\n${cleanCode}`, "utf-8");
        }
        fs.writeFileSync(metaPath, JSON.stringify({ timestamp, status: status || "ready" }), "utf-8");
        return NextResponse.json({ success: true, timestamp });
    } catch (error) {
        console.error("Bridge POST error:", error);
        return NextResponse.json({ success: false }, { status: 400 });
    }
}
