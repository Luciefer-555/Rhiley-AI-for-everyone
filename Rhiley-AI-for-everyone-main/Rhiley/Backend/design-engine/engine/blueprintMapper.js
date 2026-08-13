const mapBlueprintToTemplate = (blueprint, template) => {
  if (!blueprint.sections || !template.slots) {
    throw new Error("Invalid blueprint or template structure");
  }

  const mappedSections = [];

  const usedSlots = new Set();

  blueprint.sections.forEach((section, index) => {
    let matchedSlot = null;

    for (let i = 0; i < template.slots.length; i++) {
      const slot = template.slots[i];

      if (
        !usedSlots.has(i) &&
        slot.allowedTypes &&
        slot.allowedTypes.includes(section.type)
      ) {
        matchedSlot = {
          slotName: slot.name,
          section
        };
        usedSlots.add(i);
        break;
      }
    }

    // fallback if no direct slot match
    if (!matchedSlot) {
      matchedSlot = {
        slotName: template.slots[0]?.name || "main",
        section
      };
    }

    mappedSections.push(matchedSlot);
  });

  return {
    templateId: template.id,
    layout: template.layout,
    depthStyle: template.stylingHints?.depthStyle || "flat",
    supports3d: template.stylingHints?.supports3d || false,
    mappedSections
  };
};

module.exports = {
  mapBlueprintToTemplate
};
