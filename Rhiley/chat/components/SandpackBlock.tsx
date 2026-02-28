"use client";

import {
    SandpackProvider, SandpackLayout,
    SandpackCodeEditor, SandpackPreview,
    SandpackConsole, useSandpack,
} from "@codesandbox/sandpack-react";
import { useState } from "react";
import { Eye, Code2, Terminal, Copy, Check } from "lucide-react";

// All Rhiley libraries pre-loaded
const DEPS = {
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.263.1",
    "react-hook-form": "^7.51.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4",
    "recharts": "^2.12.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "class-variance-authority": "^0.7.0",
    "date-fns": "^3.6.0",
    "zustand": "^4.5.2",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
};

// Clean Next.js-specific code for Sandpack
function cleanCode(raw: string): string {
    return raw
        .replace(/"use client";\n?/g, "")
        .replace(/'use client';\n?/g, "")
        .replace(/from ['"]next\/navigation['"]/g, "from '/shims/nav'")
        .replace(/from ['"]next\/image['"]/g, "from '/shims/img'")
        .replace(/from ['"]next\/link['"]/g, "from '/shims/link'");
}

const SHIMS = {
    "/shims/nav.ts": `export const useRouter=()=>({push:(u)=>console.log('push',u),replace:(u)=>console.log('replace',u),back:()=>{}});export const usePathname=()=>'/';export const useSearchParams=()=>new URLSearchParams();`,
    "/shims/img.tsx": `export default function Image({src,alt,...p}){return <img src={src} alt={alt} {...p}/>}`,
    "/shims/link.tsx": `export default function Link({href,children,...p}){return <a href={href} {...p}>{children}</a>}`,
};

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Manrope:wght@400;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Manrope',sans-serif;background:#09090B;color:#F4F4F8;-webkit-font-smoothing:antialiased;}
`;

// Dark theme matching Rhiley
const RHILEY_THEME = {
    colors: {
        surface1: "#09090B", surface2: "#111113", surface3: "#18181B",
        clickable: "#71717A", base: "#F4F4F8", disabled: "#52525B",
        error: "#f87171", errorSurface: "#1C0A0A",
    },
    syntax: {
        plain: "#F4F4F8", comment: { color: "#52525B", fontStyle: "italic" },
        keyword: "#A78BFA", tag: "#60A5FA", punctuation: "#71717A",
        definition: "#34D399", property: "#F472B6", static: "#FBBF24", string: "#86EFAC",
    },
    font: { body: "'Manrope',sans-serif", mono: "'JetBrains Mono',monospace", size: "13px", lineHeight: "1.6" },
};

type Tab = "preview" | "code" | "console";

interface SandpackBlockProps {
    code: string;
    language?: string;
}

export function SandpackBlock({ code, language = "tsx" }: SandpackBlockProps) {
    const [tab, setTab] = useState<Tab>("preview");
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getSandpackConfig = (language: string, code: string) => {
        const lang = (language || '').toLowerCase().trim();

        if (lang === 'tsx' || lang === 'react' || lang === 'typescript') {
            return { template: 'react-ts' as const, file: '/App.tsx' };
        }
        if (lang === 'jsx') {
            return { template: 'react' as const, file: '/App.jsx' };
        }
        if (lang === 'html' || lang === 'css') {
            return { template: 'static' as const, file: '/index.html' };
        }
        if (lang === 'javascript' || lang === 'js') {
            return { template: 'vanilla' as const, file: '/index.js' };
        }
        // Auto-detect React from code content
        if (code && (
            code.includes("from 'react'") ||
            code.includes('from "react"') ||
            code.includes('export default function') ||
            code.includes('useState') ||
            code.includes('<motion.') ||
            code.includes("'use client'")
        )) {
            return { template: 'react-ts' as const, file: '/App.tsx' };
        }
        // HTML doctype detected
        if (code && code.trim().startsWith('<!DOCTYPE')) {
            return { template: 'static' as const, file: '/index.html' };
        }
        // Default = react-ts
        return { template: 'react-ts' as const, file: '/App.tsx' };
    };

    const { template: templateName, file: entryFile } = getSandpackConfig(language, code);
    const isReact = templateName === 'react-ts' || templateName === 'react';

    const files: Record<string, any> = isReact ? {
        [entryFile]: { code: cleanCode(code), active: true },
        '/index.html': {
            hidden: true,
            code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    window.tailwind.config = {
      theme: { extend: { fontFamily: { greatdesk: ["'Greatdesk'", 'Georgia', 'serif'] } } }
    }
  </script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #0c0c0c; color: #f5f5f5; }
    @font-face {
      font-family: 'Greatdesk';
      src: url('/fonts/Greatdesk-Regular.otf') format('opentype');
    }
    .font-greatdesk { font-family: 'Greatdesk', Georgia, serif; }
  </style>
  <title>Rhiley</title>
</head>
<body><div id="root"></div></body>
</html>`
        },
        ...SHIMS
    } : {
        [entryFile]: { code, active: true }
    };

    const customSetup = isReact ? {
        dependencies: {
            'framer-motion': '11.0.8',
            'react': '^18.2.0',
            'react-dom': '^18.2.0',
            'lucide-react': '^0.263.1'
        },
        entry: entryFile
    } : {
        entry: entryFile
    };

    return (
        // ← Wrapper uses NO custom className — inherits parent chat bubble styling
        <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", marginTop: "12px" }}>

            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#111113", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", gap: "4px" }}>
                    {(["preview", "code", "console"] as Tab[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            style={{
                                padding: "4px 10px", borderRadius: "8px", border: "none",
                                fontSize: "11px", fontWeight: 600, cursor: "pointer",
                                background: tab === t ? "#8b5cf6" : "transparent",
                                color: tab === t ? "#fff" : "#71717A",
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>
                <button
                    onClick={handleCopy}
                    style={{ background: "transparent", border: "none", color: copied ? "#34d399" : "#71717A", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                >
                    {copied ? "✓ Copied" : "Copy"}
                </button>
            </div>

            {/* Sandpack */}
            <SandpackProvider
                template={templateName}
                files={files}
                customSetup={customSetup}
                options={{
                    externalResources: ["https://cdn.tailwindcss.com"],
                    recompileMode: "delayed",
                    recompileDelay: 600,
                    autorun: true,
                    initMode: "lazy",   // only loads when visible
                }}
                theme={RHILEY_THEME as any}
            >
                <SandpackLayout>
                    {tab === "preview" && <SandpackPreview style={{ height: "420px" }} showOpenInCodeSandbox={false} />}
                    {tab === "code" && <SandpackCodeEditor style={{ height: "420px" }} showLineNumbers showInlineErrors />}
                    {tab === "console" && <SandpackConsole style={{ height: "420px" }} />}
                </SandpackLayout>
            </SandpackProvider>
        </div>
    );
}
