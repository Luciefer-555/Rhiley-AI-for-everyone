"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BrowserToolBarProps {
  /** Called when the user submits a scrape request */
  onScrape: (url: string, userRequest: string) => void;
  /** Whether a scrape is currently in progress */
  isLoading?: boolean;
  /** Initial URL to prefill (optional) */
  initialUrl?: string;
  /** Close the toolbar */
  onClose: () => void;
}

const QUICK_SITES = [
  { label: "React Bits", url: "react bits", emoji: "⚛️" },
  { label: "Skiper UI", url: "skiper ui", emoji: "⚡" },
  { label: "Aceternity", url: "aceternity ui", emoji: "✨" },
  { label: "Magic UI", url: "magic ui", emoji: "🪄" },
  { label: "Watermelon", url: "watermelon ui", emoji: "🍉" },
  { label: "Shadcn", url: "shadcn ui", emoji: "🔲" },
];

export default function BrowserToolBar({
  onScrape,
  isLoading = false,
  initialUrl = "",
  onClose,
}: BrowserToolBarProps) {
  const [url, setUrl] = useState(initialUrl);
  const [userRequest, setUserRequest] = useState("");
  const [step, setStep] = useState<"url" | "request">("url");

  useEffect(() => {
    if (initialUrl) setUrl(initialUrl);
  }, [initialUrl]);

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setStep("request");
  }

  function handleScrapeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    onScrape(url.trim(), userRequest.trim() || "adapt this component to be clean and reusable");
  }

  function selectQuickSite(siteUrl: string) {
    setUrl(siteUrl);
    setStep("request");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="w-full rounded-2xl border border-violet-500/30 bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-violet-900/20 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌐</span>
          <span className="text-sm font-semibold text-zinc-100">Browser Intelligence</span>
          <span className="text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
            Playwright
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
          aria-label="Close browser tool"
        >
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4">
        <AnimatePresence mode="wait">
          {step === "url" ? (
            <motion.div
              key="url-step"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-3"
            >
              <p className="text-xs text-zinc-400">
                Paste a URL or pick a site — I'll grab the component and adapt it for you.
              </p>

              {/* Quick Sites */}
              <div className="flex flex-wrap gap-2">
                {QUICK_SITES.map((site) => (
                  <button
                    key={site.label}
                    onClick={() => selectQuickSite(site.url)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-violet-500/20 hover:border-violet-500/50 border border-zinc-700 text-xs text-zinc-300 transition-all duration-150"
                  >
                    <span>{site.emoji}</span>
                    <span>{site.label}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleUrlSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://ui.aceternity.com/components/..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 focus:border-violet-500 text-zinc-100 placeholder-zinc-500 text-sm px-3 py-2 rounded-xl outline-none transition-colors"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!url.trim()}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-colors font-medium"
                >
                  Next →
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="request-step"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-3"
            >
              {/* Show selected URL */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep("url")}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  ← back
                </button>
                <span className="text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full truncate max-w-[200px]">
                  {url}
                </span>
              </div>

              <p className="text-xs text-zinc-400">
                How should I adapt this? (optional — leave blank for a clean default)
              </p>

              <form onSubmit={handleScrapeSubmit} className="space-y-2">
                <textarea
                  value={userRequest}
                  onChange={(e) => setUserRequest(e.target.value)}
                  placeholder="e.g. make it a login card with glassmorphism and my brand color #7c3aed..."
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-violet-500 text-zinc-100 placeholder-zinc-500 text-sm px-3 py-2 rounded-xl outline-none transition-colors resize-none"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isLoading || !url.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-colors font-medium"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Navigating & scraping...
                    </>
                  ) : (
                    <>
                      <span>🌐</span>
                      Grab & Adapt Component
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
