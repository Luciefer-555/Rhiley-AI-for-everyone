"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ImageLoadingBubbleProps {
    prompt: string;
    status?: string;
    initialCountdown?: number;
}

export function ImageLoadingBubble({ prompt, status, initialCountdown = 45 }: ImageLoadingBubbleProps) {
    const [timeLeft, setTimeLeft] = useState(initialCountdown);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex flex-col gap-3 max-w-sm"
        >
            {/* Premium Loading Card */}
            <div className="relative w-full h-56 rounded-[24px] overflow-hidden
                      bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">

                {/* Rotating Outer Glow */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-[50%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_150deg,#8b5cf6_180deg,transparent_210deg,transparent_360deg)] opacity-40"
                />

                <div className="absolute inset-[1px] bg-zinc-950 rounded-[23px] overflow-hidden">
                    {/* Animated Shimmer Overlay */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r
                         from-transparent via-white/5 to-transparent shadow-[0_0_40px_rgba(255,255,255,0.05)]"
                        animate={{ x: ["-200%", "200%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Aurora Background Blobs */}
                    <div className="absolute top-0 left-0 w-full h-full">
                        <motion.div
                            animate={{
                                x: [0, 40, 0],
                                y: [0, -40, 0],
                                scale: [1, 1.2, 1]
                            }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-violet-600/20 blur-[80px]"
                        />
                        <motion.div
                            animate={{
                                x: [0, -50, 0],
                                y: [0, 30, 0],
                                scale: [1, 1.3, 1]
                            }}
                            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-cyan-500/15 blur-[100px]"
                        />
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <div className="relative mb-4">
                            <motion.div
                                animate={{
                                    rotate: 360,
                                    boxShadow: ["0 0 0px rgba(139, 92, 246, 0)", "0 0 20px rgba(139, 92, 246, 0.4)", "0 0 0px rgba(139, 92, 246, 0)"]
                                }}
                                transition={{
                                    rotate: { duration: 15, repeat: Infinity, ease: "linear" },
                                    boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                                }}
                                className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md"
                            >
                                <span className="text-3xl">🎨</span>
                            </motion.div>
                            <motion.div
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 rounded-2xl border border-violet-500/50"
                            />
                        </div>

                        <h3 className="text-lg font-semibold text-white tracking-tight mb-1">
                            {status ?? "Rhiley is painting..."}
                        </h3>

                        <div className="flex flex-col items-center w-full max-w-[180px]">
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-2">
                                <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: initialCountdown, ease: "linear" }}
                                    className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 shadow-[0_0_10px_#8b5cf6]"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                                    Estimated time:
                                </span>
                                <span className="text-[12px] tabular-nums text-violet-400 font-mono font-bold">
                                    {timeLeft > 0 ? `${timeLeft}s` : "Finalizing..."}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Styled Prompt Footer */}
            <div className="px-2">
                <p className="text-[11px] text-zinc-500 leading-relaxed italic line-clamp-2">
                    "{prompt}"
                </p>
            </div>
        </motion.div>
    );
}
