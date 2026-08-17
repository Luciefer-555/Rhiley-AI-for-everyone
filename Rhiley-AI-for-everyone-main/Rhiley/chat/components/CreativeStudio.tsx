"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Sparkles, Download, RefreshCcw, ArrowRight,
    Layout, Palette, Image as ImageIcon, Code,
    Layers, Terminal, AlertCircle, Loader2, X
} from "lucide-react"
import { AestheticPicker } from "./AestheticPicker"

interface CreativeStudioProps {
    selectedAesthetic: string
    onAestheticChange: (aesthetic: string) => void
    onBuildThis: (prompt: string) => void
    onClose?: () => void
    initialPrompt?: string
}

const MODES = [
    { id: "web", label: "Web", icon: Layout, placeholder: "Describe a modern landing page theme..." },
    { id: "poster", label: "Poster", icon: Palette, placeholder: "Describe a graphic poster design..." },
    { id: "wireframe", label: "Wireframe", icon: Terminal, placeholder: "Describe a UI wireframe sketch..." },
    { id: "figma", label: "Figma", icon: Layers, placeholder: "Describe a professional UI kit..." },
    { id: "mood", label: "Mood", icon: ImageIcon, placeholder: "Describe a visual moodboard..." },
]

export default function CreativeStudio({
    selectedAesthetic,
    onAestheticChange,
    onBuildThis,
    onClose,
    initialPrompt = ""
}: CreativeStudioProps) {
    const [prompt, setPrompt] = useState(initialPrompt)
    const [activeMode, setActiveMode] = useState("web")
    const [isGenerating, setIsGenerating] = useState(false)
    const [result, setResult] = useState<{ image: string; enrichedPrompt: string } | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleGenerate = async () => {
        if (!prompt.trim() || isGenerating) return

        setIsGenerating(true)
        setError(null)

        try {
            const res = await fetch("/api/imagine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    mode: activeMode,
                    aesthetic: selectedAesthetic
                })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || "Generation failed")

            setResult({
                image: data.image,
                enrichedPrompt: data.prompt
            })
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsGenerating(false)
        }
    }

    // Auto-generate if launched with an initial prompt
    React.useEffect(() => {
        if (initialPrompt && initialPrompt.trim()) {
            handleGenerate();
        }
    }, []); // Only run once on mount

    const handleDownload = () => {
        if (!result) return
        const link = document.createElement("a")
        link.href = `data:image/png;base64,${result.image}`
        link.download = `rhiley-design-${Date.now()}.png`
        link.click()
    }

    const handleBuild = () => {
        const buildPrompt = `Build this as a React landing page: "${prompt}", ${selectedAesthetic} aesthetic, Framer Motion animations, under 150 lines.`
        onBuildThis(buildPrompt)
    }

    return (
        <div className="h-full w-full flex flex-col bg-zinc-50 dark:bg-black overflow-hidden relative border-t border-zinc-200 dark:border-zinc-800 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
            {/* Close Button Overlay */}
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-[110] p-2 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white transition-all ring-1 ring-black/5 dark:ring-white/10 shadow-lg"
                >
                    <X size={20} />
                </button>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-5xl mx-auto px-6 py-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-12"
                    >
                        {/* Title Section */}
                        <div className="space-y-2">
                            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                                Creative Studio
                            </h1>
                            <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-2xl">
                                Transform your ideas into high-fidelity visual concepts using local image generation models.
                            </p>
                        </div>

                        {/* Step 1: Mode Selection */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 block">
                                1. Select Experience Mode
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {MODES.map((mode) => (
                                    <button
                                        key={mode.id}
                                        onClick={() => setActiveMode(mode.id)}
                                        className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 border ${activeMode === mode.id
                                            ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] scale-105"
                                            : "bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
                                            }`}
                                    >
                                        <mode.icon size={16} strokeWidth={2.5} />
                                        {mode.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step 2: Aesthetic Selection */}
                        <div className="space-y-0 relative">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 block mb-4">
                                2. Define Visual Aesthetic
                            </label>
                            <AestheticPicker
                                selected={selectedAesthetic}
                                onChange={onAestheticChange}
                            />
                        </div>

                        {/* Step 3: Prompt & Action */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 block">
                                3. Describe Your Vision
                            </label>
                            <div className="relative group">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder={MODES.find(m => m.id === activeMode)?.placeholder}
                                    className="w-full h-36 px-6 py-5 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] text-sm outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 transition-all resize-none shadow-sm group-hover:shadow-md dark:shadow-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                                />
                                <div className="absolute bottom-4 right-4 flex items-center gap-3">
                                    {prompt && (
                                        <button
                                            onClick={() => setPrompt("")}
                                            className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                                        >
                                            Reset
                                        </button>
                                    )}
                                    <button
                                        disabled={!prompt.trim() || isGenerating}
                                        onClick={handleGenerate}
                                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-purple-500/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={16} fill="white" />
                                                Imagine It
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Results Section */}
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-6 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center gap-4 text-red-500 dark:text-red-400 text-sm shadow-inner"
                                >
                                    <div className="p-2 bg-red-500/10 rounded-full">
                                        <AlertCircle size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold">Generation Blocked</p>
                                        <p className="opacity-80">{error}</p>
                                    </div>
                                </motion.div>
                            )}

                            {result && (
                                <motion.div
                                    initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                    className="space-y-8"
                                >
                                    <div className="relative aspect-video w-full bg-zinc-200 dark:bg-zinc-800 rounded-[3rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.2)] dark:shadow-none group border border-zinc-200 dark:border-zinc-800 ring-1 ring-black/5 dark:ring-white/5">
                                        <img
                                            src={`data:image/png;base64,${result.image}`}
                                            alt="Generated"
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />

                                        {/* Image Overlay Actions */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6">
                                            <button
                                                onClick={handleDownload}
                                                className="p-5 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 transition-all border border-white/20 scale-90 group-hover:scale-100 duration-500 delay-75"
                                                title="Download"
                                            >
                                                <Download size={28} />
                                            </button>
                                            <button
                                                onClick={handleGenerate}
                                                className="p-5 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 transition-all border border-white/20 scale-90 group-hover:scale-100 duration-500"
                                                title="Regenerate"
                                            >
                                                <RefreshCcw size={28} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Actions Bar */}
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] shadow-2xl dark:shadow-none relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-12 -mr-12 -mt-12 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors" />

                                        <div className="space-y-2 relative z-10">
                                            <div className="flex items-center gap-2 text-[10px] font-extrabold text-purple-500 dark:text-purple-400 uppercase tracking-[0.3em]">
                                                <Code size={14} className="animate-pulse" />
                                                Next Phase: Architecture
                                            </div>
                                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                                                Ready to instantiate?
                                            </h3>
                                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                                Instruct Rhiley to build this design into a full-scale React application.
                                            </p>
                                        </div>

                                        <button
                                            onClick={handleBuild}
                                            className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[1.5rem] font-black uppercase text-xs tracking-tighter hover:scale-[1.05] active:scale-[0.95] transition-all shadow-xl shadow-zinc-500/10 hover:shadow-purple-500/20"
                                        >
                                            Build This Now
                                            <ArrowRight size={20} strokeWidth={3} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
