import axios from "axios";
import models from "../config/models.js";
const { NIM_BASE_URL, NIM_API_KEY, LIGHT_MODEL } = models;
const NIM_TIMEOUT = process.env.NIM_TIMEOUT || 30000;
export async function refineText(blueprint) {
  try {
    console.log("Refiner: Improving text content");
    
    const response = await axios.post(`${NIM_BASE_URL}/chat/completions`, {
      model: LIGHT_MODEL,
      messages: [
        { role: "system", content: "You may improve wording only.\nDo NOT modify structure.\nDo NOT change section types.\nReturn only JSON." },
        { role: "user", content: `BLUEPRINT:\n${JSON.stringify(blueprint, null, 2)}` }
      ],
      stream: false,
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    }, { 
      timeout: NIM_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NIM_API_KEY}`
      }
    });
    
    let text = response.data?.choices?.[0]?.message?.content || "";
    // Strip markdown fences if present
    const fenceMatch = text.match(/```(?:json)?\n([\s\S]*?)```/i);
    if (fenceMatch) text = fenceMatch[1];
    text = text.trim();
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
