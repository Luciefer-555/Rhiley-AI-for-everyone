"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ScrapedPreviewCardProps {
  adaptedCode: string;
  originalCode?: string;
  pageTitle: string;
  profile: string;
  libraries: string[];
  url: string;
  screenshotBase64?: string | null;
  /** Called when user wants to use this code in the main editor/preview */
  onUseCode: (code: string) => void;
  /** Called when user wants to further refine with a prompt */
  onRefine: (refinementPrompt: string) => void;
}

export default function ScrapedPreviewCard({
  adaptedCode,
  originalCode,
  pageTitle,
  profile,
  libraries,
  url,
  screenshotBase64,
  onUseCode,
  onRefine,
}: ScrapedPreviewCardProps) {
  const [activeTab, setActiveTab] = useState<"adapted" | "original" | "screenshot">("adapted");
  const [refinement, setRefinement] = useState("");
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(adaptedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRefineSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!refinement.trim()) return;
    onRefine(refinement.trim());
    setRefinement("");
  }

  const tabs = [
    { id: "adapted", label: "✨ Adapted" },
    ...(originalCode ? [{ id: "original", label: "📄 Original" }] : []),
    ...(screenshotBase64 ? [{ id: "screenshot", label: "📸 Screenshot" }] : []),
  ] as const;

  const displayCode = activeTab === "original" ? (originalCode || "") : adaptedCode;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="w-full rounded-2xl border border-violet-500/25 bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-violet-900/10 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base">🌐</span>
            <span className="text-sm font-semibold text-zinc-100 truncate">
              {pageTitle || profile}
            </span>
            <span className="shrink-0 text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
              {profile}
            </span>
          </div>
          {libraries.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {libraries.map((lib) => (
                <span
                  key={lib}
                  className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded"
                >
                  {lib}
                </span>
              ))}
            </div>
          )}
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs text-zinc-500 hover:text-violet-400 transition-colors"
          title="Open source"
        >
          ↗ source
        </a>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 px-4 gap-1 pt-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-3 py-1.5 text-xs rounded-t-lg font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-zinc-800 text-zinc-100 border border-zinc-700 border-b-zinc-800"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {activeTab === "screenshot" && screenshotBase64 ? (
            <motion.div
              key="screenshot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${screenshotBase64}`}
                alt="Scraped page screenshot"
                className="w-full rounded-xl border border-zinc-800 object-cover max-h-64"
              />
            </motion.div>
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              <pre className="overflow-auto max-h-72 p-4 text-xs text-zinc-300 font-mono leading-relaxed scrollbar-thin scrollbar-thumb-zinc-700">
                <code>{displayCode}</code>
              </pre>

              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs rounded-lg transition-colors border border-zinc-700"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 px-4 py-3 border-t border-zinc-800 bg-zinc-900/50">
        <button
          onClick={() => onUseCode(adaptedCode)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-xl transition-colors font-medium"
        >
          <span>⚡</span>
          Use in Preview
        </button>
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-xl transition-colors border border-zinc-700"
        >
          {copied ? "✓" : "Copy"}
        </button>
      </div>

      {/* Refinement Input */}
      <div className="px-4 pb-4">
        <form onSubmit={handleRefineSubmit} className="flex gap-2">
          <input
            type="text"
            value={refinement}
            onChange={(e) => setRefinement(e.target.value)}
            placeholder="Refine it — e.g. make it dark mode, add a glow effect..."
            className="flex-1 bg-zinc-800 border border-zinc-700 focus:border-violet-500 text-zinc-100 placeholder-zinc-500 text-xs px-3 py-2 rounded-xl outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!refinement.trim()}
            className="px-3 py-2 bg-zinc-700 hover:bg-violet-600 disabled:opacity-40 text-zinc-300 hover:text-white text-xs rounded-xl transition-colors"
          >
            ✦ Refine
          </button>
        </form>
      </div>
    </motion.div>
  );
}
