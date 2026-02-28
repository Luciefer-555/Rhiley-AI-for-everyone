"use client";

import { useState, useEffect } from "react";
import { Loader2, Settings, Monitor, ExternalLink } from "lucide-react";

export default function PreviewPage() {
    const [buildTime, setBuildTime] = useState(0);
    const [status, setStatus] = useState("waiting");

    useEffect(() => {
        const poll = async () => {
            try {
                const res = await fetch("/api/build-status");
                const data = await res.json();
                if (data.timestamp > buildTime) {
                    setBuildTime(data.timestamp);
                    setStatus(data.status);
                    console.log("🔄 New native build detected:", data.timestamp);
                }
            } catch (e) { /* ignore */ }
        };
        const interval = setInterval(poll, 2000);
        poll();
        return () => clearInterval(interval);
    }, [buildTime]);

    return (
        <div className="h-screen bg-[#050508] flex flex-col font-sans">
            <header className="h-14 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-6 z-20">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                        <Settings size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xs font-bold text-white/90 uppercase tracking-wider">Rhiley Live Engine</h1>
                        <p className="text-[10px] text-white/30 font-mono">
                            NATIVE_BUILD: {buildTime ? new Date(buildTime).toLocaleTimeString() : "READY"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {status === "repairing" && (
                        <div className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-2">
                            <Loader2 size={10} className="text-yellow-400 animate-spin" />
                            <span className="text-[9px] text-yellow-500 font-bold uppercase tracking-wider">Hot Reloading...</span>
                        </div>
                    )}
                    <a
                        href="/live"
                        target="_blank"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/60 hover:text-white hover:bg-white/10 transition-all font-bold uppercase"
                    >
                        <ExternalLink size={12} /> Open in New Tab
                    </a>
                    <div className="h-4 w-px bg-white/10" />
                    <div className="flex items-center gap-2 text-indigo-400">
                        <Monitor size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Native View</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 relative bg-black overflow-hidden">
                <iframe
                    key={buildTime}
                    src={`/live?t=${buildTime}`}
                    className="w-full h-full border-0"
                />

                {buildTime === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 bg-[#050508] z-10">
                        <div className="w-10 h-10 border-2 border-white/5 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-white/20 text-[10px] uppercase tracking-widest font-bold font-mono">Connecting to File-Sync Bridge...</p>
                    </div>
                )}
            </main>
        </div>
    );
}
