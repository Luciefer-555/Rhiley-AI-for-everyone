const axios = require("axios");

async function testAutoFixProtocol() {
    console.log("🚀 Testing Auto-Fix Protocol (Backend Logic)...");

    const brokenCode = `import React from 'react';\n\nexport default function Component() {\n  return (\n    <div>\n      <h1>Broken Tag\n    </div>\n  );}`;
    const errorMsg = "JSX element 'h1' has no corresponding closing tag.";

    const fixRequest = `🔴 AUTO-FIX REQUEST (Attempt 1/3)\n\nERROR:\n${errorMsg}\n\nBROKEN CODE:\n\`\`\`tsx\n${brokenCode}\n\`\`\`\n\nReturn the complete corrected TSX file.`;

    try {
        const res = await axios.post("http://localhost:3002/chat", {
            message: fixRequest,
            history: []
        });

        const reply = res.data.reply;
        console.log("✅ Response received.");

        if (reply.includes("✅ FIXED:")) {
            console.log("✅ AI identified fix with '✅ FIXED:' header.");
        } else {
            console.warn("⚠️ Warning: AI did not use '✅ FIXED:' header.");
        }

        if (reply.includes("</h1>") || reply.includes("<h1 />")) {
            console.log("✅ AI fixed the syntax error.");
        } else {
            console.error("❌ AI failed to fix the syntax error.");
        }

        console.log("\n--- AI RESPONSE ---");
        console.log(reply);
        console.log("-------------------\n");

    } catch (err) {
        console.error("❌ Test failed:", err.message);
    }
}

testAutoFixProtocol();
