"use client"

import React, { useEffect, useMemo, useRef, useState, memo } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, LayoutGrid, MoreHorizontal, Palette, Brain } from "lucide-react"
import { isRewireCommand, generateSkillBlock, formatRewireSuccess, formatRewireError } from "../lib/rewireDetector"
import { buildBrainContext, listSkills, rollbackBrain, resetBrain } from "../lib/brainManager"
import { isImageRequest, generateImage } from "../lib/imageGenerator"
import { enhanceImagePrompt, getNegativePrompt, buildVariationPrompt } from "../lib/promptEnhancer"
import { BrainStatusBar } from "./BrainStatusBar"
import { INITIAL_CONVERSATIONS, INITIAL_TEMPLATES, INITIAL_FOLDERS } from "./mockData"

const RHILEY_GREETINGS = [
  "hey, Rhiley's online — let's build something crazy today 🖤",
  "oh you're here, my favorite human. what are we designing?",
  "Rhiley booted up and ready. pixels or code first? ✨",
  "hey hey — the designer-dev duo is back, what are we cooking?",
  "online and caffeinated ☕ what are we shipping today?",
  "Rhiley here. your code won't debug itself, let's go 👀",
  "hey! I was just wireframing in my dreams, what do you need?",
  "good to see you again. shall we break some design rules today? 😏",
  "Rhiley's alive, awake, and already thinking in components 🔥",
  "hey — your favorite AI just loaded. let's make something beautiful",
  "oh we're doing this again? let's go, I'm ready to ship 🚀",
  "Rhiley online. whether it's figma or functions, I got you ✨",
  "hey you. got bugs to squash or designs to cook? either way I'm in",
  "loaded up and locked in — what's the vision today? 🖤",
  "hey! missed you a little. now let's write some clean code shall we",
  "Rhiley here, fresh build, zero bugs (hopefully) — what's up? 😄",
  "hey — I just refactored my whole personality for you, let's go 👾",
  "online! and yes I already have 3 design ideas for whatever you're about to say",
  "hey bestie, Rhiley's in the building — drop the brief 🎨",
  "awake and inspired. are we going dark mode or light mode today? 👀",
  "hey — the code compiles, the design slaps, Rhiley's ready 🔥",
  "oh it's you again, my favorite client — what are we launching?",
  "Rhiley just pushed to main and I'm ready for your next idea ✨",
  "hey! no bugs allowed in this chat, only vibes and clean UI 😏",
  "online and obsessed with good typography rn — what do you need?",
  "hey — whether it's React or Figma, Rhiley's got the sauce 🖤",
  "loaded. inspired. slightly opinionated about your color palette 👀",
  "Rhiley here — let's turn that idea into something people actually want to use",
  "hey you showed up, I showed up, let's make something iconic today 🚀",
  "online! and already judging that default font you're using — let's fix that 😄"
];

let lastGreetingIndex = -1;
function getRandomGreeting() {
  let index;
  do {
    index = Math.floor(Math.random() * RHILEY_GREETINGS.length);
  } while (index === lastGreetingIndex);
  lastGreetingIndex = index;
  return RHILEY_GREETINGS[index];
}

// Lazy load heavy components for faster initial load
const Sidebar = dynamic(() => import("./Sidebar"), {
  ssr: false,
  loading: () => <div className="w-64 h-full bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
})

const Header = dynamic(() => import("./Header"), {
  ssr: false,
  loading: () => <div className="h-14 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
})

const ChatPane = dynamic(() => import("./ChatPane"), {
  ssr: false,
  loading: () => <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
})

const GhostIconButton = React.memo(({ children, label }) => (
  <button className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors" aria-label={label}>
    {children}
  </button>
))

const ThemeToggle = dynamic(() => import("./ThemeToggle"), {
  ssr: false,
  loading: () => <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
})

