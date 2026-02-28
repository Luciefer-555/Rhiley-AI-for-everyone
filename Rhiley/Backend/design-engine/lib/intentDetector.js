/**
 * Intent detection for Rhiley
 * Categorizes user messages into specific intents using regex patterns.
 */

const GREETING_PATTERNS = [
    /^hey+\s*(rhiley)?[!.?]?$/i,
    /^hi+[!.?]?$/i,
    /^hello[!.?]?$/i,
    /^yo+[!.?]?$/i,
    /^what'?s\s*up[!.?]?$/i,
    /^sup[!.?]?$/i,
    /^hiya[!.?]?$/i,
    /^hey rhiley[!.?]?$/i,
];

const COMPLIMENT_PATTERNS = [
    /you'?re?\s*(so\s*)?(amazing|great|awesome|incredible|the best|bestie)/i,
    /good\s*(girl|job|work)/i,
    /love\s*you/i,
    /i\s*love\s*(this|it|you)/i,
    /perfect/i,
    /you'?re?\s*amazing/i,
    /great\s*job/i,
];

const FRUSTRATION_PATTERNS = [
    /this\s*(is\s*)?(broken|not\s*working|sucks)/i,
    /why\s*(isn'?t|won'?t)\s*this\s*work/i,
    /ugh|argh|damn|wtf/i,
];

function detectIntent(message) {
    const trimmed = (message || "").trim();

    if (GREETING_PATTERNS.some(p => p.test(trimmed)))
        return 'greeting';

    if (COMPLIMENT_PATTERNS.some(p => p.test(trimmed)))
        return 'compliment';

    if (FRUSTRATION_PATTERNS.some(p => p.test(trimmed)))
        return 'frustration';

    return 'task';
}

module.exports = { detectIntent };
