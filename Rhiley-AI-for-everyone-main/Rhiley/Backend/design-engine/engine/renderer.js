const { renderNavbar, renderHero, renderTextSection, renderCardGrid, renderFooter } = require("./components");

function renderPage(blueprint) {
  if (!blueprint.sections || !Array.isArray(blueprint.sections)) {
    throw new Error("Invalid blueprint: sections array required");
  }

  const sections = blueprint.sections.map(section => {
    switch (section.type) {
      case "navbar":
        return renderNavbar(section);
      case "hero":
        return renderHero(section);
      case "textSection":
        return renderTextSection(section);
      case "cardGrid":
        return renderCardGrid(section);
      case "footer":
        return renderFooter(section);
      default:
        return "";
    }
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Design</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  ${sections}
</body>
</html>`;
}

module.exports = { renderPage };
