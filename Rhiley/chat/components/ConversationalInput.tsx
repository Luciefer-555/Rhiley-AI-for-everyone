"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, ArrowRight, Loader2 } from "lucide-react";

type Stage = "idle" | "asking" | "answering" | "generating";

interface Message {
    role: "user" | "ai";
    content: string;
}

export function ConversationalInput({
    onGenerate
}: {
    onGenerate: (prompt: string, aesthetic: string) => void
}) {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [stage, setStage] = useState<Stage>("idle");
    const [questions, setQuestions] = useState("");
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, stage]);

    async function handleInitialSubmit() {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setMessages([{ role: "user", content: userMsg }]);
        setInput("");
        setStage("asking");

        try {
            // Ask AI for 3 questions
            const res = await fetch("/api/questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ request: userMsg }),
            });
            const data = await res.json();

            setQuestions(data.questions);
            setMessages(prev => [...prev, {
                role: "ai",
                content: data.questions
            }]);
            setStage("answering");
            setTimeout(() => inputRef.current?.focus(), 100);
        } catch (error) {
            console.error("Failed to fetch questions:", error);
            setStage("idle");
        }
    }

    async function handleAnswerSubmit() {
        if (!input.trim()) return;

        const answers = input.trim();
        setMessages(prev => [...prev, { role: "user", content: answers }]);
        setInput("");
        setStage("generating");

        try {
            // 1. Get enhanced prompt + aesthetic
            const res = await fetch("/api/questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    request: messages[0].content,
                    questions,
                    answers,
                    stage: "finalize"
                }),
            });
            const data = await res.json();

            // 2. Trigger generation via the new bridge
            const genRes = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: data.enhancedPrompt,
                    aesthetic: data.aesthetic
                }),
            });
            const genData = await genRes.json();

            // 3. Complete the flow
            onGenerate(genData.code, data.aesthetic);
        } catch (error) {
            console.error("Failed to finalize onboarding:", error);
            setStage("answering");
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (stage === "idle") handleInitialSubmit();
            else if (stage === "answering") handleAnswerSubmit();
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4 p-4 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">

            {/* Conversation thread */}
            <div
                ref={scrollRef}
                className="max-h-[300px] overflow-y-auto space-y-4 px-2 py-2 scrollbar-hide"
            >
                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
                ${msg.role === "user"
                                    ? "bg-purple-600 text-white rounded-br-sm font-medium"
                                    : "bg-white/10 text-white/90 rounded-bl-sm border border-white/10"
                                }`}
                            >
                                {/* Format AI questions nicely */}
                                {msg.role === "ai" ? (
                                    <div className="space-y-2">
                                        {msg.content.split("\n").map((line, j) => (
                                            <p key={j} className={line.match(/^\d\./)
                                                ? "text-white font-medium"
                                                : "text-white/50 text-xs italic"
                                            }>
                                                {line}
                                            </p>
                                        ))}
                                    </div>
                                ) : (
                                    <p>{msg.content}</p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Generating state */}
                {stage === "generating" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3 text-purple-400 text-sm font-medium py-2"
                    >
                        <div className="flex gap-1.5">
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full bg-purple-500"
                                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                                    transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                                />
                            ))}
                        </div>
                        <span className="animate-pulse">Rhiley is architecting your vision...</span>
                    </motion.div>
                )}

                {(stage === "asking") && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3 text-white/30 text-xs font-medium py-2"
                    >
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Thinking of questions...</span>
                    </motion.div>
                )}
            </div>

            {/* Input area */}
            {stage !== "generating" && (
                <div className="relative group">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={2}
                        disabled={stage === "asking"}
                        placeholder={
                            stage === "idle"
                                ? "Describe what you want to build... (e.g. 'SaaS landing page')"
                                : "Answer the questions above..."
                        }
                        className="w-full px-5 py-4 pr-14 rounded-2xl 
                       bg-white/5 border border-white/10
                       text-white placeholder:text-white/20
                       resize-none focus:outline-none focus:border-purple-500/50
                       transition-all text-sm leading-relaxed"
                    />
                    <button
                        onClick={stage === "idle" ? handleInitialSubmit : handleAnswerSubmit}
                        disabled={!input.trim() || stage === "asking"}
                        className="absolute bottom-4 right-4 p-2 rounded-xl 
                       bg-purple-600 text-white disabled:opacity-30 disabled:bg-white/10
                       hover:bg-purple-500 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-600/20"
                    >
                        {stage === "idle" ? <Sparkles size={16} /> : <ArrowRight size={16} />}
                    </button>
                </div>
            )}

            {/* Stage hint */}
            <AnimatePresence>
                {stage === "answering" && (
                    <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-white/20 text-[10px] uppercase tracking-widest text-center font-bold"
                    >
                        Answer all 3 above in one message, then hit enter →
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
