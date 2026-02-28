"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    getBrain, removeSkill, exportBrain, importBrain,
    rollbackBrain, resetBrain, type SkillBlock
} from "@/lib/brainManager";

export function BrainStatusBar() {
    const [open, setOpen] = useState(false);
    const [skills, setSkills] = useState<SkillBlock[]>([]);
    const [msg, setMsg] = useState("");

    const refresh = () => setSkills(getBrain().skills);

    useEffect(() => { refresh(); }, []);

    const handleDelete = (id: string) => {
        removeSkill(id);
        refresh();
        setMsg("Skill removed.");
        setTimeout(() => setMsg(""), 2000);
    };

    const handleExport = () => {
        const blob = new Blob([exportBrain()], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "rhiley-brain.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const text = await file.text();
            const result = importBrain(text);
            setMsg(result.message);
            refresh();
            setTimeout(() => setMsg(""), 3000);
        };
        input.click();
    };

    const handleRollback = () => {
        const result = rollbackBrain();
        setMsg(result.message);
        refresh();
        setTimeout(() => setMsg(""), 3000);
    };

    const handleReset = () => {
        if (!confirm("Reset entire brain? This removes all skills.")) return;
        resetBrain();
        refresh();
        setMsg("Brain reset to defaults.");
        setTimeout(() => setMsg(""), 2000);
    };

    return (
        <div className="relative">
            {/* Brain toggle button */}
            <button
                onClick={() => { setOpen(!open); refresh(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
            >
                🧠 <span>{skills.length} skill{skills.length !== 1 ? "s" : ""}</span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute bottom-10 right-0 w-80 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-4 z-50"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-white">🧠 Rhiley Brain</span>
                            <span className="text-xs text-zinc-500">{skills.length} skills installed</span>
                        </div>

                        {/* Skills list */}
                        <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                            {skills.length === 0 ? (
                                <p className="text-zinc-600 text-xs text-center py-4">No skills yet. Say "rewire yourself to..."</p>
                            ) : (
                                skills.map(skill => (
                                    <div key={skill.id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                                        <div>
                                            <p className="text-xs font-medium text-white">{skill.name}</p>
                                            <p className="text-[10px] text-zinc-500">trained {skill.trainCount}x · {skill.trigger.slice(0, 2).join(", ")}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(skill.id)}
                                            className="text-zinc-600 hover:text-red-400 transition-colors text-xs ml-2 shrink-0"
                                        >✕</button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Status message */}
                        {msg && <p className="text-xs text-violet-400 mb-2">{msg}</p>}

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={handleExport}
                                className="text-xs py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                                📤 Export Brain
                            </button>
                            <button onClick={handleImport}
                                className="text-xs py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                                📥 Import Brain
                            </button>
                            <button onClick={handleRollback}
                                className="text-xs py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                                ↩️ Undo Last
                            </button>
                            <button onClick={handleReset}
                                className="text-xs py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all">
                                🗑️ Reset All
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
