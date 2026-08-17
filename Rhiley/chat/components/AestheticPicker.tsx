"use client";

import React from 'react';
import { motion } from 'framer-motion';

const aestheticOptions = [
    { id: "cinematic", label: "🎬 Cinematic", desc: "Dark, dramatic, film-like" },
    { id: "glassmorphism", label: "🪟 Glass", desc: "Frosted, airy, light" },
    { id: "brutalist", label: "⚡ Brutalist", desc: "Bold, raw, loud" },
    { id: "neomorphism", label: "🫧 Neomorphism", desc: "Soft, extruded, tactile" },
    { id: "y2k", label: "💿 Y2K", desc: "Chrome, retro, chaotic" },
    { id: "minimal", label: "◻️ Minimal", desc: "Swiss, clean, type-first" },
    { id: "aurora", label: "🌌 Aurora", desc: "Gradient, flowing, vivid" },
];

export function AestheticPicker({
    selected,
    onChange
}: {
    selected: string;
    onChange: (id: string) => void
}) {
    return (
        <div className="flex flex-wrap gap-2 p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 mb-4">
            <div className="w-full text-[10px] uppercase tracking-[0.2em] font-bold text-white/30 mb-2 px-1">
                Aesthetic Preset
            </div>
            {aestheticOptions.map(opt => (
                <button
                    key={opt.id}
                    onClick={() => onChange(opt.id)}
                    className={`group flex flex-col items-start px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden
            ${selected === opt.id
                            ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/50 text-white shadow-lg shadow-purple-500/10"
                            : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10"
                        } border`}
                >
                    {selected === opt.id && (
                        <motion.div
                            layoutId="picker-glow"
                            className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none"
                        />
                    )}
                    <span className="relative z-10">{opt.label}</span>
                    <span className={`relative z-10 block text-[10px] opacity-40 mt-0.5 font-normal group-hover:opacity-70 transition-opacity`}>
                        {opt.desc}
                    </span>
                </button>
            ))}
        </div>
    );
}
