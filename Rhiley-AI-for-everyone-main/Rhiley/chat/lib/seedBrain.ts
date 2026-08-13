import { addSkill, getBrain } from "./brainManager";

export function seedBrainIfEmpty(): void {
    const brain = getBrain();
    if (brain.skills.length > 0) return; // already seeded

    // ── SKILL 1: 3D UI Expert ─────────────────────────────
    addSkill({
        name: "3D UI Expert",
        trigger: ["3d", "three.js", "r3f", "fiber", "drei", "webgl", "canvas", "mesh", "geometry", "shader", "3d animation"],
        systemInject: `Use @react-three/fiber + @react-three/drei always.
Canvas: camera={{position:[0,0,5],fov:60}} gl={{antialias:true,alpha:true}} style={{position:"absolute",inset:0,zIndex:0,pointerEvents:"none"}}.
Lights: ambientLight intensity=0.4, pointLight color="#8b5cf6" pos=[10,10,10].
useFrame for 60fps: ref.current.rotation.x += delta*0.3.
Float for bobbing. MeshDistortMaterial for organic shapes.`,
        codePatterns: ["useFrame not setInterval", "Float for auto-bobbing", "Canvas behind HTML UI"],
        libraries: ["three", "@react-three/fiber", "@react-three/drei"],
    });

    // ── SKILL 2: Framer Motion Master ────────────────────
    addSkill({
        name: "Framer Motion Master",
        trigger: ["framer", "animation", "animate", "motion", "spring", "hover effect", "scroll reveal", "stagger", "transition", "parallax"],
        systemInject: `Variants OUTSIDE component: const container={hidden:{opacity:0},visible:{opacity:1,transition:{staggerChildren:0.08}}}.
Scroll: useInView(ref,{once:true,margin:"-80px"}).
3D tilt: whileHover={{rotateX:-6,rotateY:10,z:40}} style={{perspective:1200,transformStyle:"preserve-3d"}}.
Text mask: overflow-hidden div + motion.span initial={{y:"110%"}} animate={{y:"0%"}}.
Spring: type:"spring",stiffness:300,damping:20.`,
        codePatterns: ["Variants outside component always", "useInView for scroll", "AnimatePresence mode='wait'"],
        libraries: ["framer-motion"],
    });

    // ── SKILL 3: Glassmorphism Expert ────────────────────
    addSkill({
        name: "Glassmorphism Expert",
        trigger: ["glass", "glassmorphism", "frosted", "backdrop blur", "blur card", "aurora"],
        systemInject: `Glass card: className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]".
Aurora blobs: 3 divs position fixed, rounded-full, blur-[120px], violet/cyan/pink at 20-30% opacity.
Dark bg always: bg-zinc-950 or bg-[#07070f]. Grain overlay: opacity-[0.03].`,
        codePatterns: ["bg-white/5 backdrop-blur-xl", "3 aurora blobs always", "inset shadow for depth"],
        libraries: [],
    });

    // ── SKILL 4: Landing Page Expert ─────────────────────
    addSkill({
        name: "Landing Page Expert",
        trigger: ["landing", "hero", "homepage", "marketing", "website", "full page", "scroll sections"],
        systemInject: `Structure: Hero → Features → Social proof → CTA → Footer.
Hero: text-[clamp(3rem,8vw,7rem)] font-black leading-[0.9]. Word-by-word mask reveal.
Animation order: badge delay=0, headline delay=0.1, subline delay=0.4, CTA delay=0.6.
Features: staggered useInView cards. CTA: magnetic button gradient + glow.`,
        codePatterns: ["clamp() for headline sizes", "word mask reveal on hero", "staggered feature cards"],
        libraries: ["framer-motion"],
    });
}
