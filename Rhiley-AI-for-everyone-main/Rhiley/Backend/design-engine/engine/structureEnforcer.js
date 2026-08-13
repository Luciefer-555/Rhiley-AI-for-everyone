import axios from "axios";

export async function enforceStructure(draft) {
  try {
    console.log("Structure Enforcer: Validating blueprint structure");
    
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "deepseek-coder:6.7b",
      prompt: `You are a strict JSON schema validator.
Do NOT add or remove sections.
Do NOT rename section types.
Fix formatting inconsistencies only.
Return ONLY valid JSON.

BLUEPRINT:
${JSON.stringify(draft, null, 2)}`,
      stream: false
    }, { timeout: 30000 });
    
    const text = response.data.response.trim();
    console.log("Structure Enforcer: Raw response:", text);
    
    let enforced;
    try {
      enforced = JSON.parse(text);
    } catch (parseError) {
      console.error("Structure Enforcer: JSON parse error, using draft");
      return draft;
    }
    
    if (enforced.type !== "page" || !Array.isArray(enforced.sections)) {
      console.error("Structure Enforcer: Invalid structure, using draft");
      return draft;
    }
    
    if (enforced.sections.length !== draft.sections.length) {
      console.error("Structure Enforcer: Section count changed, using draft");
      return draft;
    }
    
    for (let i = 0; i < enforced.sections.length; i++) {
      if (enforced.sections[i].type !== draft.sections[i].type) {
        console.error("Structure Enforcer: Section type changed, using draft");
        return draft;
      }
    }
    
    console.log("Structure Enforcer: Structure validated");
    return enforced;
    
  } catch (error) {
    console.error("Structure Enforcer: Error, using draft:", error.message);
    return draft;
  }
}
