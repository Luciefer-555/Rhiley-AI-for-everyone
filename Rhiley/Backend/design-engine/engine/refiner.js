import axios from "axios";

export async function refineText(blueprint) {
  try {
    console.log("Refiner: Improving text content");
    
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3:8b",
      prompt: `You may improve wording only.
Do NOT modify structure.
Do NOT change section types.
Return only JSON.

BLUEPRINT:
${JSON.stringify(blueprint, null, 2)}`,
      stream: false
    }, { timeout: 30000 });
    
    const text = response.data.response.trim();
    console.log("Refiner: Raw response:", text);
    
    let refined;
    try {
      refined = JSON.parse(text);
    } catch (parseError) {
      console.error("Refiner: JSON parse error, using original");
      return blueprint;
    }
    
    if (refined.type !== "page" || !Array.isArray(refined.sections)) {
      console.error("Refiner: Invalid structure, using original");
      return blueprint;
    }
    
    if (refined.sections.length !== blueprint.sections.length) {
      console.error("Refiner: Section count changed, using original");
      return blueprint;
    }
    
    for (let i = 0; i < refined.sections.length; i++) {
      if (refined.sections[i].type !== blueprint.sections[i].type) {
        console.error("Refiner: Section type changed, using original");
        return blueprint;
      }
    }
    
    console.log("Refiner: Text refined successfully");
    return refined;
    
  } catch (error) {
    console.error("Refiner: Error, using original:", error.message);
    return blueprint;
  }
}
