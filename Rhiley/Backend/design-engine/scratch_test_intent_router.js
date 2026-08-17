require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const { routeIntent } = require('./intentRouter');

async function runTests() {
  console.log("=== Testing intentRouter ===");
  
  // A tiny dummy image buffer to simulate an image
  const testImageBuffer = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

  const cases = [
    {
      name: "Case 1: Detailed prompt only",
      args: {
        prompt: "Build me a landing page for a fitness app, hero section with headline 'Train Smarter', pricing section with 3 tiers, testimonials section",
        imageBuffer: null
      },
      expected: "detailed_prompt"
    },
    {
      name: "Case 2: Vague prompt only",
      args: {
        prompt: "make me a website for my bakery",
        imageBuffer: null
      },
      expected: "vague_prompt"
    },
    {
      name: "Case 3: Image only",
      args: {
        prompt: null,
        imageBuffer: testImageBuffer
      },
      expected: "image_only"
    },
    {
      name: "Case 4: Vague prompt with Image",
      args: {
        prompt: "make me a website for my bakery",
        imageBuffer: testImageBuffer
      },
      expected: "hybrid_image_vague"
    },
    {
      name: "Case 5: Empty input",
      args: {
        prompt: null,
        imageBuffer: null
      },
      expected: "ERROR"
    }
  ];

  for (const c of cases) {
    console.log(`\n--- ${c.name} ---`);
    const result = await routeIntent(c.args);
    console.log(JSON.stringify(result, null, 2));
    
    let passed = false;
    if (c.expected === "ERROR" && result.error !== null) {
      passed = true;
    } else if (result.route === c.expected) {
      passed = true;
    }
    
    if (passed) {
      console.log(`✅ Passed (Expected: ${c.expected})`);
    } else {
      console.log(`❌ Failed (Expected: ${c.expected}, Got: ${result.route || result.error})`);
    }
  }
}

runTests().catch(console.error);
