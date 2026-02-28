
const testOllama = async () => {
    try {
        console.log("Testing Ollama x/z-image-turbo...");
        const res = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "x/z-image-turbo",
                prompt: "a minimalist cyberpunk cat poster",
                stream: false
            }),
            signal: AbortSignal.timeout(60000)
        });

        if (!res.ok) {
            console.log(`Ollama responded with status: ${res.status}`);
            const text = await res.text();
            console.log("Response text:", text);
            return;
        }

        const data = await res.json();
        console.log("Ollama Response Keys:", Object.keys(data));
        if (data.images) {
            console.log(`✅ SUCCESS: Found ${data.images.length} images.`);
            console.log("First 100 chars of first image:", data.images[0].substring(0, 100));
        } else if (data.response) {
            console.log("Response text (no images array):", data.response.substring(0, 500));
        } else {
            console.log("No images or response found in data.");
        }
    } catch (e) {
        console.error("Test failed:", e.message);
    }
};

testOllama();
