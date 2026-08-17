"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Plus, ArrowUp, Zap, Palette, Eye, PenLine, Code2 } from "lucide-react"

// ─── Display name formatter ──────────────────────────────────────────────────
function splitCamelCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, "$1 $2")
}

function formatDisplayName(rawName: string): string {
    if (!rawName) return "there"
    // Strip email domain
    if (rawName.includes("@")) rawName = rawName.split("@")[0]
    // Remove trailing numbers
    rawName = rawName.replace(/\d+$/, "")
    // Split camelCase
    rawName = splitCamelCase(rawName)
    // Split on dots, underscores, hyphens, spaces
    const parts = rawName.split(/[._\-\s]+/).filter(Boolean)
    const formatted = parts
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(" ")
        .trim()
    // Return first name only
    return formatted.split(" ")[0] || "there"
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface WelcomeScreenProps {
    userName?: string
    onFirstMessage: (message: string, mode?: 'build' | 'imagine') => void
}

// ─── Quick action pills ───────────────────────────────────────────────────────
const QUICK_ACTIONS = [
    { icon: <Code2 className="w-3.5 h-3.5" />, label: "</> Code", prompt: "Write me a ", mode: 'build' as const },
    { icon: <Palette className="w-3.5 h-3.5" />, label: "🎨 Imagine Design", prompt: "Design a ", mode: 'imagine' as const },
    { icon: <Eye className="w-3.5 h-3.5" />, label: "👁️ Analyze Image", prompt: "Analyze this image and ", mode: 'build' as const },
    { icon: <PenLine className="w-3.5 h-3.5" />, label: "✍️ Write Copy", prompt: "Write copy for a ", mode: 'build' as const },
    { icon: <Zap className="w-3.5 h-3.5" />, label: "⚡ Build UI", prompt: "Build a UI component for ", mode: 'build' as const },
]

// ─── Animation variants (from dataset rules) ──────────────────────────────────
const cardVariants = {
    hidden: { opacity: 0, scale: 0.92, filter: "blur(8px)" },
    visible: {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        transition: { type: "spring" as const, stiffness: 180, damping: 22, delay: 0.1 },
    },
    exit: {
        opacity: 0,
        scale: 0.97,
        filter: "blur(8px)",
        transition: { duration: 0.55, ease: [0.76, 0, 0.24, 1] as const },
    },
}

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09, delayChildren: 0.3 } },
    exit: { transition: { staggerChildren: 0.05 } },
}

const wordVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring" as const, stiffness: 200, damping: 24 },
    },
    exit: {
        opacity: 0,
        y: -16,
        filter: "blur(4px)",
        transition: { duration: 0.3, ease: "easeIn" as const },
    },
}

const inputCardVariants = {
    hidden: { opacity: 0, y: 16, filter: "blur(8px)" },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { type: "spring" as const, stiffness: 160, damping: 20, delay: 0.5 },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        filter: "blur(4px)",
        transition: { duration: 0.25, ease: "easeIn" as const },
    },
}

const pillsContainerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.7 } },
    exit: { transition: { staggerChildren: 0.04 } },
}

const pillVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring" as const, stiffness: 220, damping: 22 },
    },
    exit: {
        opacity: 0,
        y: 12,
        transition: { duration: 0.2, ease: "easeIn" as const },
    },
}

const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.4, ease: "easeOut" as const },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.4, ease: "easeIn" as const },
    },
}

