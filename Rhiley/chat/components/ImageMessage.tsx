"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface ImageMessageProps {
    imageData: string;      // base64
    mimeType: string;
    prompt: string;      // enhanced prompt used
    userPrompt: string;      // original user request
    onRegenerate?: () => void;
    onVariation?: (type: string) => void;
}

export function ImageMessage({
    imageData,
    mimeType,
    prompt,
    userPrompt,
    onRegenerate,
    onVariation,
}: ImageMessageProps) {
    const [showPrompt, setShowPrompt] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const imgSrc = `data:${mimeType};base64,${imageData}`;

    const handleDownload = () => {
        setDownloading(true);
        const link = document.createElement("a");
        link.href = imgSrc;
        link.download = `rhiley-${Date.now()}.png`;
        link.click();
        setTimeout(() => setDownloading(false), 1000);
    };

    const VARIATIONS = [
        { label: "🌑 Darker", value: "darker" },
        { label: "☀️ Lighter", value: "lighter" },
        { label: "🔍 More detail", value: "more_detailed" },
        { label: "🎭 Abstract", value: "abstract" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-3 max-w-lg"
        >
            {/* Image container */}
            <div
                className="relative group rounded-2xl overflow-hidden cursor-pointer
                   border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                onClick={() => setExpanded(!expanded)}
            >
                <img
                    src={imgSrc}
                    alt={userPrompt}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300
                        flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-xs bg-black/50 px-3 py-1.5 rounded-full">
                        Click to expand
                    </span>
                </div>

                {/* Rhiley badge */}
                <div className="absolute top-3 left-3">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-black/60 backdrop-blur-md
                           text-violet-300 border border-violet-500/30">
                        ✦ Rhiley
                    </span>
                </div>
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* Download */}
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl
                     bg-white/5 border border-white/10 text-zinc-300
                     hover:bg-white/10 hover:text-white transition-all"
                >
                    {downloading ? "✓ Saved!" : "⬇️ Download"}
                </button>

                {/* Regenerate */}
                {onRegenerate && (
                    <button
                        onClick={onRegenerate}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl
                       bg-white/5 border border-white/10 text-zinc-300
                       hover:bg-white/10 hover:text-white transition-all"
                    >
                        🔄 Regenerate
                    </button>
                )}

                {/* Show prompt */}
                <button
                    onClick={() => setShowPrompt(!showPrompt)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl
                     bg-white/5 border border-white/10 text-zinc-500
                     hover:text-zinc-300 transition-all"
                >
                    {showPrompt ? "Hide prompt" : "View prompt"}
                </button>
            </div>

            {/* Variations */}
            {onVariation && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-zinc-600">Variations:</span>
                    {VARIATIONS.map(v => (
                        <button
                            key={v.value}
                            onClick={() => onVariation(v.value)}
                            className="text-[10px] px-2.5 py-1 rounded-lg
                         bg-white/5 border border-white/10 text-zinc-400
                         hover:bg-violet-500/20 hover:text-violet-300
                         hover:border-violet-500/30 transition-all"
                        >
                            {v.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Prompt display */}
            {showPrompt && (
                <motion.div
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-[10px] text-zinc-500 bg-white/5 rounded-xl p-3
                     border border-white/5 leading-relaxed font-mono"
                >
                    <p className="text-zinc-400 font-sans text-[10px] mb-1">Enhanced prompt:</p>
                    {prompt}
                </motion.div>
            )}

            {/* Fullscreen modal */}
            {expanded && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-8"
                    onClick={() => setExpanded(false)}
                >
                    <img
                        src={imgSrc}
                        alt={userPrompt}
                        className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                    />
                    <button
                        className="absolute top-6 right-6 text-white text-2xl hover:text-zinc-300"
                        onClick={() => setExpanded(false)}
                    >
                        ✕
                    </button>
                </motion.div>
            )}
        </motion.div>
    );
}
