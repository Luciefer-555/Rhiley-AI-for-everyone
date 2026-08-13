const express = require("express");
const router = express.Router();
const { compileWithDeepSeek } = require("../engine/deepseekCompiler");

router.post("/", async (req, res) => {
  try {
    console.log("------ COMPILE ROUTE HIT ------");

    const { blueprint } = req.body;

    if (!blueprint) {
      return res.status(400).json({ success: false, error: "No blueprint provided" });
    }

    if (!blueprint.sections || !Array.isArray(blueprint.sections)) {
      return res.status(400).json({ success: false, error: "blueprint.sections must be an array" });
    }

    // Map sections into mappedSections format expected by the compiler
    const mappedSections = blueprint.sections.map((s, i) => ({
      slotName: s.id || s.type || `section-${i}`,
      label: s.type || `Section ${i + 1}`,
      section: s
    }));

    const output = await compileWithDeepSeek({
      designStyle: blueprint.designStyle || "cinematic-dark",
      motionPreset: blueprint.motionPreset || "staggerRise",
      mappedSections
    });

    return res.json({ success: true, output });

  } catch (error) {
    console.error("Compile Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
