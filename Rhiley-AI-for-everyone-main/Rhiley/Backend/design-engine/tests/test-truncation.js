const axios = require("axios");

async function testTruncation() {
    console.log("🚀 Testing Truncation Prevention...");

    const prompt = "Build a massive 10-page e-commerce dashboard with detailed charts for every country, full user management system, interactive inventory logs, and a complex marketing automation suite in one single file. Make it extremely detailed.";

    try {
        const res = await axios.post("http://localhost:3002/chat", {
            message: prompt,
            history: []
        });

        const reply = res.data.reply;
        const lineCount = reply.split("\n").length;

        console.log(`✅ Response received. Lines: ${lineCount}`);

        if (lineCount > 220) {
            console.warn("⚠️ Warning: Response exceeded 200 line target significantly.");
        }

        if (reply.includes("Component") && reply.trim().endsWith("}")) {
            console.log("✅ Code appears complete (not truncated).");
        } else {
            console.error("❌ Code appears truncated!");
        }
    } catch (err) {
        console.error("❌ Test failed:", err.message);
    }
}

testTruncation();
