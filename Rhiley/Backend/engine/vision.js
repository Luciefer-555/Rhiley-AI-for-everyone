import axios from "axios";

export async function analyzeImage(imageBase64) {
  const response = await axios.post(
    "http://localhost:11434/api/generate",
    {
      model: "llava:7b",
      prompt: `
Describe ONLY:
- element positions
- relative sizes
- spacing between elements
- contrast levels
- text density

Do NOT describe themes, emotions, meaning, story, or identity.
Use neutral, technical language.
`,
      images: [imageBase64],
      stream: false,
      timeout: 60000,
      maxContentLength: 1000000
    },
    { timeout: 60000 }
  );

  return response.data.response;
}
