"use client";

import React, { useEffect, useRef } from "react";

interface PreviewFrameProps {
    code: string;
}

export function PreviewFrame({ code }: PreviewFrameProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe || !code) return;

        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <script src="https://unpkg.com/framer-motion@11/dist/framer-motion.js"></script>
          <script src="https://unpkg.com/lucide@latest"></script>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { margin: 0; background: #000; color: #fff; font-family: 'Inter', sans-serif; overflow-x: hidden; }
            #root { min-height: 100vh; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script type="text/babel">
            window.Lucide = lucide;
            const { motion, AnimatePresence } = window.Motion;

            try {
              const cleanCode = \`${code.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`
                .replace(/'use client';/g, '')
                .replace(/import .*;?\\n/g, ''); 

              const transformed = Babel.transform(cleanCode, { 
                presets: ['react', 'typescript'],
                filename: 'Preview.tsx' 
              }).code;

              // Wrapper to capture the export
              const wrapper = \`
                (function() {
                  const exports = {};
                  const module = { exports };
                  \${transformed}
                  
                  const Component = exports.default || Object.values(exports).find(v => typeof v === 'function') || function() { 
                    return <div className="p-10 text-center text-zinc-500">No export found in code</div> 
                  };

                  const Root = document.getElementById('root');
                  const reactRoot = ReactDOM.createRoot(Root);
                  reactRoot.render(<React.StrictMode><Component /></React.StrictMode>);
                })();
              \`;

              eval(wrapper);
            } catch(e) {
              console.error("Render Error:", e);
              window.parent.postMessage({ type: 'PREVIEW_ERROR', error: e.message }, '*');
            }
          </script>
        </body>
      </html>
    `;

        iframe.srcdoc = html;
    }, [code]);

    return (
        <iframe
            ref={iframeRef}
            className="w-full h-full border-0 bg-black"
            sandbox="allow-scripts"
            title="Rhiley Preview Sandbox"
        />
    );
}
