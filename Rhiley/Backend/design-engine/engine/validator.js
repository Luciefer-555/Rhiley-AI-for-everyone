function validateBlueprint(blueprint) {
  console.log("Validator: Starting blueprint validation");
  
  if (!blueprint) {
    console.error("Validator: No blueprint received");
    return { valid: false, error: "No blueprint received" };
  }

  if (typeof blueprint !== "object") {
    console.error("Validator: Blueprint must be an object");
    return { valid: false, error: "Blueprint must be an object" };
  }

  if (!blueprint.type) {
    console.error("Validator: Blueprint missing 'type' field");
    return { valid: false, error: "Blueprint missing 'type' field" };
  }

  if (blueprint.type !== "page") {
    console.error("Validator: Invalid blueprint type:", blueprint.type);
    return { valid: false, error: `Invalid blueprint type: ${blueprint.type}` };
  }

  if (!Array.isArray(blueprint.sections)) {
    console.error("Validator: Blueprint sections must be an array");
    return { valid: false, error: "Blueprint sections must be an array" };
  }

  const validSectionTypes = ["navbar", "hero", "textSection", "cardGrid", "footer"];
  
  for (const section of blueprint.sections) {
    if (!section.type || !validSectionTypes.includes(section.type)) {
      console.error("Validator: Invalid section type:", section.type);
      return { valid: false, error: `Invalid section type: ${section.type}` };
    }
  }

  console.log("Validator: Blueprint validation passed");
  return { valid: true };
}

module.exports = { validateBlueprint };
