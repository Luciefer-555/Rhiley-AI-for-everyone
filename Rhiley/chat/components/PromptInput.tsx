"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface PromptInputProps {
    onSubmit: (finalPrompt: string) => void;
    selectedAesthetic: string;
}

export function PromptInput({ onSubmit, selectedAesthetic }: PromptInputProps) {
    const [raw, setRaw] = useState("");
    const [enhanced, setEnhanced] = useState("");
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [showEnhanced, setShowEnhanced] = useState(false);
    const [useEnhanced, setUseEnhanced] = useState(true);

    async function handleEnhance() {
        if (!raw.trim()) return;
        setIsEnhancing(true);

        try {
            const res = await fetch("/api/enhance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: `User request: "${raw}"\nAesthetic: ${selectedAesthetic}`,
                }),
            });
            const data = await res.json();
            setEnhanced(data.enhanced);
            setShowEnhanced(true);
        } catch (error) {
            console.error("Enhancement failed:", error);
        } finally {
            setIsEnhancing(false);
        }
    }

    function handleSubmit() {
        const finalPrompt = useEnhanced && enhanced ? enhanced : raw;
        onSubmit(finalPrompt);
    }

    return (
        <div className="w-full space-y-3">

            {/* Raw input */}
            <div className="relative">
                <textarea
                    value={raw}
                    onChange={(e) => setRaw(e.target.value)}
                    placeholder="Describe your landing page... (e.g. 'fitness app hero section')"
                    rows={3}
                    className="w-full px-4 py-3 pr-24 rounded-xl bg-zinc-100 dark:bg-white/5 
                     border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-100
                     placeholder:text-zinc-400 dark:placeholder:text-white/30 resize-none
                     focus:outline-none focus:border-purple-500/50
                     transition-colors text-sm"
                />

                {/* Enhance button */}
                <button
                    onClick={handleEnhance}
                    disabled={isEnhancing || !raw.trim()}
                    className="absolute bottom-3 right-3 flex items-center gap-1.5 
                     px-3 py-1.5 rounded-lg bg-purple-500/10 
                     text-purple-400 text-xs font-medium
                     hover:bg-purple-500/20 disabled:opacity-40
                     transition-all"
                >
                    {isEnhancing ? (
                        <div className="w-3 h-3 rounded-full border border-purple-500 
                            border-t-transparent animate-spin" />
                    ) : (
                        <Sparkles size={12} />
                    )}
                    {isEnhancing ? "Enhancing..." : "Enhance"}
                </button>
            </div>

            {/* Enhanced prompt preview */}
            <AnimatePresence>
                {showEnhanced && enhanced && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="rounded-xl border border-purple-500/30 
                       bg-purple-500/5 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-2 
                            border-b border-purple-500/20">
                            <div className="flex items-center gap-2">
                                <Sparkles size={12} className="text-purple-400" />
                                <span className="text-xs text-purple-400 font-medium">
                                    Enhanced Prompt
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Toggle use enhanced */}
                                <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setUseEnhanced(!useEnhanced)}>
                                    <div
                                        className={`w-7 h-4 rounded-full transition-colors relative
                      ${useEnhanced ? "bg-purple-500" : "bg-zinc-200 dark:bg-white/10"}`}
                                    >
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white 
                                    transition-transform
                                    ${useEnhanced ? "translate-x-3.5" : "translate-x-0.5"}`}
                                        />
                                    </div>
                                    <span className="text-xs text-zinc-500 dark:text-white/40">Use this</span>
                                </div>
                                {/* Collapse */}
                                <button
                                    onClick={() => setShowEnhanced(!showEnhanced)}
                                    className="text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white"
                                >
                                    {showEnhanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-4 py-3 max-h-32 overflow-y-auto">
                            <p className="text-xs text-zinc-600 dark:text-white/50 leading-relaxed italic">
                                "{enhanced}"
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Submit button provided by parent often, but adding a local one as per user request */}
            <button
                onClick={handleSubmit}
                disabled={!raw.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white 
                   font-medium text-sm hover:opacity-90 disabled:opacity-40
                   transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-purple-500/20"
            >
                Generate Now →
            </button>
        </div>
    );
}
