"use client";

/**
 * Aesthetic Presets Library
 * Defines the visual and motion rules for each style.
 */
export const AESTHETICS = {
    cinematic: {
        label: "Cinematic Dark",
        rules: `
      - Deep black backgrounds (#0a0a0f)
      - Single dominant light source
      - Subtle vignette edges
      - Slow dramatic motion (0.9s ease)
      - Film grain texture overlay
      - Muted color palette with ONE accent (e.g. purple or blue)
      - Large typography drop shadows
    `
    },
    glassmorphism: {
        label: "Glass & Light",
        rules: `
      - Frosted glass cards (backdrop-blur-xl bg-white/10)
      - Light, airy backgrounds with soft colored bleeds
      - Soft gradient borders (white/20 to transparent)
      - White/purple/blue palette
      - Floating elements with soft shadows
      - Snappy spring animations (stiffness: 300, damping: 20)
    `
    },
    brutalist: {
        label: "Brutalist",
        rules: `
      - Raw bold typography (Inter Black or oversized sans)
      - High contrast black and white + ONE loud color (neon yellow, green, or red)
      - Hard borders (2px black), no rounded corners
      - Intentionally "ugly" grid layouts, overlapping elements
      - Aggressive hover states (instant color flip)
      - Zero gradients, zero blurs
    `
    },
    neomorphism: {
        label: "Neomorphism",
        rules: `
      - Soft extruded UI elements (convex/concave)
      - Monochromatic light gray palette (#e0e0e0)
      - Dual box shadows (light on top-left, dark on bottom-right)
      - Subtle, satisfying interactions (element "depresses" on click)
      - No hard borders, everything feels molded
    `
    },
    y2k: {
        label: "Y2K / Retro Futurism",
        rules: `
      - Chrome gradients, metallic textures
      - Hot pink, electric blue, lime green palette
      - Pixel fonts mixed with futuristic sans-serif
      - Glitchy animations and scanline overlays
      - Sticker-style elements and starburst shapes
      - Translucent plastic effects
    `
    },
    minimal: {
        label: "Swiss Minimal",
        rules: `
      - Extreme whitespace and strict grid alignment
      - Typography-first design (tight leading, varying weights)
      - Black, white, one muted accent color (e.g. crimson or navy)
      - Micro-animations only (opacity, subtle translation)
      - Helvetica-inspired type hierarchy
      - Clean lines, zero shadows
    `
    },
    aurora: {
        label: "Aurora / Gradient",
        rules: `
      - Rich flowing mesh gradients (purple → pink → blue)
      - Dark base with glowing color bleeds at edges
      - Soft glowing buttons with hover expansion
      - Smooth flowing animations (staggered entrance)
      - Glassmorphic accents to contain text
    `
    }
};
