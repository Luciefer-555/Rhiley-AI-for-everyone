const axios = require("axios");

const API_URL = "http://localhost:3002/compileTemplate";

async function runTest(name, body) {
  try {
    const res = await axios.post(API_URL, body);
    const output = res.data.output || "";

    console.log(`\n===== TEST: ${name} =====`);

    if (!output.includes("export default")) {
      console.log("❌ Missing export default");
      return;
    }

    const expectedSections = body.blueprint.sections.length;

    let sectionMatches = 0;

    body.blueprint.sections.forEach((s) => {
      if (output.includes(s.type)) {
        sectionMatches++;
      }
    });

    if (sectionMatches !== expectedSections) {
      console.log("❌ Section count mismatch");
    } else {
      console.log("✅ Section count OK");
    }

    console.log("Output length:", output.length);
    console.log("PASS\n");

  } catch (err) {
    console.log("❌ Test failed:", err.message);
  }
}

async function runAllTests() {

  const baseBlueprint = {
    type: "page",
    layout: "vertical",
    theme: {
      primary: "#e03a37"
    },
    sections: [
      { type: "hero", content: { headline: "Hero" } },
      { type: "section", content: { headline: "Section" } }
    ]
  };

  await runTest("Standard Mode", {
    target: "react-ts",
    mode: "standard",
    blueprint: baseBlueprint
  });

  await runTest("3D Mode", {
    target: "react-ts",
    mode: "3d-lite",
    blueprint: baseBlueprint
  });

  await runTest("Single Section", {
    target: "react-ts",
    mode: "standard",
    blueprint: {
      ...baseBlueprint,
      sections: [{ type: "hero", content: { headline: "Only" } }]
    }
  });

}

runAllTests();
