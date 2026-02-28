const IMAGE_API = "https://image.pollinations.ai/prompt";

async function testImageGen() {
    console.log(`🚀 Testing image generation with Pollinations AI...`);

    const myFetch = typeof fetch !== 'undefined' ? fetch : null;
    if (!myFetch) {
        console.error("❌ Node error: 'fetch' is not defined. Please use Node 18+ or install node-fetch.");
        process.exit(1);
    }

    const prompt = "A beautiful dark glassmorphism app icon, purple and cyan neon glow, 8k ultra detailed";
    const url = `${IMAGE_API}/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true`;

    try {
        console.log("📡 Sending request to Pollinations AI...");
        console.log(`URL: ${url}`);

        const res = await myFetch(url);

        if (!res.ok) {
            console.error(`❌ API Error: ${res.status}`);
            return;
        }

        const blob = await res.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length > 1000) {
            console.log("✅ Success! Image generated.");
            console.log(`Bynary size: ${buffer.length} bytes`);
            console.log(`Base64 length: ${buffer.toString('base64').length}`);
        } else {
            console.log("❌ Failed: Response too small, might not be an image.");
            console.log(buffer.toString().slice(0, 100));
        }

    } catch (err) {
        console.error("❌ Fetch Error:", err.message);
    }
}

testImageGen();
