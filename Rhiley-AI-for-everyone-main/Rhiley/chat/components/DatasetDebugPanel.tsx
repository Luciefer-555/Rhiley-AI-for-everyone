"use client";

import { useState, useEffect } from "react";
import { getDatasetStats, getDatasetContext } from "@/lib/datasetIntelligence";

export function DatasetDebugPanel() {
    const [stats, setStats] = useState<any>(null);
    const [query, setQuery] = useState("");
    const [result, setResult] = useState<any>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // Wait for initial load
        const timer = setTimeout(() => {
            setStats(getDatasetStats());
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    const testLookup = () => {
        if (!query.trim()) return;
        const ctx = getDatasetContext(query, 3, 400);
        setResult(ctx);
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-4 left-4 z-50 px-3 py-1.5 rounded-lg text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-all shadow-xl"
            >
                📊 Dataset Debug
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 left-4 z-50 w-80 max-h-[80vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 flex flex-col gap-4 text-zinc-300">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    📊 Dataset Intelligence
                </h3>
                <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white text-xs">✕</button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 gap-2 text-[11px]">
                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                        <span className="text-zinc-500 block">Status</span>
                        <span className={stats.indexed ? "text-emerald-400" : "text-amber-400"}>
                            {stats.indexed ? "✅ Ready" : "⌛ Loading..."}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                            <span className="text-zinc-500 block">Examples</span>
                            <span className="text-white font-medium">{stats.totalExamples?.toLocaleString()}</span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                            <span className="text-zinc-500 block">Tags</span>
                            <span className="text-white font-medium">{stats.uniqueTags}</span>
                        </div>
                    </div>

                    <div className="mt-1">
                        <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Top Tags</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {stats.topTags?.slice(0, 8).map((t: any) => (
                                <span key={t.tag} className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-default">
                                    {t.tag} <span className="text-zinc-600">({t.count})</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Test lookup */}
            <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Test Lookup</label>
                <div className="flex gap-2">
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && testLookup()}
                        placeholder="e.g. gsap scroll animation"
                        className="flex-1 text-xs bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-zinc-600 outline-none focus:border-blue-500/50 transition-colors"
                    />
                    <button
                        onClick={testLookup}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                        Test
                    </button>
                </div>

                {result && (
                    <div className="mt-2 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex flex-col gap-1 text-[11px]">
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Tags Matched:</span>
                                <span className="text-blue-400">{result.tagsMatched.join(", ") || "none"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Total Candidates:</span>
                                <span className="text-white">{result.totalFound}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            {result.examples.map((ex: any, i: number) => (
                                <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col gap-1 overflow-hidden">
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">{ex.example.tag}</span>
                                        <span className="text-zinc-500 italic">score: {ex.score.toFixed(1)}</span>
                                    </div>
                                    <div className="text-[10px] text-zinc-400 truncate mt-1">
                                        {ex.example.repo ?? ex.example.source}
                                    </div>
                                    <div className="text-[9px] text-zinc-500 line-clamp-2 leading-relaxed italic">
                                        {ex.example.instruction}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