// ─── Animated aurora blob ─────────────────────────────────────────────────────
function AuroraBlob({
    color,
    xPos,
    yPos,
    size,
    delay,
    reduced,
}: {
    color: string
    xPos: string
    yPos: string
    size: string
    delay: number
    reduced: boolean
}) {
    return (
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
                left: xPos,
                top: yPos,
                width: size,
                height: size,
                background: color,
                filter: "blur(80px)",
                willChange: "transform",
            }}
            animate={
                reduced
                    ? {}
                    : {
                        x: [0, 18, -12, 8, 0],
                        y: [0, -14, 10, -6, 0],
                        scale: [1, 1.08, 0.96, 1.04, 1],
                    }
            }
            transition={{
                duration: 14,
                delay,
                repeat: Infinity,
                ease: "easeInOut",
            }}
        />
    )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function WelcomeScreen({ userName, onFirstMessage }: WelcomeScreenProps) {
    const [input, setInput] = useState("")
    const [activeMode, setActiveMode] = useState<'build' | 'imagine'>('build')
    const [isSending, setIsSending] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const prefersReduced = useReducedMotion()

    // ✅ FIXED: mount gate — client-only flag, prevents SSR/client mismatch
    useEffect(() => { setIsMounted(true) }, [])

    // Auto-resize textarea
    useEffect(() => {
        const ta = textareaRef.current
        if (!ta) return
        ta.style.height = "auto"
        ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`
    }, [input])

    // Focus on mount
    useEffect(() => {
        if (isMounted) textareaRef.current?.focus()
    }, [isMounted])

    const handleSend = useCallback(() => {
        console.log("[WelcomeScreen] handleSend fired, input:", input, "mode:", activeMode);
        const trimmed = input.trim();
        if (!trimmed) return;

        setInput("");
        onFirstMessage(trimmed, activeMode);
    }, [input, activeMode, onFirstMessage]);

    const handlePillClick = useCallback(
        (prompt: string, mode: 'build' | 'imagine' = 'build') => {
            setInput(prompt)
            setActiveMode(mode)
            textareaRef.current?.focus()
        },
        [],
    )

    // ✅ FIXED: useMemo — static greeting without username
    const greeting = useMemo(() => "Let's build something.", [])
    const headlineWords = useMemo(() => greeting.split(" "), [greeting])

    // ✅ FIXED: Truly static SSR shell — ZERO dynamic content.
    // {greeting} was causing the mismatch: server had no userName → "Design...",
    // client had userName → "Hello,...". Shell must be identical on both sides.
    if (!isMounted) {
        return (
            <div style={{
                position: "fixed", inset: 0, zIndex: 50,
                background: "#09090B",
            }} />
        )
    }

    return (
        <>
            {/* Google Fonts */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Manrope:wght@300;400;500&display=swap');
        .welcome-headline { font-family: 'Syne', sans-serif; }
        .welcome-body { font-family: 'Manrope', sans-serif; }
        .grain-overlay {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 128px 128px;
        }
      `}</style>

            <motion.div
                key="welcome-page"
                variants={prefersReduced ? {} : pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-4 py-8"
            >
                {/* ── Cinematic Background Layers ─────────────────────────── */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-gray-900 via-black to-gray-950" />

                {/* Large Soft Glow Orb (Cinematic depth) */}
                <motion.div
                    className="absolute w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px] -z-10"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
                    style={{ top: "-10%", right: "-10%" }}
                />
                {/* ── Gradient card ─────────────────────────────────────────── */}
                <motion.div
                    variants={prefersReduced ? {} : cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="relative w-full overflow-hidden"
                    style={{
                        maxWidth: "min(90vw, 1100px)",
                        height: "clamp(420px, 80vh, 580px)",
                        borderRadius: 32,
                        border: "1px solid rgba(255,255,255,0.06)",
                        boxShadow: "0 0 120px rgba(139,92,246,0.08)",
                        background: "rgba(13, 17, 23, 0.4)",
                        backdropFilter: "blur(40px)",
                    }}
                >
                    {/* Aurora blobs */}
                    <AuroraBlob color="rgba(139,92,246,0.45)" xPos="-5%" yPos="-5%" size="55%" delay={0} reduced={!!prefersReduced} />
                    <AuroraBlob color="rgba(6,182,212,0.35)" xPos="70%" yPos="-10%" size="45%" delay={3} reduced={!!prefersReduced} />
                    <AuroraBlob color="rgba(236,72,153,0.30)" xPos="30%" yPos="70%" size="50%" delay={6} reduced={!!prefersReduced} />

                    {/* Grain texture overlay */}
                    <div className="grain-overlay absolute inset-0 pointer-events-none z-[1]" />

                    {/* Content grid — overflow:hidden stops right panel bleed */}
                    <div className="relative z-10 h-full flex flex-col md:flex-row overflow-hidden">

                        {/* ── Left: headline ───────────────────────────────────── */}
                        <motion.div
                            variants={prefersReduced ? {} : containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="flex-1 flex flex-col justify-center px-8 md:px-12 pt-10 md:pt-0"
                        >
                            {/* Label tag */}
                            <motion.span
                                variants={prefersReduced ? {} : wordVariants}
                                className="welcome-body mb-6 inline-block text-xs font-medium tracking-[0.2em] uppercase text-white/40"
                            >
                                ✦ RHILEY AI
                            </motion.span>

                            {/* Headline — staggered word reveal */}
                            <h1
                                className="welcome-headline text-white leading-[1.08] mb-6 overflow-hidden"
                                style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.75rem)", fontWeight: 800 }}
                            >
                                <span className="flex flex-wrap gap-x-[0.25em]">
                                    {headlineWords.map((word, i) => (
                                        <motion.span
                                            key={i}
                                            variants={prefersReduced ? {} : wordVariants}
                                            className="inline-block overflow-hidden drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                                        >
                                            {word}
                                        </motion.span>
                                    ))}
                                </span>
                            </h1>

                            {/* Sub-headline */}
                            <motion.p
                                variants={prefersReduced ? {} : wordVariants}
                                className="welcome-body text-white/55 leading-relaxed"
                                style={{ fontWeight: 300, fontSize: "clamp(0.95rem, 1.5vw, 1.1rem)" }}
                            >
                                Your AI that sees, thinks, and builds.
                            </motion.p>
                        </motion.div>

                        {/* ── Right: floating input card + pills ────────────────── */}
                        <motion.div
                            variants={prefersReduced ? {} : inputCardVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="flex-1 min-w-0 flex flex-col justify-center px-6 md:px-10 pb-10 md:pb-0 gap-3"
                        >
                            {/* Glass input box */}
                            <div
                                className="w-full flex flex-col gap-3 transition-all duration-300"
                                style={{
                                    background: "rgba(0,0,0,0.45)",
                                    backdropFilter: "blur(20px)",
                                    WebkitBackdropFilter: "blur(20px)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: 20,
                                    padding: 20,
                                    boxSizing: "border-box",
                                }}
                            >
                                {/* Textarea */}
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSend()
                                        }
                                    }}
                                    placeholder="Describe what you want to build..."
                                    rows={3}
                                    className="welcome-body w-full resize-none bg-transparent text-white/90 placeholder:text-white/30 text-sm leading-relaxed outline-none"
                                    style={{ fontWeight: 400, minHeight: 72 }}
                                />

                                {/* Bottom row */}
                                <div className="flex items-center justify-between">
                                    {/* Attach */}
                                    <button
                                        aria-label="Attach image"
                                        className="flex items-center justify-center w-8 h-8 rounded-full text-white/40 hover:text-white/70 hover:bg-white/10 transition-all duration-200"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>

                                    {/* Model badge */}
                                    <span
                                        className="welcome-body text-[10px] tracking-widest uppercase text-white/30 px-3 py-1 rounded-full border border-white/10"
                                        style={{ fontWeight: 500 }}
                                    >
                                        qwen3:8b
                                    </span>

                                    {/* Send button */}
                                    <motion.button
                                        onClick={handleSend}
                                        disabled={!input.trim() || isSending}
                                        whileHover={input.trim() ? { scale: 1.1, y: -1 } : {}}
                                        whileTap={input.trim() ? { scale: 0.9 } : {}}
                                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                        aria-label="Send message"
                                        className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200"
                                        style={{
                                            background: input.trim()
                                                ? "linear-gradient(135deg, #8B5CF6, #06B6D4)"
                                                : "rgba(255,255,255,0.08)",
                                            border: "1px solid rgba(255,255,255,0.2)",
                                            boxShadow: input.trim() ? "0 4px 20px rgba(139,92,246,0.3)" : "none",
                                            opacity: isSending ? 0.5 : 1,
                                            cursor: input.trim() && !isSending ? "pointer" : "not-allowed",
                                        }}
                                    >
                                        <ArrowUp className="w-4 h-4 text-white relative z-10" />

                                        {/* Cinematic Glow Ring */}
                                        {input.trim() && (
                                            <span className="absolute inset-0 rounded-full blur-lg bg-purple-500/50 -z-10 animate-pulse" />
                                        )}
                                    </motion.button>
                                </div>
                            </div>

                            {/* ── Pills INSIDE right column, below input ────────── */}
                            <motion.div
                                variants={prefersReduced ? {} : pillsContainerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="flex flex-wrap gap-2"
                            >
                                {QUICK_ACTIONS.map((action) => (
                                    <motion.button
                                        key={action.label}
                                        variants={prefersReduced ? {} : pillVariants}
                                        whileHover={{ scale: 1.05, backgroundColor: "rgba(139,92,246,0.18)", borderColor: "rgba(139,92,246,0.5)" }}
                                        whileTap={{ scale: 0.95 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                        onClick={() => handlePillClick(action.prompt, action.mode)}
                                        className="welcome-body flex items-center gap-1.5 px-4 py-2 rounded-full text-xs text-white/65 border border-white/15 transition-colors duration-200"
                                        style={{ fontWeight: 500, background: "rgba(255,255,255,0.04)", whiteSpace: "nowrap" }}
                                    >
                                        {action.icon}
                                        {action.label}
                                    </motion.button>
                                ))}
                            </motion.div>

                            {/* ── Hint INSIDE card ─────────────────────────────── */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1, transition: { delay: 1.2, duration: 0.6 } }}
                                exit={{ opacity: 0 }}
                                className="welcome-body text-white/20 text-[11px] text-center"
                                style={{ letterSpacing: "0.02em", marginTop: 2 }}
                            >
                                Press Enter to send · Shift+Enter for new line
                            </motion.p>
                        </motion.div>
                    </div>
                </motion.div>


            </motion.div>
        </>
    )
}
