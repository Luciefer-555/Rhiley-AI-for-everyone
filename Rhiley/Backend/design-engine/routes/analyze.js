const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { analyzeImage } = require("../engine/opencvAnalyzer");
const { buildBlueprint } = require("../engine/blueprintBuilder");
const { normalizeBlueprint, validateStrictBlueprint } = require("../engine/blueprintCompiler");

const uploadDir = path.join(__dirname, "../uploads");
const blueprintDir = path.join(__dirname, "../blueprints");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

if (!fs.existsSync(blueprintDir)) {
  fs.mkdirSync(blueprintDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    console.log("------ ANALYZE ROUTE HIT ------");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("File:", req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image uploaded"
      });
    }

    const imagePath = req.file.path;

    const analysis = await analyzeImage(imagePath);
    console.log("OpenCV Analysis:", analysis);

    const rawBlueprint = buildBlueprint(analysis);
    console.log("Raw Blueprint:", rawBlueprint);

    const strictBlueprint = normalizeBlueprint(rawBlueprint, analysis.height);
    console.log("Strict Blueprint:", strictBlueprint);

    validateStrictBlueprint(strictBlueprint);
    console.log("Schema validation passed");

    const timestamp = Date.now();
    const filename = `blueprint-${timestamp}.json`;
    const filePath = path.join(blueprintDir, filename);

    fs.writeFileSync(filePath, JSON.stringify(strictBlueprint, null, 2));

    return res.json({
      success: true,
      file: filename,
      path: filePath,
      blueprint: strictBlueprint
    });

  } catch (error) {
    console.error("Analysis Error:", error.message);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
