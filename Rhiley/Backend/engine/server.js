import express from "express";
import multer from "multer";
import cors from "cors";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

// Core modules
import { analyzeImage } from "./vision.js";
import { analyzeWithOpenCV } from "./perceptionService.js";
import { compileBlueprint } from "./blueprintCompiler.js";
import { generateCode } from "./codeEngine.js";
import { validateBlueprint } from "./validateBlueprint.js";

// Safety net for visibility
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

const ENGINE_VERSION = "blueprint-compiler-v1";
const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());

/* ─────────────────────────────
   ANALYZE ENDPOINT (Production-Safe)
   ────────────────────────────── */
app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    console.log("📸 Request received");
    console.log("📁 File exists:", !!req.file);
    console.log("📄 Request body:", req.body);

    // Validate file upload
    if (!req.file) {
      console.log("❌ No file uploaded");
      return res.status(400).json({ 
        error: "No image uploaded",
        code: "MISSING_FILE"
      });
    }

    // Validate file buffer
    if (!req.file.buffer || req.file.buffer.length === 0) {
      console.log("❌ Empty file buffer");
      return res.status(400).json({ 
        error: "Empty image file",
        code: "EMPTY_FILE"
      });
    }

    const userPrompt = req.body.prompt || "";

    console.log("🔍 Starting perception analysis...");

    // Step 1: Vision Analysis
    let vision;
    try {
      const imageBase64 = req.file.buffer.toString("base64");
      vision = await analyzeImage(imageBase64);
      console.log("✅ Vision analysis completed");
    } catch (visionError) {
      console.error("❌ Vision analysis failed:", visionError.message);
      return res.status(500).json({ 
        error: "Vision analysis failed",
        code: "VISION_ERROR",
        details: visionError.message
      });
    }

    // Step 2: OpenCV Perception
    let perception;
    try {
      perception = await analyzeWithOpenCV(req.file.buffer);
      console.log("✅ OpenCV perception completed");
    } catch (opencvError) {
      console.error("❌ OpenCV perception failed:", opencvError.message);
      return res.status(500).json({ 
        error: "OpenCV perception failed",
        code: "OPENCV_ERROR",
        details: opencvError.message
      });
    }

    console.log("📊 Perception data:", JSON.stringify(perception, null, 2));
    console.log("👁️ Vision data:", vision);

    // Step 3: Blueprint Compilation
    let blueprint;
    try {
      blueprint = compileBlueprint(perception, vision);
      console.log("✅ Blueprint compilation completed");
    } catch (blueprintError) {
      console.error("❌ Blueprint compilation failed:", blueprintError.message);
      return res.status(500).json({ 
        error: "Blueprint compilation failed",
        code: "BLUEPRINT_ERROR",
        details: blueprintError.message
      });
    }

    console.log("📋 Blueprint raw:", JSON.stringify(blueprint, null, 2));

    // Step 4: Schema Validation
    try {
      validateBlueprint(blueprint);
      console.log("✅ Blueprint validation passed");
    } catch (validationError) {
      console.error("❌ Blueprint validation failed:", validationError.message);
      return res.status(500).json({ 
        error: "Blueprint validation failed",
        code: "VALIDATION_ERROR",
        details: validationError.message
      });
    }

    // Step 5: Code Generation
    let generatedCode;
    try {
      generatedCode = generateCode(blueprint, userPrompt);
      console.log("✅ Code generation completed");
      console.log("📁 Generated files:", Object.keys(generatedCode.files));
    } catch (codeError) {
      console.error("❌ Code generation failed:", codeError.message);
      return res.status(500).json({ 
        error: "Code generation failed",
        code: "CODE_ERROR",
        details: codeError.message
      });
    }

    console.log("🎉 Analysis completed successfully");

    return res.json({
      status: "ok",
      version: ENGINE_VERSION,
      result: {
        blueprint,
        generated_code: generatedCode
      }
    });

  } catch (globalError) {
    console.error("💥 Global route error:", globalError.message);
    console.error("💥 Stack trace:", globalError.stack);
    
    return res.status(500).json({ 
      error: "Internal server error",
      code: "GLOBAL_ERROR",
      details: globalError.message
    });
  }
});

/* ─────────────────────────────
   BLUEPRINT COMPILE ENDPOINT (Strict Contract v1)
   ────────────────────────────── */
app.post("/compile", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const userPrompt = req.body.prompt || "";

    // Step 1: Perception
    const imageBase64 = req.file.buffer.toString("base64");
    const vision = await analyzeImage(imageBase64);
    const perception = await analyzeWithOpenCV(req.file.buffer);

    console.log("PERCEPTION:", perception);
    console.log("VISION:", vision);

    // Step 2: Blueprint Compilation
    let blueprint = compileBlueprint(perception, vision);
    console.log("Blueprint raw:", JSON.stringify(blueprint, null, 2));

    // Step 3: Validate against strict contract
    validateBlueprint(blueprint);

    // Step 4: Code Generation
    const generatedCode = generateCode(blueprint, userPrompt);
    console.log("GENERATED CODE:", Object.keys(generatedCode.files));

    return res.json({
      status: "ok",
      version: ENGINE_VERSION,
      result: {
        blueprint,
        generated_code: generatedCode
      }
    });

  } catch (err) {
    console.error("❌ Compile error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────
   CRITIQUE ENDPOINT (Separate, never pollutes blueprint)
   ────────────────────────────── */
app.post("/critique", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imageBase64 = req.file.buffer.toString("base64");
    const vision = await analyzeImage(imageBase64);

    // Separate critique logic - never touches blueprint
    const critique = {
      analysis: vision,
      timestamp: new Date().toISOString(),
      type: "design_philosophy"
    };

    return res.json({
      status: "ok",
      version: ENGINE_VERSION,
      result: {
        critique
      }
    });

  } catch (err) {
    console.error("❌ Critique error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────
   LEGACY GENERATE ENDPOINT (for compatibility)
   ────────────────────────────── */
app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const userPrompt = req.body.prompt || "";

    // Step 1: Perception
    const imageBase64 = req.file.buffer.toString("base64");
    const vision = await analyzeImage(imageBase64);
    const perception = await analyzeWithOpenCV(req.file.buffer);

    // Step 2: Blueprint Compilation
    let blueprint = compileBlueprint(perception, vision);

    // Step 3: Validate against strict contract
    validateBlueprint(blueprint);

    // Step 4: Code Generation
    const generatedCode = generateCode(blueprint, userPrompt);

    return res.json({
      status: "ok",
      version: ENGINE_VERSION,
      result: {
        blueprint,
        generated_code: generatedCode
      }
    });

  } catch (err) {
    console.error("❌ Generation error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────
   HEALTH CHECK ENDPOINT
   ────────────────────────────── */
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    version: ENGINE_VERSION,
    contract: "DesignToCodeBlueprintV1"
  });
});

/* ─────────────────────────────
   SERVER BOOT
   ────────────────────────────── */
app.listen(3000, () => {
  console.log("🔥 Blueprint Compiler v1 running at http://localhost:3000");
  console.log("📋 Contract: DesignToCodeBlueprintV1 (Strict)");
});
