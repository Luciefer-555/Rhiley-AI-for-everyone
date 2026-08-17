export function buildDraftBlueprint(blocks) {
  try {
    console.log("Classifier: Building draft blueprint from", blocks.length, "blocks");
    
    const sortedBlocks = [...blocks].sort((a, b) => a.y - b.y);
    const sections = [];
    let hasHero = false;
    
    for (let i = 0; i < sortedBlocks.length; i++) {
      const block = sortedBlocks[i];
      let section = null;
      
      if (block.y < 150 && block.height < 200) {
        section = {
          type: "navbar",
          logo: "Brand",
          links: ["Home", "About", "Contact"]
        };
      } else if (!hasHero && block.height > 400) {
        section = {
          type: "hero",
          title: block.text || "Welcome",
          subtitle: "Description here",
          buttonText: "Get Started"
        };
        hasHero = true;
      } else if (i === sortedBlocks.length - 1 && block.y > 500) {
        section = {
          type: "footer",
          text: "© 2026 Brand"
        };
      } else {
        section = {
          type: "textSection",
          title: block.text || "Section Title",
          content: "Section content here"
        };
      }
      
      sections.push(section);
    }
    
    const draftBlueprint = {
      type: "page",
      layout: "vertical",
      sections: sections
    };
    
    console.log("Classifier: Draft blueprint created");
    return draftBlueprint;
    
  } catch (error) {
    console.error("Classifier: Error:", error.message);
    throw error;
  }
}
