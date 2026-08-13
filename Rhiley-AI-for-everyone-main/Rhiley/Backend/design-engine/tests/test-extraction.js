const { validateTSX } = require("../lib/validateTSX");

function testExtraction() {
    console.log("🚀 Testing Code Extraction Logic...");

    const cases = [
        {
            name: "Standard Markdown",
            text: "Here is your code:\n```tsx\nexport default function Component() { return <div>Hi</div> }\n```\nHope you like it!",
            expected: "export default function Component() { return <div>Hi</div> }"
        },
        {
            name: "No Markdown",
            text: "'use client';\nexport default function Component() { return <div>Hi</div> }",
            expected: "'use client';\nexport default function Component() { return <div>Hi</div> }"
        },
        {
            name: "Broken Markdown (No Close)",
            text: "```tsx\nexport default function Component() { return <div>Hi</div> }",
            expected: "export default function Component() { return <div>Hi</div> }"
        }
    ];

    cases.forEach(c => {
        let code = c.text;
        if (code.includes("```")) {
            const codeMatch = code.match(/```(?:tsx?|jsx?|react)?\n([\s\S]*?)```/i) || code.match(/```(?:tsx?|jsx?|react)?\n([\s\S]*?)$/i);
            code = codeMatch ? codeMatch[1].trim() : code;
        }

        if (code === c.expected) {
            console.log(`✅ ${c.name} passed.`);
        } else {
            console.error(`❌ ${c.name} failed!`);
            console.log(`Got: [${code}]`);
        }
    });
}

testExtraction();