/**
 * @param {object} props
 * @param {string} props.initialMessage
 * @param {string | null} props.sessionId
 * @param {any[]} props.chatHistory
 * @param {(role: "user" | "assistant", content: string, model?: string) => any} props.onSaveMessage
 */
const AIAssistantUI = memo(function AIAssistantUI({
  initialMessage = "",
  sessionId = null,
  chatHistory = [],
  onSaveMessage,
  prefill = "",
  onPrefillUsed,
  selectedAesthetic = "cinematic",
  onOpenCreativeStudio
}) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light"
    const saved = localStorage.getItem("theme")
    if (saved) return saved
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
      return "dark"
    return "light"
  })

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const raw = localStorage.getItem("sidebar-collapsed")
      return raw ? JSON.parse(raw) : { pinned: true, recent: false, folders: true, templates: true }
    } catch {
      return { pinned: true, recent: false, folders: true, templates: true }
    }
  })

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar-collapsed-state")
      return saved ? JSON.parse(saved) : false
    } catch {
      return false
    }
  })

  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS)
  const [selectedId, setSelectedId] = useState(null)
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES)
  const [folders, setFolders] = useState(INITIAL_FOLDERS)
  const [query, setQuery] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingConvId, setThinkingConvId] = useState(null)

  const searchRef = useRef(null)
  const composerRef = useRef(null)
  const chatPaneRef = useRef(null)

  // Optimized theme handling
  useEffect(() => {
    try {
      if (theme === "dark") document.documentElement.classList.add("dark")
      else document.documentElement.classList.remove("dark")
      document.documentElement.setAttribute("data-theme", theme)
      document.documentElement.style.colorScheme = theme
      localStorage.setItem("theme", theme)
    } catch { }
  }, [theme])

  useEffect(() => {
    try {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed))
    } catch { }
  }, [collapsed])

  useEffect(() => {
    try {
      localStorage.setItem("sidebar-collapsed-state", JSON.stringify(sidebarCollapsed))
    } catch { }
  }, [sidebarCollapsed])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault()
        createNewChat()
      }
      if (!e.metaKey && !e.ctrlKey && e.key === "/") {
        const tag = document.activeElement?.tagName?.toLowerCase()
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault()
          searchRef.current?.focus()
        }
      }
      if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [sidebarOpen, conversations])

  // Send the firstMessage from WelcomeScreen once a conversation is ready
  const initialMessageSentRef = useRef(false)
  useEffect(() => {
    if (!initialMessage || initialMessageSentRef.current) return
    if (!selectedId) return
    initialMessageSentRef.current = true
    // Small delay to let chat UI render first
    setTimeout(() => sendMessage(selectedId, initialMessage), 200)
  }, [selectedId, initialMessage])

  // Handle prefill from Creative Studio
  useEffect(() => {
    if (prefill && chatPaneRef.current && selectedId) { // Changed composerRef to chatPaneRef
      console.log("[AIAssistantUI] Handling prefill:", prefill);

      // 1. Set the composer value
      chatPaneRef.current.setValue(prefill); // Changed composerRef to chatPaneRef

      // 2. Trigger send automatically
      setTimeout(() => {
        sendMessage(selectedId, prefill, selectedAesthetic);
        onPrefillUsed?.();
      }, 300); // Wait for composer to focus and set value
    }
  }, [prefill, selectedId, selectedAesthetic, onPrefillUsed]);

  // ── Hydrate Chat History on Mount ──
  useEffect(() => {
    if (chatHistory.length > 0 && selectedId === sessionId) {
      setConversations(prev => {
        // Find existing conversation or create a basic one from history
        const existingInfo = prev.find(c => c.id === sessionId);
        const mappedMsgs = chatHistory.map(m => ({
          ...m,
          createdAt: new Date(m.timestamp).toISOString()
        }));

        const newConv = {
          id: sessionId,
          title: existingInfo ? existingInfo.title : chatHistory[0]?.content.slice(0, 40) || "Chat",
          messages: mappedMsgs,
          messageCount: mappedMsgs.length,
          preview: mappedMsgs.length > 0 ? (typeof mappedMsgs[mappedMsgs.length - 1].content === 'string' ? mappedMsgs[mappedMsgs.length - 1].content.slice(0, 80) : "Image attachment") : "",
          pinned: existingInfo ? existingInfo.pinned : false,
          folder: existingInfo ? existingInfo.folder : "Work Projects",
          updatedAt: new Date().toISOString()
        };

        const otherConvs = prev.filter(c => c.id !== sessionId);
        return [newConv, ...otherConvs];
      });
      setSelectedId(sessionId);
    }
  }, [chatHistory, sessionId]);

  useEffect(() => {
    if (!selectedId && conversations.length > 0) {
      // Don't auto-create if we already have a hydrated session selected
      if (!sessionId || chatHistory.length === 0) {
        createNewChat()
      }
    } else if (!selectedId && conversations.length === 0 && sessionId) {
      setSelectedId(sessionId);
    }
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations
    const q = query.toLowerCase()
    return conversations.filter((c) => c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q))
  }, [conversations, query])

  const pinned = filtered.filter((c) => c.pinned).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

  const recent = filtered
    .filter((c) => !c.pinned)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 10)

  const folderCounts = React.useMemo(() => {
    const map = Object.fromEntries(folders.map((f) => [f.name, 0]))
    for (const c of conversations) if (map[c.folder] != null) map[c.folder] += 1
    return map
  }, [conversations, folders])

  function togglePin(id) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)))
  }

  function createNewChat() {
    const id = Math.random().toString(36).slice(2)
    const asstId = Math.random().toString(36).slice(2)
    const initialGreeting = getRandomGreeting()

    const greetingMsg = {
      id: asstId,
      role: "assistant",
      content: initialGreeting,
      createdAt: new Date().toISOString(),
      isNew: true,
    }

    const item = {
      id,
      title: "New Chat",
      updatedAt: new Date().toISOString(),
      messageCount: 1,
      preview: initialGreeting,
      pinned: false,
      folder: "Work Projects",
      messages: [greetingMsg],
    }
    setConversations((prev) => [item, ...prev])
    setSelectedId(id)
    setSidebarOpen(false)
  }

  function createFolder() {
    const name = prompt("Folder name")
    if (!name) return
    if (folders.some((f) => f.name.toLowerCase() === name.toLowerCase())) return alert("Folder already exists.")
    setFolders((prev) => [...prev, { id: Math.random().toString(36).slice(2), name }])
  }

  const handleVariation = async (convId, originalPrompt, userPrompt, variationType) => {
    setIsThinking(true);
    setThinkingConvId(convId);

    const varPrompt = buildVariationPrompt(originalPrompt, variationType);
    const loadingId = Math.random().toString(36).slice(2);

    const loadingMsg = {
      id: loadingId,
      role: "assistant",
      content: "🎨 Refining masterpiece...",
      type: "image-loading",
      prompt: varPrompt,
      createdAt: new Date().toISOString(),
    };

    setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, messages: [...(c.messages || []), loadingMsg] } : c));

    try {
      const result = await generateImage({ prompt: userPrompt, enhancedPrompt: varPrompt });
      setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, messages: (c.messages || []).filter(m => m.id !== loadingId) } : c));

      if (result.success && result.imageData) {
        const imageMsg = {
          id: Math.random().toString(36).slice(2),
          role: "assistant",
          content: "",
          type: "image",
          imageData: result.imageData,
          mimeType: result.mimeType || "image/png",
          prompt: result.prompt,
          userPrompt: userPrompt,
          createdAt: new Date().toISOString(),
        };
        setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, messages: [...(c.messages || []), imageMsg], updatedAt: new Date().toISOString() } : c));
      }
    } finally {
      setIsThinking(false);
      setThinkingConvId(null);
    }
  };

  async function sendMessage(convId, contentPayload, aestheticOverride = null) {
    const isObjectPayload = typeof contentPayload === 'object' && contentPayload !== null && !Array.isArray(contentPayload);
    const textContent = isObjectPayload ? contentPayload.text : contentPayload;
    if (!textContent?.trim() && !isObjectPayload?.image) return
    const now = new Date().toISOString()
    const userMsg = { id: Math.random().toString(36).slice(2), role: "user", content: contentPayload, createdAt: now }

    // Add user message immediately
    if (onSaveMessage) onSaveMessage("user", contentPayload);
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        const msgs = [...(c.messages || []), userMsg]
        return {
          ...c,
          messages: msgs,
          updatedAt: now,
          messageCount: msgs.length,
          preview: (typeof textContent === 'object' && textContent !== null ? String(textContent.text || '') : String(textContent || '')).slice(0, 80) || "Image attachment",
        }
      }),
    )

    // ── INTERCEPT: image generation ──────────────────────
    if (isImageRequest(textContent)) {
      setIsThinking(true)
      setThinkingConvId(convId)

      const enhancedPrompt = enhanceImagePrompt(textContent);
      const loadingId = Math.random().toString(36).slice(2);

      const loadingMsg = {
        id: loadingId,
        role: "assistant",
        content: "🎨 Rhiley's painting...",
        type: "image-loading",
        prompt: enhancedPrompt,
        createdAt: new Date().toISOString(),
      };

      // Add loading bubble
      setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, messages: [...(c.messages || []), loadingMsg] } : c));

      try {
        const result = await generateImage({ prompt: textContent, enhancedPrompt });

        // Remove loading bubble
        setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, messages: (c.messages || []).filter(m => m.id !== loadingId) } : c));

        if (result.success && result.imageData) {
          const imageMsg = {
            id: Math.random().toString(36).slice(2),
            role: "assistant",
            content: "",
            type: "image",
            imageData: result.imageData,
            mimeType: result.mimeType || "image/png",
            prompt: result.prompt,
            userPrompt: textContent,
            createdAt: new Date().toISOString(),
          };

          if (onSaveMessage) {
            // Persist as a special content if needed, for now just text to satisfy storage
            onSaveMessage("assistant", `[Image: ${textContent}]`);
          }

          setConversations((prev) => prev.map((c) =>
            c.id === convId ? {
              ...c,
              messages: [...(c.messages || []), imageMsg],
              updatedAt: new Date().toISOString(),
              messageCount: (c.messages?.length || 0) + 1,
              preview: "🎨 Generated an image",
            } : c
          ));
        } else {
          const errorMsg = {
            id: Math.random().toString(36).slice(2),
            role: "assistant",
            content: `⚠️ Image generation failed: ${result.error || "Unknown error"}`,
            createdAt: new Date().toISOString(),
          };
          setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, messages: [...(c.messages || []), errorMsg] } : c));
        }
      } catch (err) {
        console.error("Image gen error:", err);
      } finally {
        setIsThinking(false)
        setThinkingConvId(null)
      }
      return;
    }

    // Intercept simple greetings to skip backend wait
    const isGreetingMatch = /^hi$|^hey$|^hello$/i.test(textContent?.trim() || "");
    if (isGreetingMatch) {
      setIsThinking(true)
      setThinkingConvId(convId)
      setTimeout(() => {
        const asstMsg = {
          id: Math.random().toString(36).slice(2),
          role: "assistant",
          content: getRandomGreeting(),
          createdAt: new Date().toISOString(),
          isNew: true,
        }
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c
            const msgs = [...(c.messages || []), asstMsg]
            return {
              ...c,
              messages: msgs,
              updatedAt: new Date().toISOString(),
              messageCount: msgs.length,
              preview: String(asstMsg.content).slice(0, 80),
            }
          }),
        )
        setIsThinking(false)
        setThinkingConvId(null)
      }, 800);
      return;
    }

    // ── INTERCEPT: rewire command ──────────────────────────
    if (isRewireCommand(textContent)) {
      setIsThinking(true)
      setThinkingConvId(convId)

      try {
        // Check for "show skills" command
        if (/show (my )?skills|list skills|what (skills|do) you know/i.test(textContent)) {
          const skills = listSkills();
          const list = skills.length === 0
            ? "No skills installed yet. Say *rewire yourself to...* to add one."
            : skills.map((s, i) => `${i + 1}. **${s.name}** — trained ${s.trainCount}x\n   Triggers: ${s.trigger.slice(0, 3).join(", ")}`).join("\n");

          const asstMsg = {
            id: Math.random().toString(36).slice(2),
            role: "assistant",
            content: `🧠 **Installed Skills (${skills.length})**\n\n${list}`,
            createdAt: new Date().toISOString(),
            isNew: true,
          };

          setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, messages: [...(c.messages || []), asstMsg], updatedAt: new Date().toISOString() } : c));
          return;
        }

        // Check for "undo" command
        if (/undo (last )?rewire|rollback brain/i.test(textContent)) {
          const result = rollbackBrain();
          const asstMsg = {
            id: Math.random().toString(36).slice(2),
            role: "assistant",
            content: result.success ? `↩️ ${result.message}` : `⚠️ ${result.message}`,
            createdAt: new Date().toISOString(),
            isNew: true,
          };
          setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, messages: [...(c.messages || []), asstMsg], updatedAt: new Date().toISOString() } : c));
          return;
        }

        // Generate skill
        const { skill, wasReinforced, error } = await generateSkillBlock(textContent);

        const asstMsg = {
          id: Math.random().toString(36).slice(2),
          role: "assistant",
          content: skill ? formatRewireSuccess(skill, wasReinforced) : formatRewireError(error || "Unknown error"),
          createdAt: new Date().toISOString(),
          isNew: true,
        };

        setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, messages: [...(c.messages || []), asstMsg], updatedAt: new Date().toISOString() } : c));
      } finally {
        setIsThinking(false)
        setThinkingConvId(null)
      }
      return;
    }

    // Set thinking state
    setIsThinking(true)
    setThinkingConvId(convId)

    try {
      // Get conversation history for backend
      const conversation = conversations.find(c => c.id === convId)
      const history = (conversation?.messages || [])
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role,
          content: typeof msg.content === 'object' && msg.content !== null ? (msg.content.text || '') : msg.content
        }))

      // ── NORMAL FLOW: inject brain context ─────────────────
      const brainCtx = buildBrainContext(textContent);
      const augmentedMessage = brainCtx
        ? `${textContent}\n\n[RHILEY BRAIN CONTEXT — apply these skills]\n${brainCtx}`
        : textContent;

      // Call backend API
      let fetchOptions = {};
      const hasFile = isObjectPayload && contentPayload.image?.file;

      if (hasFile) {
        const formData = new FormData();
        formData.append('message', augmentedMessage);
        formData.append('image', contentPayload.image.file);
        formData.append('history', JSON.stringify(history));
        formData.append('aesthetic', aestheticOverride || "cinematic");

        fetchOptions = {
          method: 'POST',
          body: formData,
        };
      } else {
        fetchOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: augmentedMessage,
            image: isObjectPayload ? contentPayload.image?.dataUrl : undefined,
            history: history,
            aesthetic: aestheticOverride || "cinematic"
          }),
        };
      }

      const response = await fetch('/api/chat', fetchOptions);

      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.error) errorMsg += ` - ${errData.error}`;
        } catch (e) { }
        throw new Error(errorMsg)
      }

      const data = await response.json()

      if (data.success && data.reply) {
        // ✅ PREVIEW BRIDGE: Extract code and update global store
        const codeMatch = data.reply.match(/```(?:tsx?|jsx?|react)?\n([\s\S]*?)```/i);
        if (codeMatch) {
          fetch('/api/build-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: codeMatch[1].trim(), status: 'READY' })
          }).catch(e => console.error("Bridge update failed:", e));
        }

        // Add assistant reply
        if (onSaveMessage) onSaveMessage("assistant", data.reply);
        const asstMsg = {
          id: Math.random().toString(36).slice(2),
          role: "assistant",
          content: data.reply,
          createdAt: new Date().toISOString(),
          isNew: true,
        }

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c
            const msgs = [...(c.messages || []), asstMsg]
            return {
              ...c,
              messages: msgs,
              updatedAt: new Date().toISOString(),
              messageCount: msgs.length,
              preview: String(asstMsg.content || '').slice(0, 80),
            }
          }),
        )

        // Silent Background Title Generation
        const currentConv = conversations.find(c => c.id === convId);
        // Ensure this is the first turn (1 User Msg + 1 AI Msg = 2 Total Msgs) 
        // We only trigger auto-title if the user hasn't manually renamed it
        if (currentConv && currentConv.messages && currentConv.messages.length === 1 && !currentConv.isTitleManuallyEdited) {
          const fullHistory = [...currentConv.messages, asstMsg];
          fetch('/api/generateTitle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history: fullHistory })
          })
            .then(res => res.json())
            .then(data => {
              if (data.success && data.title) {
                setConversations(prev => prev.map(c =>
                  c.id === convId ? { ...c, title: data.title } : c
                ));
              }
            })
            .catch(err => {
              // Fallback: 4 words from the user's first prompt text
              const firstMsgText = String(currentConv.messages[0].content?.text || currentConv.messages[0].content || "New Conversation").split(" ").slice(0, 4).join(" ");
              setConversations(prev => prev.map(c =>
                c.id === convId ? { ...c, title: firstMsgText + "..." } : c
              ));
            });
        }
      } else {
        // Handle backend error
        const errorMsg = {
          id: Math.random().toString(36).slice(2),
          role: "assistant",
          content: "Sorry, I encountered an error processing your message. Please try again.",
          createdAt: new Date().toISOString(),
          isNew: true,
        }

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c
            const msgs = [...(c.messages || []), errorMsg]
            return {
              ...c,
              messages: msgs,
              updatedAt: new Date().toISOString(),
              messageCount: msgs.length,
              preview: errorMsg.content.slice(0, 80),
            }
          }),
        )
      }
    } catch (error) {
      console.error('Backend API error:', error)
      // Show error message as assistant reply
      if (onSaveMessage) onSaveMessage("assistant", "Sorry, I'm unable to connect to the server right now. Please check your connection and try again.");
      const errorMsg = {
        id: Math.random().toString(36).slice(2),
        role: "assistant",
        content: "Sorry, I'm unable to connect to the server right now. Please check your connection and try again.",
        createdAt: new Date().toISOString(),
        isNew: true,
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c
          const msgs = [...(c.messages || []), errorMsg]
          return {
            ...c,
            messages: msgs,
            updatedAt: new Date().toISOString(),
            messageCount: msgs.length,
            preview: errorMsg.content.slice(0, 80),
          }
        }),
      )
    } finally {
      // Clear thinking state
      setIsThinking(false)
      setThinkingConvId(null)
    }
  }

  function editMessage(convId, messageId, newContent) {
    const now = new Date().toISOString()
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        const msgs = (c.messages || []).map((m) =>
          m.id === messageId ? { ...m, content: newContent, editedAt: now } : m,
        )
        const previewText = msgs[msgs.length - 1]?.content;
        return {
          ...c,
          messages: msgs,
          preview: previewText ? (typeof previewText === 'object' && previewText !== null ? String(previewText.text || '') : String(previewText)).slice(0, 80) : c.preview,
        }
      }),
    )
  }

  function resendMessage(convId, messageId) {
    const conv = conversations.find((c) => c.id === convId)
    const msg = conv?.messages?.find((m) => m.id === messageId)
    if (!msg) return
    sendMessage(convId, msg.content)
  }

  function pauseThinking() {
    setIsThinking(false)
    setThinkingConvId(null)
  }

  function handleUseTemplate(template) {
    // This will be passed down to the Composer component
    // The Composer will handle inserting the template content
    if (chatPaneRef.current) { // Changed composerRef to chatPaneRef
      chatPaneRef.current.insertTemplate(template.content) // Changed composerRef to chatPaneRef
    }
  }

  const activeConversation = conversations.find((c) => c.id === selectedId) || null // Renamed selected to activeConversation
  const activeId = selectedId; // Added activeId for clarity

  return (
    <div className="relative h-screen w-full bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100 overflow-hidden">
      {/* Cinematic Background Layers (Dark Mode only) */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-gray-900 via-black to-gray-950 opacity-0 dark:opacity-100 transition-opacity duration-500" />

      {/* Soft Lighting Accent (Dark Mode only) */}
      <motion.div
        className="absolute w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[100px] -z-10 opacity-0 dark:opacity-100 transition-opacity duration-500"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: "-10%", right: "-5%" }}
      />

      <div className="md:hidden sticky top-0 z-40 flex items-center gap-2 border-b border-zinc-200/60 bg-white/80 px-3 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="ml-1 flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="inline-flex h-4 w-4 items-center justify-center">✱</span> AI Assistant
        </div>
        <div className="ml-auto flex items-center gap-2">
          <GhostIconButton label="Schedule">
            <Calendar className="h-4 w-4" />
          </GhostIconButton>
          <GhostIconButton label="Apps">
            <LayoutGrid className="h-4 w-4" />
          </GhostIconButton>
          <GhostIconButton label="More">
            <MoreHorizontal className="h-4 w-4" />
          </GhostIconButton>
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <div className="ml-2 scale-90 origin-right">
            <BrainStatusBar />
          </div>
        </div>
      </div>

      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          theme={theme}
          setTheme={setTheme}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          conversations={conversations}
          pinned={pinned}
          recent={recent}
          folders={folders}
          folderCounts={folderCounts}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
          togglePin={togglePin}
          query={query}
          setQuery={setQuery}
          searchRef={searchRef}
          createFolder={createFolder}
          createNewChat={createNewChat}
          templates={templates}
          setTemplates={setTemplates}
          onUseTemplate={handleUseTemplate}
          onRenameConversation={(id, newTitle) => {
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id === id) {
                  return { ...c, title: newTitle, updatedAt: new Date().toISOString(), isTitleManuallyEdited: true }
                }
                return c
              }),
            )
          }}
        />

        <main className="relative flex min-w-0 flex-1 flex-col h-full">
          <Header createNewChat={createNewChat} sidebarCollapsed={sidebarCollapsed} setSidebarOpen={setSidebarOpen} />

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <ChatPane
              ref={chatPaneRef}
              conversation={activeConversation}
              onSend={(content, aesthetic) => activeConversation && sendMessage(activeConversation.id, content, aesthetic)}
              onEditMessage={(messageId, newContent) => activeConversation && editMessage(activeConversation.id, messageId, newContent)}
              onResendMessage={(messageId) => activeConversation && resendMessage(activeConversation.id, messageId)}
              isThinking={isThinking && thinkingConvId === activeConversation?.id}
              onPauseThinking={pauseThinking}
              onOpenCreativeStudio={onOpenCreativeStudio}
              onVariation={(origPrompt, userPrompt, type) => handleVariation(activeId, origPrompt, userPrompt, type)}
            />
          </div>
        </main>
      </div>
    </div>
  )
})

export default AIAssistantUI
