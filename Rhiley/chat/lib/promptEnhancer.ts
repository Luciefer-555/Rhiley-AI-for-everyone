"use client";

// ── STYLE DETECTOR ────────────────────────────────────────

interface DetectedStyle {
    aesthetic: string;
    colors: string[];
    mood: string;
    lighting: string;
    quality: string;
    negative: string;
}

function detectStyle(message: string): DetectedStyle {
    const m = message.toLowerCase();

    // Glassmorphism
    if (/glass|glassmorphism|frosted|blur/.test(m)) return {
        aesthetic: "glassmorphism, frosted glass panels, translucent surfaces, backdrop blur",
        colors: ["#0a0a1a", "#1a1a3e", "#8b5cf6", "#06b6d4", "rgba(255,255,255,0.1)"],
        mood: "futuristic, premium, dark",
        lighting: "soft purple and cyan rim lighting, god rays, volumetric light",
        quality: "8k ultra detailed, professional design, sharp edges, cinematic",
        negative: "blurry, low quality, pixelated, watermark, text artifacts",
    };

    // 3D / Cyberpunk
    if (/3d|cyberpunk|neon|futuristic|tech/.test(m)) return {
        aesthetic: "cyberpunk aesthetic, neon glow, holographic elements, 3D rendered",
        colors: ["#0f0f1a", "#ff006e", "#8b5cf6", "#00f5ff", "#ffbe0b"],
        mood: "electric, intense, futuristic",
        lighting: "neon rim lighting, lens flares, volumetric fog, bloom effect",
        quality: "octane render, 8k, hyperdetailed, trending on artstation",
        negative: "dull, low contrast, dated, cartoon, anime",
    };

    // Minimal / Clean
    if (/minimal|clean|simple|flat/.test(m)) return {
        aesthetic: "minimalist design, clean lines, generous whitespace, Swiss design",
        colors: ["#fafafa", "#1a1a1a", "#6366f1", "#e5e5e5"],
        mood: "calm, refined, professional",
        lighting: "soft diffused natural lighting, studio light",
        quality: "high resolution, professional photography, clean composition",
        negative: "cluttered, busy, low quality, watermark",
    };

    // Dark Mode / SaaS
    if (/dark|saas|product|app|dashboard/.test(m)) return {
        aesthetic: "dark mode UI, product design, sleek interface, premium software",
        colors: ["#07070f", "#111827", "#8b5cf6", "#ffffff", "#374151"],
        mood: "professional, modern, premium",
        lighting: "subtle purple ambient light, dark studio, dramatic shadows",
        quality: "8k, product photography, marketing render, crisp details",
        negative: "low quality, amateur, busy background",
    };

    // Logo / Icon
    if (/logo|icon|brand|identity/.test(m)) return {
        aesthetic: "professional logo design, vector style, brand identity",
        colors: ["#6366f1", "#8b5cf6", "#ffffff", "#1a1a2e"],
        mood: "bold, memorable, clean",
        lighting: "flat design or subtle 3D shading",
        quality: "vector quality, scalable, high contrast, professional branding",
        negative: "complex, cluttered, low resolution, amateur",
    };

    // Poster / Editorial
    if (/poster|editorial|magazine|print/.test(m)) return {
        aesthetic: "editorial design, typographic poster, avant-garde layout",
        colors: ["#1a1a1a", "#f0f0f0", "#ff4444", "#ffd700"],
        mood: "bold, striking, artistic",
        lighting: "dramatic, high contrast, studio quality",
        quality: "print quality, 300dpi equivalent, razor sharp",
        negative: "digital noise, blur, low resolution",
    };

    // Nature / Organic
    if (/nature|organic|plant|landscape|photo/.test(m)) return {
        aesthetic: "photorealistic, natural, organic textures",
        colors: ["#2d5a27", "#8fbc8f", "#87ceeb", "#f4a460"],
        mood: "serene, natural, breathing",
        lighting: "golden hour natural light, soft shadows, atmospheric",
        quality: "photorealistic, 8k DSLR, professional photography",
        negative: "artificial, plastic, low quality, digital artifacts",
    };

    // Default: premium dark aesthetic (Rhiley's signature style)
    return {
        aesthetic: "premium digital artwork, dark aesthetic, modern design",
        colors: ["#07070f", "#8b5cf6", "#06b6d4", "#ffffff"],
        mood: "premium, modern, striking",
        lighting: "cinematic lighting, rim light, subtle glow",
        quality: "8k ultra detailed, professional, trending on artstation",
        negative: "low quality, blurry, watermark, amateur",
    };
}

// ── SUBJECT EXTRACTOR ────────────────────────────────────
// Pulls the actual subject from user message

function extractSubject(message: string): string {
    // Remove common trigger words
    let subject = message
        .replace(/create|generate|make|draw|design|build|show me|give me|i want|please|for me|can you/gi, "")
        .replace(/a |an |the /gi, "")
        .replace(/image of|picture of|photo of|illustration of|artwork of/gi, "")
        .trim();

    return subject || message;
}

// ── MAIN PROMPT ENHANCER ─────────────────────────────────

export function enhanceImagePrompt(userMessage: string): string {
    const style = detectStyle(userMessage);
    const subject = extractSubject(userMessage);

    // Build rich prompt
    const parts = [
        // Core subject
        subject,

        // Aesthetic direction (from dataset knowledge)
        style.aesthetic,

        // Color palette
        `color palette: ${style.colors.slice(0, 4).join(", ")}`,

        // Mood + lighting
        style.mood,
        style.lighting,

        // Technical quality
        style.quality,

        // Consistent Rhiley style additions
        "professional composition, rule of thirds",
        "no watermark, no text overlay",
    ];

    const positivePrompt = parts.join(", ");

    return positivePrompt;
}

export function getNegativePrompt(userMessage: string): string {
    const style = detectStyle(userMessage);
    return [
        style.negative,
        "watermark, signature, text, blurry, low resolution, pixelated",
        "amateur, low quality, distorted, bad anatomy",
        "overexposed, underexposed, noise, grain",
    ].join(", ");
}

// ── VARIATION BUILDER ────────────────────────────────────

export function buildVariationPrompt(
    originalPrompt: string,
    variationType: "darker" | "lighter" | "more_detailed" | "different_angle" | "abstract"
): string {
    const variations = {
        darker: `${originalPrompt}, darker mood, deep shadows, dramatic contrast`,
        lighter: `${originalPrompt}, bright airy atmosphere, soft pastel tones`,
        more_detailed: `${originalPrompt}, highly detailed, intricate, maximalist, rich textures`,
        different_angle: `${originalPrompt}, different perspective, dynamic composition, unique angle`,
        abstract: `${originalPrompt}, abstract interpretation, artistic, painterly, expressive`,
    };
    return variations[variationType];
}
