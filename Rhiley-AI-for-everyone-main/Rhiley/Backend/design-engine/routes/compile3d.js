const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { compileTo3DHTML, compileTo3DReact } = require("../engine/3dLiteCompiler");

router.post("/", async (req, res) => {
  try {
    console.log("------ 3D COMPILE ROUTE HIT ------");
    console.log("Body:", req.body);

    const { blueprint, format = "html" } = req.body;

    if (!blueprint) {
      return res.status(400).json({
        success: false,
        error: "No blueprint provided"
      });
    }

    let result;
    if (format === "react") {
      result = await compileTo3DReact(blueprint);
    } else {
      result = await compileTo3DHTML(blueprint);
    }

    return res.json({
      success: true,
      format: format,
      output: result
    });

  } catch (error) {
    console.error("3D Compile Error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
