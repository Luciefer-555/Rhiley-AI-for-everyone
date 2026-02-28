'use client';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Copy, Check, Palette } from 'lucide-react';

interface ColorEntry {
    label: string;  // "Primary" "Secondary" etc
    hex: string;  // "#CC2200"
    description: string; // "Ferrari rosso corsa"
}

interface DesignAnalysis {
    vibe: string;
    aesthetic: string;
    colors: ColorEntry[];
    typography: string;
    motion: string;
    layout: string;
}

interface Props {
    analysis: DesignAnalysis;
}

export function DesignAnalysisBlock({ analysis }: Props) {
    const [copiedHex, setCopiedHex] = useState<string | null>(null);

    function copyHex(hex: string) {
        navigator.clipboard.writeText(hex);
        setCopiedHex(hex);
        setTimeout(() => setCopiedHex(null), 1500);
    }

    return (
        // This outer div uses default app font
        // ONLY content inside uses Telegramo
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full rounded-2xl overflow-hidden
                 border border-[var(--border)]
                 bg-[var(--surface)]"
        >
            {/* Header bar — like a code block header */}
            <div className="flex items-center justify-between
                      px-4 py-2.5 
                      border-b border-[var(--border)]
                      bg-[var(--surface-hover)]">
                <div className="flex items-center gap-2">
                    <Palette size={13} className="text-[var(--accent)]" />
                    {/* Header label in DEFAULT font, not Telegramo */}
                    <span className="text-xs text-[var(--muted)] 
                           font-medium tracking-widest uppercase">
                        Design Analysis
                    </span>
                </div>
                {/* Aesthetic badge */}
                <span className="text-[10px] px-2 py-0.5 rounded-full
                         bg-[var(--accent)]/20 
                         text-[var(--accent)]">
                    {analysis?.aesthetic || "Analysis"}
                </span>
            </div>

            {/* ALL CONTENT BELOW USES TELEGRAMO B */}
            <div
                className="p-4 space-y-4"
                style={{ fontFamily: "'Telegramo', sans-serif" }}
            >

                {/* Vibe */}
                <div>
                    <p className="text-[10px] text-[var(--muted)] 
                        tracking-widest uppercase mb-1"
                        style={{
                            fontFamily: "'Telegramo', sans-serif",
                            fontWeight: 500
                        }}>
                        vibe
                    </p>
                    <p className="text-sm text-[var(--foreground)] 
                        leading-relaxed italic"
                        style={{
                            fontFamily: "'Telegramo', sans-serif",
                            fontWeight: 400
                        }}>
                        {analysis?.vibe || "No vibe detected"}
                    </p>
                </div>

                {/* Color story */}
                <div>
                    <p className="text-[10px] text-[var(--muted)] 
                        tracking-widest uppercase mb-2"
                        style={{
                            fontFamily: "'Telegramo', sans-serif",
                            fontWeight: 500
                        }}>
                        color story
                    </p>
                    <div className="space-y-2">
                        {(analysis?.colors || []).map((color, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="flex items-center gap-3 group"
                            >
                                {/* Color swatch */}
                                <div
                                    className="w-8 h-8 rounded-lg shrink-0
                             border border-white/10 
                             cursor-pointer
                             hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color.hex }}
                                    onClick={() => copyHex(color.hex)}
                                    title="click to copy"
                                />

                                {/* Hex + label */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        {/* HEX CODE — Telegramo Bold */}
                                        <button
                                            onClick={() => copyHex(color.hex)}
                                            className="text-sm font-bold 
                                 text-[var(--foreground)]
                                 hover:text-[var(--accent)]
                                 transition-colors 
                                 font-mono tracking-wider"
                                            style={{
                                                fontFamily: "'Telegramo', sans-serif",
                                                fontWeight: 700,
                                                letterSpacing: '0.08em'
                                            }}
                                        >
                                            {color.hex.toUpperCase()}
                                        </button>

                                        {/* Copy indicator */}
                                        {copiedHex === color.hex ? (
                                            <Check size={11}
                                                className="text-green-400" />
                                        ) : (
                                            <Copy size={11}
                                                className="text-[var(--muted)] 
                                   opacity-0 group-hover:opacity-100
                                   transition-opacity" />
                                        )}

                                        {/* Label */}
                                        <span className="text-[10px] 
                                     text-[var(--muted)]
                                     tracking-widest uppercase"
                                            style={{
                                                fontFamily: "'Telegramo', sans-serif",
                                                fontWeight: 500
                                            }}>
                                            {color.label}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p className="text-xs text-[var(--muted)] 
                                mt-0.5 truncate"
                                        style={{
                                            fontFamily: "'Telegramo', sans-serif",
                                            fontWeight: 400
                                        }}>
                                        {color.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[var(--border)]" />

                {/* Typography + Motion + Layout */}
                {[
                    { label: 'typography', value: analysis.typography },
                    { label: 'motion', value: analysis.motion },
                    { label: 'layout', value: analysis.layout },
                ].map(item => (
                    <div key={item.label}
                        className="flex gap-3 items-baseline">
                        <span className="text-[10px] text-[var(--muted)]
                             tracking-widest uppercase 
                             shrink-0 w-20"
                            style={{
                                fontFamily: "'Telegramo', sans-serif",
                                fontWeight: 500
                            }}>
                            {item.label}
                        </span>
                        <span className="text-sm 
                             text-[var(--foreground)]"
                            style={{
                                fontFamily: "'Telegramo', sans-serif",
                                fontWeight: 400
                            }}>
                            {item.value}
                        </span>
                    </div>
                ))}

            </div>
        </motion.div>
    );
}
