const express = require("express");
const router = express.Router();
const { validateBlueprint } = require("../engine/validator");
const { renderPage } = require("../engine/renderer");

router.post("/", (req, res) => {
  try {
    console.log("Route: Processing blueprint request");
    
    const blueprint = req.body.blueprint || req.body;
    console.log("Blueprint received:", JSON.stringify(blueprint, null, 2));

    const validation = validateBlueprint(blueprint);
    if (!validation.valid) {
      console.error("Validation failed:", validation.error);
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    console.log("Validation passed, generating HTML");
    const html = renderPage(blueprint);

    return res.json({
      success: true,
      html: html
    });

  } catch (error) {
    console.error("Route error:", error.message);
    console.error("Stack:", error.stack);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
