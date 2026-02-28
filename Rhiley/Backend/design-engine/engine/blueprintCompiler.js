function normalizeBlueprint(rawBlueprint, imageHeight) {
  if (!rawBlueprint || rawBlueprint.type !== "page") {
    throw new Error("Invalid raw blueprint");
  }

  if (!imageHeight || imageHeight <= 0) {
    throw new Error("Invalid imageHeight");
  }

  const theme = {
    primary: rawBlueprint.theme?.primary || "#000000",
    secondary: rawBlueprint.theme?.secondary || "#666666",
    neutral: rawBlueprint.theme?.neutral || "#ffffff",
    dark: rawBlueprint.theme?.dark || "#111111"
  };

  if (!Array.isArray(rawBlueprint.sections)) {
    throw new Error("Sections must be an array");
  }

  const strictSections = rawBlueprint.sections.map((section, index) => {
    const rawHeight = section.height || 200;

    let heightRatio = rawHeight / imageHeight;
    heightRatio = Math.max(0.05, Math.min(1, heightRatio));
    heightRatio = parseFloat(heightRatio.toFixed(2));

    return {
      id: `section-${index + 1}`,
      order: index + 1,
      type: section.type || "section",
      style: {
        heightRatio: heightRatio,
        backgroundColor:
          section.backgroundColor ||
          theme.neutral,
        padding: "medium"
      },
      content: {
        headline:
          section.content?.headline ||
          section.content?.title ||
          "",
        subheadline:
          section.content?.subheadline ||
          section.content?.subtitle ||
          "",
        body:
          section.content?.body ||
          section.content?.text ||
          "",
        cta:
          section.content?.cta ||
          ""
      }
    };
  });

  return {
    version: "1.0",
    type: "page",
    layout: rawBlueprint.layout || "vertical",
    theme,
    sections: strictSections
  };
}

function validateStrictBlueprint(bp) {
  if (!bp.version) throw new Error("Missing version");
  if (!bp.theme?.primary) throw new Error("Missing theme.primary");
  if (!Array.isArray(bp.sections)) throw new Error("Invalid sections");

  bp.sections.forEach((s) => {
    if (!s.id) throw new Error("Section missing id");
    if (!s.order) throw new Error("Section missing order");
    if (!s.type) throw new Error("Section missing type");
    if (!s.style?.heightRatio) throw new Error("Missing heightRatio");
    if (!s.style?.backgroundColor) throw new Error("Missing backgroundColor");
    if (!s.content) throw new Error("Missing content object");
  });
}

module.exports = {
  normalizeBlueprint,
  validateStrictBlueprint
};
