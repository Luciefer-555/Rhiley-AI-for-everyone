
const testShorde = async () => {
    try {
        console.log("Testing Shorde...");
        const res = await fetch("https://stablehorde.net/api/v2/generate/async", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": "0000000000"
            },
            body: JSON.stringify({
                prompt: "a cat",
                params: {
                    steps: 20,
                    n: 1,
                    sampler_name: "k_euler",
                    width: 512,
                    height: 512
                }
            }),
            signal: AbortSignal.timeout(30000)
        });

        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Data:", data);
        if (data.id) {
            console.log("✅ SUCCESS: Found ID:", data.id);
        }
    } catch (e) {
        console.error("Test failed:", e.message);
    }
};

testShorde();
