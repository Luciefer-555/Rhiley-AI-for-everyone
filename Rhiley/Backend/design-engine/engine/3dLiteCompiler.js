const axios = require("axios");
const { validateStrictBlueprint } = require("./blueprintCompiler");

function cleanModelOutput(text) {
  const firstTag = text.indexOf("<");
  if (firstTag !== -1) {
    return text.substring(firstTag);
  }
  return text.trim();
}

async function compileTo3DHTML(blueprint) {
  validateStrictBlueprint(blueprint);
  
  const prompt = `You are a frontend layout compiler.

Convert the provided strict blueprint IR into a visually rich 3D-style website using Tailwind CSS.

STRICT RULES:
- Use CSS transforms (rotate, scale, perspective).
- Use transform-gpu.
- Add subtle depth layering.
- Use box-shadow for depth.
- Use animated gradients for background.
- Do NOT use heavy WebGL libraries.
- Do NOT import Three.js.
- Output only valid HTML.
- No explanations.

BLUEPRINT STRUCTURE:
- version: "1.0"
- type: "page"
- layout: "vertical"
- theme: { primary, secondary, neutral, dark }
- sections: [{ id, order, type, style: { heightRatio, backgroundColor, padding }, content: { headline, subheadline, body, cta } }]

Blueprint:
${JSON.stringify(blueprint, null, 2)}`;

  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "deepseek-coder:6.7b",
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.2,
        top_p: 0.8
      }
    }, { timeout: 60000 });

    if (!response.data || !response.data.response) {
      throw new Error("Invalid response from DeepSeek");
    }

    const cleanedOutput = cleanModelOutput(response.data.response);
    console.log("DeepSeek 3D HTML Output:", cleanedOutput);
    
    return cleanedOutput;
    
  } catch (error) {
    console.error("DeepSeek 3D HTML Compiler Error:", error.message);
    throw error;
  }
}

async function compileTo3DReact(blueprint) {
  validateStrictBlueprint(blueprint);
  
  const prompt = `You are a React TypeScript layout compiler.

Convert the provided strict blueprint IR into a React TypeScript component with 3D-style effects.

STRICT RULES:
- Use a default exported functional component.
- Use Tailwind utility classes only.
- Do NOT invent new layout structure.
- Respect section order.
- Use heightRatio for relative sizing.
- Use theme colors exactly.
- Add transform-gpu.
- Add perspective-[1000px].
- Add hover:rotate-x and hover:rotate-y.
- Add smooth transitions.
- Add layered absolute elements for depth.
- Do NOT import external 3D libraries.
- Output only valid TSX.
- No explanations.

BLUEPRINT STRUCTURE:
- version: "1.0"
- type: "page"
- layout: "vertical"
- theme: { primary, secondary, neutral, dark }
- sections: [{ id, order, type, style: { heightRatio, backgroundColor, padding }, content: { headline, subheadline, body, cta } }]

Blueprint:
${JSON.stringify(blueprint, null, 2)}`;

  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "deepseek-coder:6.7b",
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.2,
        top_p: 0.8
      }
    }, { timeout: 60000 });

    if (!response.data || !response.data.response) {
      throw new Error("Invalid response from DeepSeek");
    }

    const text = response.data.response;
    const firstImport = text.indexOf("import");
    const firstExport = text.indexOf("export");

    const start = Math.min(
      firstImport !== -1 ? firstImport : Infinity,
      firstExport !== -1 ? firstExport : Infinity
    );

    const cleanedOutput = start !== Infinity ? text.substring(start) : text;
    console.log("DeepSeek 3D React Output:", cleanedOutput);
    
    return cleanedOutput;
    
  } catch (error) {
    console.error("DeepSeek 3D React Compiler Error:", error.message);
    throw error;
  }
}

module.exports = { compileTo3DHTML, compileTo3DReact };
