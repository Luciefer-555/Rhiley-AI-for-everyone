import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const metaPath = path.join(process.cwd(), 'app/live/meta.json');
        if (!fs.existsSync(metaPath)) {
            return NextResponse.json({ timestamp: 0, status: "waiting" });
        }
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        return NextResponse.json(meta);
    } catch (error) {
        return NextResponse.json({ timestamp: 0, status: "error" });
    }
}

export async function POST(req: Request) {
    try {
        const { status, code } = await req.json();
        const livePath = path.join(process.cwd(), 'app/live/Component.tsx');
        const metaPath = path.join(process.cwd(), 'app/live/meta.json');

        const timestamp = Date.now();

        // 1. If code is provided, write it to Component.tsx
        if (code) {
            // Clean and prepend 'use client'
            const cleanCode = code.replace(/'use client';?/g, '').trim();
            const finalCode = `'use client';\n\n${cleanCode}`;
            fs.writeFileSync(livePath, finalCode);
            console.log(`✅ [SYNC_BRIDGE] Component.tsx updated via POST`);
        }

        // 2. Update meta.json
        const meta = {
            timestamp,
            status: status || "ready"
        };
        fs.writeFileSync(metaPath, JSON.stringify(meta));

        return NextResponse.json({ success: true, timestamp });
    } catch (error) {
        console.error("Bridge POST error:", error);
        return NextResponse.json({ success: false }, { status: 400 });
    }
}
