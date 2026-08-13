const axios = require("axios");

const API_URL = "http://localhost:3002/compileTemplate";

async function runTest(name, body, expectedResults = {}) {
  try {
    const res = await axios.post(API_URL, body);
    const output = res.data.output || "";

    console.log(`\n===== TEST: ${name} =====`);
    console.log("Template:", res.data.template || "N/A");
    console.log("Success:", res.data.success);

    let passed = 0;
    let total = 0;

    // Test 1: Export default
    total++;
    if (output.includes("export default")) {
      console.log("✅ Export default present");
      passed++;
    } else {
      console.log("❌ Missing export default");
    }

    // Test 2: Section count
    total++;
    const expectedSections = body.blueprint.sections.length;
    let sectionMatches = 0;
    body.blueprint.sections.forEach((s) => {
      if (output.includes(s.type)) {
        sectionMatches++;
      }
    });
    if (sectionMatches === expectedSections) {
      console.log("✅ Section count match");
      passed++;
    } else {
      console.log(`❌ Section count mismatch: expected ${expectedSections}, found ${sectionMatches}`);
    }

    // Test 3: Theme integration
    total++;
    if (body.blueprint.theme?.primary && output.includes(body.blueprint.theme.primary)) {
      console.log("✅ Theme color integrated");
      passed++;
    } else {
      console.log("❌ Theme color missing");
    }

    // Test 4: Output length
    total++;
    if (output.length > 100) {
      console.log(`✅ Output length sufficient: ${output.length} chars`);
      passed++;
    } else {
      console.log(`❌ Output too short: ${output.length} chars`);
    }

    // Test 5: No markdown
    total++;
    if (!output.includes("```") && !output.includes("```tsx") && !output.includes("```javascript")) {
      console.log("✅ No markdown artifacts");
      passed++;
    } else {
      console.log("❌ Markdown artifacts present");
    }

    console.log(`Results: ${passed}/${total} tests passed`);
    return passed === total;

  } catch (err) {
    console.log(`❌ Test failed: ${err.message}`);
    return false;
  }
}

async function runFullTestSuite() {
  console.log("🧪 STARTING FULL TEST SUITE");

  const testCases = [
    {
      name: "Basic Vertical Layout",
      body: {
        target: "react-ts",
        mode: "standard",
        blueprint: {
          type: "page",
          layout: "vertical",
          theme: { primary: "#3b82f6", secondary: "#10b981", neutral: "#ffffff" },
          sections: [
            { type: "hero", content: { headline: "Welcome", subheadline: "Hero Section" } },
            { type: "section", content: { headline: "Features", body: "Feature content" } }
          ]
        }
      }
    },
    {
      name: "3D Portfolio Layout",
      body: {
        target: "react-ts",
        mode: "3d-lite",
        blueprint: {
          type: "page",
          layout: "vertical",
          theme: { primary: "#8b5cf6", secondary: "#ec4899", neutral: "#1f2937" },
          sections: [
            { type: "hero", content: { headline: "Portfolio", subheadline: "Creative Developer" } },
            { type: "contentBlock", content: { headline: "Project 1", body: "Project description" } },
            { type: "section", content: { headline: "Contact", body: "Get in touch" } }
          ]
        }
      }
    },
    {
      name: "Minimal Single Section",
      body: {
        target: "react-ts",
        mode: "standard",
        blueprint: {
          type: "page",
          layout: "vertical",
          theme: { primary: "#ef4444", neutral: "#f3f4f6" },
          sections: [
            { type: "hero", content: { headline: "Simple", subheadline: "Clean design" } }
          ]
        }
      }
    },
    {
      name: "Complex Multi-Section",
      body: {
        target: "react-ts",
        mode: "standard",
        blueprint: {
          type: "page",
          layout: "vertical",
          theme: { primary: "#059669", secondary: "#0891b2", neutral: "#ffffff" },
          sections: [
            { type: "hero", content: { headline: "Dashboard", subheadline: "Analytics Overview" } },
            { type: "section", content: { headline: "Stats", body: "Key metrics" } },
            { type: "contentBlock", content: { headline: "Chart", body: "Data visualization" } },
            { type: "section", content: { headline: "Footer", body: "Copyright info" } }
          ]
        }
      }
    }
  ];

  let totalPassed = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    const passed = await runTest(testCase.name, testCase.body);
    if (passed) totalPassed++;
  }

  console.log(`\n🏁 FINAL RESULTS: ${totalPassed}/${totalTests} test suites passed`);
  
  if (totalPassed === totalTests) {
    console.log("🎉 ALL TESTS PASSED - System is ready for production!");
  } else {
    console.log("⚠️  Some tests failed - Review logs above");
  }
}

runFullTestSuite();
