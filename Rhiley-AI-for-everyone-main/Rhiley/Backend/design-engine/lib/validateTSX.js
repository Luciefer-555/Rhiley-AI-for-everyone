const ts = require("typescript");

/**
 * Validates TSX code using structural checks and the TypeScript parser.
 * @param {string} code - The code to validate.
 * @returns {{ valid: boolean; error?: string }}
 */
function validateTSX(code) {
    const trimmedCode = code.trim();

    // 1. Basic structural checks
    if (!code.includes("export default function")) {
        return { valid: false, error: "Missing 'export default function'" };
    }

    if (code.includes("```")) {
        return { valid: false, error: "Contains markdown backticks - please return raw code only." };
    }

    // 1.1 Strict Directive Check
    // The error "Missing semicolon. (1:3)" happens when 'use client'; is missing quotes.
    if (trimmedCode.startsWith("use client;")) {
        return { valid: false, error: "The 'use client'; directive MUST have quotes. Example: 'use client';" };
    }

    // 2. Count tag balance (basic fallback)
    const openTags = (code.match(/<[A-Za-z]/g) || []).length;
    const closeTags = (code.match(/<\/|\/>/g) || []).length;
    if (Math.abs(openTags - closeTags) > 3) {
        return { valid: false, error: `Unbalanced JSX tags (found ${openTags} open vs ${closeTags} close/self-closing)` };
    }

    // 3. TypeScript Syntax & JSX Check
    try {
        const sourceFile = ts.createSourceFile(
            "test.tsx",
            code,
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TSX
        );

        const diagnostics = sourceFile.parseDiagnostics;

        if (diagnostics && diagnostics.length > 0) {
            const firstError = diagnostics[0];
            const message = ts.flattenDiagnosticMessageText(firstError.messageText, "\n");
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(firstError.start);
            return {
                valid: false,
                error: `Syntax Error at (${line + 1}:${character + 1}): ${message}`
            };
        }

        if (sourceFile.statements.length === 0) {
            return { valid: false, error: "Empty or invalid source file." };
        }

        return { valid: true };
    } catch (err) {
        return { valid: false, error: `TS Parser Error: ${err.message}` };
    }
}

module.exports = { validateTSX };
