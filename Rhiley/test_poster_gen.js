const IMAGE_API = "https://image.pollinations.ai/prompt";

function detectStyle(message) {
    const m = message.toLowerCase();
    if (/poster|editorial|magazine|print/.test(m)) return {
        aesthetic: "editorial design, typographic poster, avant-garde layout",
        colors: ["#1a1a1a", "#f0f0f0", "#ff4444", "#ffd700"],
        mood: "bold, striking, artistic",
        lighting: "dramatic, high contrast, studio quality",
        quality: "print quality, 300dpi equivalent, razor sharp",
        negative: "digital noise, blur, low resolution",
    };
    return {
        aesthetic: "premium digital artwork, dark aesthetic, modern design",
        colors: ["#07070f", "#8b5cf6", "#06b6d4", "#ffffff"],
        mood: "premium, modern, striking",
        lighting: "cinematic lighting, rim light, subtle glow",
        quality: "8k ultra detailed, professional, trending on artstation",
        negative: "low quality, blurry, watermark, amateur",
    };
}

function extractSubject(message) {
    return message
        .replace(/create|generate|make|draw|design|build|show me|give me|i want|please|for me|can you/gi, "")
        .replace(/a |an |the /gi, "")
        .replace(/image of|picture of|photo of|illustration of|artwork of/gi, "")
        .trim();
}

function enhanceImagePrompt(userMessage) {
    const style = detectStyle(userMessage);
    const subject = extractSubject(userMessage);
    const parts = [
        subject,
        style.aesthetic,
        `color palette: ${style.colors.slice(0, 4).join(", ")}`,
        style.mood,
        style.lighting,
        style.quality,
        "professional composition, rule of thirds",
        "no watermark, no text overlay",
    ];
    return parts.join(", ");
}

async function testPosterGen() {
    const userRequest = "Create a minimalist cyberpunk poster for Rhiley";
    console.log(`🎬 Request: "${userRequest}"`);

    const enhancedPrompt = enhanceImagePrompt(userRequest);
    console.log(`✨ Enhanced Prompt: "${enhancedPrompt}"`);

    // Dimensions for poster (Portrait)
    const width = 800;
    const height = 1132;
    const seed = Math.floor(Math.random() * 1000000);

    const url = `${IMAGE_API}/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}`;

    try {
        console.log("📡 Sending request to Pollinations AI...");
        console.log(`🔗 URL: ${url}`);

        const res = await fetch(url);

        if (!res.ok) {
            console.error(`❌ API Error: ${res.status}`);
            return;
        }

        const blob = await res.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length > 1000) {
            console.log("✅ Success! Poster image generated.");
            console.log(`📊 Size: ${(buffer.length / 1024).toFixed(2)} KB`);
        } else {
            console.log("❌ Failed: Response too small.");
            console.log(buffer.toString().slice(0, 100));
        }

    } catch (err) {
        console.error("❌ Fetch Error:", err.message);
    }
}

testPosterGen();
