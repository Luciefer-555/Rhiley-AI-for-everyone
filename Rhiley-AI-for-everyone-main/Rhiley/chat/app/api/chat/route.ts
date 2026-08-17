import { NextRequest, NextResponse } from "next/server";
import { orchestrate } from "../../../lib/multiModelOrchestrator";
import fs from "fs";
import path from "path";
import { detectIntent } from "@/lib/intentDetector";
import { getRhileyResponse } from "@/lib/personalityResponses";

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get("content-type") || "";

        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            const message = String(formData.get("message") || "");
            const image = formData.get("image") as File | null;
            let imageBase64: string[] | undefined;

            if (image) {
                const bytes = await image.arrayBuffer();
                imageBase64 = [Buffer.from(bytes).toString("base64")];
            }

            const result = await orchestrate({ userMessage: message || "analyze this image", history: [], imageBase64, aesthetic: "cinematic" });
            return NextResponse.json({ success: true, reply: result.content, model: result.modelLabel });
        }

        const body = await req.json();
        const { message, history, image, aesthetic } = body;
        const intent = detectIntent(message);
        const nonTaskIntents = ["greeting", "compliment", "flirt", "question_about_rhiley", "bored", "thanks", "insult", "frustration"];

        if (!image && nonTaskIntents.includes(intent)) {
            const reply = getRhileyResponse(intent);
            return NextResponse.json({ response: reply, reply, success: true, model: "Rhiley", intent, skipCodeGen: true });
        }

        const result = await orchestrate({ userMessage: message, history: history || [], imageBase64: image ? [image] : undefined, aesthetic: aesthetic || "cinematic" });

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

        return NextResponse.json({ success: true, reply: result.content, model: result.modelLabel });
    } catch (error: any) {
        console.error("[Rhiley API] Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
    }
}
