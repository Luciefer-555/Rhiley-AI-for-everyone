// ─────────────────────────────────────────────────────────────────────────────
// Rhiley UI Design System — single source of truth for tokens & motion presets
// Import via: import { designTokens, motionPresets } from "@/ui-lib/designSystem"
// ─────────────────────────────────────────────────────────────────────────────

// ─── Design Tokens ────────────────────────────────────────────────────────────

export const designTokens = {
    spacing: {
        /** Full-width section padding */
        section: "py-24 px-6 md:px-12",
        /** Centered, width-capped content wrapper */
        container: "max-w-6xl mx-auto",
    },

    radius: {
        xl: "rounded-xl",
        "2xl": "rounded-2xl",
    },

    shadows: {
        xl: "shadow-xl",
        "2xl": "shadow-2xl",
    },

    palettes: {
        /** Cinematic dark palette — deep neutral bg, white text, violet accent */
        cinematicDark: {
            background: "bg-neutral-950",
            textPrimary: "text-white",
            accent: "text-violet-400",
        },
    },
} as const

// ─── Motion Presets ───────────────────────────────────────────────────────────
// Use with Framer Motion. Reference presets by key — do NOT create inline variants.

export const motionPresets = {
    /**
     * Stagger children upward with a fade.
     * Usage:
     *   <motion.div {...motionPresets.staggerRise.container}>
     *     <motion.p variants={motionPresets.staggerRise.item}>…</motion.p>
     *   </motion.div>
     */
    staggerRise: {
        container: {
            initial: "hidden" as const,
            animate: "show" as const,
            variants: {
                hidden: {},
                show: {
                    transition: { staggerChildren: 0.1 },
                },
            },
        },
        item: {
            hidden: { opacity: 0, y: 40 },
            show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
        },
    },
} as const

// ─── Derived Types ────────────────────────────────────────────────────────────

export type DesignTokens = typeof designTokens
export type MotionPresets = typeof motionPresets
export type PaletteName = keyof DesignTokens["palettes"]
export type MotionPresetName = keyof MotionPresets
