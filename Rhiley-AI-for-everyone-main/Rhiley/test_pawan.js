
const testPawan = async () => {
    try {
        console.log("Testing Pawan API...");
        const res = await fetch("https://api.pawan.krd/v1/images/generations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: "a cat",
                model: "shuttle-2-turbo",
                n: 1,
                size: "512x512"
            }),
            signal: AbortSignal.timeout(30000)
        });

        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Data:", JSON.stringify(data).substring(0, 500));
        if (data.data?.[0]?.url) {
            console.log("✅ SUCCESS: Found URL:", data.data[0].url);
        }
    } catch (e) {
        console.error("Test failed:", e.message);
    }
};

testPawan();
