function buildBlueprint(analysis) {
  const { layoutBlocks, dominantColors, height } = analysis;

  const sections = [];

  layoutBlocks.sort((a, b) => a.y - b.y);

  layoutBlocks.forEach((block, index) => {
    const areaRatio = (block.height * block.width) / (height * block.width);

    let sectionType, content;
    
    if (index === 0) {
      sectionType = "hero";
      content = {
        title: "Welcome",
        subtitle: "Hero Section"
      };
    } else if (block.width > 0.9 * analysis.width) {
      sectionType = "section";
      content = {
        title: `Section ${index}`,
        text: "Full width section content"
      };
    } else {
      sectionType = "contentBlock";
      content = {
        title: `Content ${index}`,
        text: "Content block text"
      };
    }

    sections.push({
      id: `section-${index}`,
      type: sectionType,
      style: {
        height: block.height,
        backgroundColor: sectionType === "hero" ? (dominantColors[2] || "#000000") : 
                      sectionType === "section" ? dominantColors[0] : dominantColors[1]
      },
      content: content
    });
  });

  return {
    version: "1.0",
    type: "page",
    layout: "vertical",
    theme: {
      primary: dominantColors[2],
      secondary: dominantColors[4],
      neutral: dominantColors[0]
    },
    sections
  };
}

module.exports = { buildBlueprint };
