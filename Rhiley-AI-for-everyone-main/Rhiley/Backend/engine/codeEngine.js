export function generateCode(blueprint, userPrompt) {
  // Validate blueprint schema
  if (!validateBlueprint(blueprint)) {
    throw new Error("Invalid blueprint schema");
  }

  const canvas = blueprint.canvas;
  const elements = blueprint.elements || [];
  
  return {
    files: {
      "App.jsx": generateAppComponent(canvas, elements, userPrompt),
      "styles.css": generateStyles(canvas, elements),
      "index.html": generateHTML(canvas, elements)
    }
  };
}

function validateBlueprint(blueprint) {
  const required = ['schema_version', 'canvas', 'elements'];
  
  for (const field of required) {
    if (!blueprint[field]) {
      return false;
    }
  }
  
  return true;
}

function generateAppComponent(canvas, elements, userPrompt) {
  const backgroundStyle = canvas.background_color ? `background-color: ${canvas.background_color}` : 'background-color: #ffffff';
  
  return `import React from 'react';
import './styles.css';

function App() {
  return (
    <div className="app-container" style={${backgroundStyle}}>
      ${elements.map(element => generateElement(element)).join('\n      ')}
    </div>
  );
}

export default App;`;
}

function generateElement(element) {
  const styles = element.styles || {};
  const colorStyle = styles.color ? `color: ${styles.color}` : '';
  const fontSizeStyle = styles.font_size ? `font-size: ${styles.font_size}px` : '';
  const fontWeightStyle = styles.font_weight ? `font-weight: ${styles.font_weight}` : '';
  const bgColorStyle = styles.background_color ? `background-color: ${styles.background_color}` : '';
  
  const combinedStyles = [colorStyle, fontSizeStyle, fontWeightStyle, bgColorStyle].filter(Boolean).join('; ');
  
  switch (element.type) {
    case 'text':
      return `<div style="position: absolute; left: ${element.position.x}px; top: ${element.position.y}px; width: ${element.width}px; height: ${element.height}px; ${combinedStyles}">
        ${element.content || ''}
      </div>`;
    
    case 'container':
      return `<div style="position: absolute; left: ${element.position.x}px; top: ${element.position.y}px; width: ${element.width}px; height: ${element.height}px; ${combinedStyles}">
        ${elements.filter(child => child.id && child.id !== element.id).map(child => generateElement(child)).join('\n        ')}
      </div>`;
    
    case 'button':
      return `<button style="position: absolute; left: ${element.position.x}px; top: ${element.position.y}px; width: ${element.width}px; height: ${element.height}px; ${combinedStyles}">
        ${element.content || 'Button'}
      </button>`;
    
    case 'image':
      return `<img style="position: absolute; left: ${element.position.x}px; top: ${element.position.y}px; width: ${element.width}px; height: ${element.height}px;" src="${element.content || ''}" alt="${element.id}" />`;
    
    default:
      return `<div style="position: absolute; left: ${element.position.x}px; top: ${element.position.y}px; width: ${element.width}px; height: ${element.height}px; ${combinedStyles}">
        ${element.content || ''}
      </div>`;
  }
}

function generateStyles(canvas, elements) {
  return `
.app-container {
  position: relative;
  width: ${canvas.width}px;
  height: ${canvas.height}px;
  background-color: ${canvas.background_color};
  font-family: sans-serif;
}

${elements.map(element => {
  const styles = element.styles || {};
  return `
#${element.id} {
  position: absolute;
  left: ${element.position.x}px;
  top: ${element.position.y}px;
  width: ${element.width}px;
  height: ${element.height}px;
  ${styles.color ? `color: ${styles.color};` : ''}
  ${styles.font_size ? `font-size: ${styles.font_size}px;` : ''}
  ${styles.font_weight ? `font-weight: ${styles.font_weight};` : ''}
  ${styles.background_color ? `background-color: ${styles.background_color};` : ''}
}
`;
}).join('\n')}
`;
}

function generateHTML(canvas, elements) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Design</title>
    <style>
        body { margin: 0; padding: 0; font-family: sans-serif; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script src="App.jsx" type="module"></script>
</body>
</html>`;
}
