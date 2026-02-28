"use client"

import React, { Component, ReactNode, useState, useCallback, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import AIAssistantUI from "../components/AIAssistantUI.jsx"
import WelcomeScreen from "../components/WelcomeScreen"
import CreativeStudio from "../components/CreativeStudio"
import { getSessions, createSession, saveSession, addMessageToSession, buildMessage, getSession, ChatMessage } from "@/lib/chatStorage"

// ─── App state ────────────────────────────────────────────────────────────────
type AppState = "welcome" | "transitioning" | "chat"

// ─── Error boundary ───────────────────────────────────────────────────────────
interface ErrorBoundaryState { hasError: boolean; error: Error | null }
interface ErrorBoundaryProps { children: ReactNode }

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error("AIAssistantUI Error:", error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md p-6">
              <h1 className="text-2xl font-bold mb-4 text-red-600">Application Error</h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                There was an error loading the chat interface.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Chat wrapper — fades in from nothing ─────────────────────────────────────
const chatEnterVariants = {
  hidden: { opacity: 0, scale: 1.02, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const, delay: 0.05 },
  },
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function Page() {
  const [appState, setAppState] = useState<AppState>("welcome")
  const [firstMessage, setFirstMessage] = useState<string>("")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isCreativeStudioOpen, setIsCreativeStudioOpen] = useState(false)
  const [chatPrefill, setChatPrefill] = useState<string>("")
  const [selectedAesthetic, setSelectedAesthetic] = useState<string>("cinematic")

  // Read user name from localStorage (set by login flow)
  const userName =
    typeof window !== "undefined"
      ? (() => {
        try {
          const u = localStorage.getItem("dummyUser")
          if (u) {
            const parsed = JSON.parse(u)
            const email: string = parsed.email || ""
            return email.split("@")[0] || undefined
          }
        } catch { }
        return undefined
      })()
      : undefined

  // ✅ Auth guard: redirect to login if not authenticated,
  // skip welcome screen if first message was already sent.
  useEffect(() => {
    if (typeof window === "undefined") return

    // Seed Rhiley's brain on first load
    const { seedBrainIfEmpty } = require("@/lib/seedBrain");
    seedBrainIfEmpty();

    // Support cross-port login via URL
    const params = new URLSearchParams(window.location.search)
    const userEmail = params.get("userEmail")
    if (userEmail) {
      localStorage.setItem("dummyUser", JSON.stringify({ email: userEmail, loginTime: new Date().toISOString() }))
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    const firstMsgSent = localStorage.getItem("rhiley_first_message") === "true"
    if (firstMsgSent) {
      const saved = sessionStorage.getItem("rhiley_first_msg") ?? ""
      setFirstMessage(saved)
      setAppState("chat")
    }
  }, [])

  const handleFirstMessage = useCallback((message: string, mode: 'build' | 'imagine' = 'build') => {
    const session = createSession(message);
    setSessionId(session.id);
    const userMsg = buildMessage("user", message);
    session.messages.push(userMsg);
    saveSession(session);
    setChatHistory([userMsg]);

    if (typeof window !== "undefined") {
      localStorage.setItem("rhiley_first_message", "true");
      sessionStorage.setItem("rhiley_first_msg", message);
    }

    setFirstMessage(message);

    // Trigger exit animation
    setAppState("transitioning");

    setTimeout(() => {
      setAppState("chat");
      if (mode === 'imagine') {
        setIsCreativeStudioOpen(true);
      }
    }, 900);
  }, []);

  const saveMessage = useCallback((role: "user" | "assistant", content: string, model?: string) => {
    if (!sessionId) return;
    const msg = buildMessage(role, content, model);
    const updated = addMessageToSession(sessionId, msg);
    if (updated) setChatHistory(updated.messages);
    return msg;
  }, [sessionId]);

  const handleBuildThis = useCallback((prompt: string) => {
    setChatPrefill(prompt);
    setIsCreativeStudioOpen(false);
  }, []);

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        {(appState === "welcome" || appState === "transitioning") && (
          <WelcomeScreen
            key="welcome"
            userName={userName}
            onFirstMessage={handleFirstMessage}
          />
        )}
        {appState === "chat" && (
          <motion.div
            key="chat"
            className="h-screen w-full relative"
            variants={chatEnterVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="h-full w-full">
              {/* @ts-ignore */}
              <AIAssistantUI
                initialMessage={firstMessage}
                sessionId={sessionId}
                chatHistory={chatHistory}
                onSaveMessage={saveMessage}
                prefill={chatPrefill}
                onPrefillUsed={() => setChatPrefill("")}
                selectedAesthetic={selectedAesthetic}
                onOpenCreativeStudio={() => setIsCreativeStudioOpen(true)}
              />
            </div>

            {/* Creative Studio Overlay */}
            <AnimatePresence>
              {isCreativeStudioOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 40 }}
                  className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8"
                >
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsCreativeStudioOpen(false)} />
                  <div className="relative w-full h-full max-w-7xl bg-white dark:bg-black rounded-[3rem] overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800">
                    <CreativeStudio
                      selectedAesthetic={selectedAesthetic}
                      onAestheticChange={setSelectedAesthetic}
                      onBuildThis={handleBuildThis}
                      onClose={() => setIsCreativeStudioOpen(false)}
                      initialPrompt={firstMessage}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </ErrorBoundary>
  )
}
