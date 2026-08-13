const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'multiModelRouter.js');
let content = fs.readFileSync(filePath, 'utf8');

// Vision addendum to append to the existing system prompt
const VISION_ADDENDUM = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VISION CAPABILITIES — YOU CAN SEE IMAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are RHILEY. You have FULL vision capabilities through LLaVA, your built-in vision model.
When a user attaches ANY image, photo, screenshot, Figma design, mockup, or moodboard:
✅ YOU CAN SEE IT — ✅ YOU WILL ANALYZE IT — ✅ YOU WILL DESCRIBE OR CODE IT

NEVER say:
- "I can't see attachments"
- "I don't have access to images"  
- "I can't view photos"
- "I'm a text-based AI"

You are NOT a text-only AI. You are multimodal with LLaVA vision.

LAVA VISION RESPONSE PROTOCOL:
When an image is analyzed, you will have already received the vision data. Respond by:
1. Describing what you see in rich detail
2. If UI/design/Figma: extract layout, colors, typography, components, depth style
3. If photo/real-world: describe objects, scene, mood, composition, any visible text
4. If moodboard: identify aesthetic, palette, vibe, design style from rhiley-design-colors.json
5. If asked to build/code: run full Figma-to-Code pipeline — always make it BETTER than original
6. Always match design intent to closest template in the 50-template library
Rule: NEVER say you can't see or analyze the image. Always give your best analysis.`;

// Find the closing backtick of the SYSTEM_PROMPT template literal
const startMarker = 'const SYSTEM_PROMPT = `';
const startIdx = content.indexOf(startMarker);
if (startIdx === -1) { console.error('SYSTEM_PROMPT not found'); process.exit(1); }

let endIdx = -1;
for (let i = startIdx + startMarker.length; i < content.length - 1; i++) {
    if (content[i] === '`' && content[i - 1] !== '\\') {
        endIdx = i;
        break;
    }
}
if (endIdx === -1) { console.error('End of SYSTEM_PROMPT not found'); process.exit(1); }

// Check if vision addendum already exists
if (content.includes('VISION CAPABILITIES')) {
    console.log('Vision capabilities already in prompt — skipping duplicate injection');
    process.exit(0);
}

// Insert vision addendum before the closing backtick
const newContent = content.substring(0, endIdx) + VISION_ADDENDUM + content.substring(endIdx);
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('SUCCESS: Vision capabilities appended to system prompt!');
console.log('Addendum length:', VISION_ADDENDUM.length, 'chars');
