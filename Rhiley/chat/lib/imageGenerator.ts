"use client";

export interface ImageGenerationRequest {
    prompt: string;
    enhancedPrompt: string;
    width?: number;
    height?: number;
    style?: string;
}

export interface ImageGenerationResult {
    success: boolean;
    imageData?: string;   // base64 encoded image
    mimeType?: string;   // "image/png" | "image/jpeg"
    prompt: string;   // the enhanced prompt used
    error?: string;
}

// ── DETECT IMAGE INTENT ───────────────────────────────────

const IMAGE_PATTERNS = [
    /create (a|an|me a|me an|this)/i,
    /generate (a|an|me|an image|a image)/i,
    /make (a|an|me a|me an) (image|picture|photo|illustration|artwork|poster|logo|icon|banner|thumbnail|wallpaper|design|visual|graphic)/i,
    /draw (a|an|me)/i,
    /design (a|an|me a)/i,
    /\b(image|picture|illustration|artwork|poster|logo|icon|banner|thumbnail|wallpaper)\b.*(for me|please|now)/i,
    /imagine (a|an|this)/i,
    /visualize (a|an|this)/i,
    /show me (a|an|what)/i,
    /paint (a|an|me)/i,
];

export function isImageRequest(message: string): boolean {
    return IMAGE_PATTERNS.some(p => p.test(message));
}

// ── GENERATE IMAGE (SERVER-SIDE PROXIED) ───────────────────

export async function generateImage(
    req: ImageGenerationRequest,
    onProgress?: (status: string) => void,
): Promise<ImageGenerationResult> {
    try {
        onProgress?.("🎨 Rhiley is mixing colors...");

        // Call our internal API to avoid browser CORS / Network issues
        const res = await fetch("/api/imagine", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: req.prompt,
                enhancedPrompt: req.enhancedPrompt,
                width: req.width,
                height: req.height
            }),
            signal: AbortSignal.timeout(90_000), // 90s timeout
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return {
                success: false,
                prompt: req.enhancedPrompt,
                error: data.error || `Generation failed (${res.status})`,
            };
        }

        const data = await res.json();

        if (data.image) {
            return {
                success: true,
                imageData: data.image,
                mimeType: "image/png",
                prompt: data.prompt || req.enhancedPrompt,
            };
        }

        return {
            success: false,
            prompt: req.enhancedPrompt,
            error: "No image data returned from server.",
        };

    } catch (err: any) {
        if (err?.name === "AbortError") {
            return { success: false, prompt: req.enhancedPrompt, error: "Painting took too long. Please try again." };
        }
        return { success: false, prompt: req.enhancedPrompt, error: "Rhiley had a problem reaching the canvas. Try again?" };
    }
}
