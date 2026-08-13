const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { selectTemplate } = require("../engine/templateSelector");
const { mapBlueprintToTemplate } = require("../engine/blueprintMapper");
const { compileWithDeepSeek } = require("../engine/deepseekCompiler");
const { validateReactOutput } = require("../engine/outputValidator");

router.post("/", async (req, res) => {
  try {
    console.log("------ TEMPLATE COMPILE ROUTE HIT ------");
    console.log("Body:", req.body);

    const { blueprint, target, mode } = req.body;

    if (!blueprint) {
      return res.status(400).json({ success: false, error: "No blueprint provided" });
    }
    if (!blueprint.layout) {
      return res.status(400).json({ success: false, error: "blueprint.layout is required (e.g. 'vertical', 'sidebar')" });
    }
    if (!blueprint.sections || !Array.isArray(blueprint.sections) || blueprint.sections.length === 0) {
      return res.status(400).json({ success: false, error: "blueprint.sections must be a non-empty array" });
    }

    const template = selectTemplate({
      blueprint,
      target: target || "react-ts",
      mode: mode || "standard"
    });

    const mapping = mapBlueprintToTemplate(
      blueprint,
      template
    );

    let output;
    let attempts = 0;
    let valid = false;

    while (attempts < 2 && !valid) {
      output = await compileWithDeepSeek({
        designStyle: blueprint.designStyle || "cinematic-dark",
        motionPreset: blueprint.motionPreset || "staggerRise",
        mappedSections: mapping.mappedSections
      });

      const result = validateReactOutput(
        output,
        mapping.mappedSections
      );

      if (result.valid) {
        valid = true;
      } else {
        console.log("Validation failed:", result.reason);
      }

      attempts++;
    }

    if (!valid) {
      return res.status(500).json({
        success: false,
        error: "Compilation validation failed"
      });
    }

    return res.json({
      success: true,
      template: template.id,
      output
    });

  } catch (err) {
    console.error("Compilation error:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
