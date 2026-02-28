"use client"

import { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react"
import { Pencil, RefreshCw, Check, X, Square } from "lucide-react"
import Message from "./Message"
import MarkdownRenderer from "./MarkdownRenderer"
import Composer from "./Composer"
import { ImageMessage } from "./ImageMessage"
import { ImageLoadingBubble } from "./ImageLoadingBubble"
import { cls, timeAgo } from "./utils"

const playedAnimations = new Set();

function TypewriterMarkdown({ content, isNew, messageId, className, fontStyle }) {
  const shouldAnimate = isNew && !playedAnimations.has(messageId);
  const [displayedContent, setDisplayedContent] = useState(shouldAnimate ? "" : content);

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayedContent(content);
      return;
    }

    playedAnimations.add(messageId);

    let i = 0;
    // Reveal 4 characters per 15 milliseconds for a smooth fast-typing look.
    const interval = setInterval(() => {
      setDisplayedContent(content.slice(0, i));
      i += 4;
      if (i > content.length) {
        clearInterval(interval);
        setDisplayedContent(content);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [content, shouldAnimate, messageId]);

  return <MarkdownRenderer content={displayedContent} className={className} fontStyle={fontStyle} />;
}

const THINKING_PHRASES = [
  "thinking on it boss... 🧠",
  "give me a sec, cooking something up 🍳",
  "on it, don't move... ⚡",
  "rhiley's thinking hard rn 👀",
  "loading genius... please wait 😏",
  "crunching the code... 🔥",
  "almost got it, hold tight 🖤",
  "in my bag rn, one sec ✨",
  "calculating world domination... i mean your answer 👾",
  "big brain moment incoming 🚀",
  "let me cook 🧑‍🍳",
  "on it like a senior dev ☕"
];

function ThinkingMessage({ onPause }) {
  const [phrase, setPhrase] = useState(() => THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)]);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setPhrase(prev => {
          let newPhrase;
          do {
            newPhrase = THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)];
          } while (newPhrase === prev);
          return newPhrase;
        });
        setFade(true);
      }, 500); // 500ms fade transition
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <Message role="assistant">
      <div className="w-full relative py-1 flex items-center">
        <style jsx>{`
          .fade-enter { opacity: 1; transition: opacity 0.5s ease-in; }
          .fade-exit { opacity: 0; transition: opacity 0.5s ease-out; }
          @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
          .cursor-blink { animation: blink 1s step-end infinite; }
        `}</style>
        <div className={`text-sm italic text-zinc-500 font-greatdesk ${fade ? 'fade-enter' : 'fade-exit'}`}>
          {phrase}
          <span className="cursor-blink font-sans ml-0.5">|</span>
        </div>
      </div>
    </Message>
  )
}

const ChatPane = forwardRef(function ChatPane(
  { conversation, onSend, onEditMessage, onResendMessage, isThinking, onPauseThinking, onOpenCreativeStudio, onVariation },
  ref,
) {
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const composerRef = useRef(null)
  // ✅ BUG 2 FIX: scroll anchor
  const bottomRef = useRef(null)

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent) => {
        composerRef.current?.insertTemplate(templateContent)
      },
      setValue: (val) => {
        composerRef.current?.setValue(val)
      },
    }),
    [],
  )

  // ✅ BUG 2 FIX: auto-scroll whenever messages arrive or thinking state changes
  const messages = Array.isArray(conversation?.messages) ? conversation.messages : []
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isThinking])

  if (!conversation) return null

  const tags = ["Certified", "Personalized", "Experienced", "Helpful"]
  const count = messages.length || conversation.messageCount || 0

  function startEdit(m) {
    setEditingId(m.id)
    setDraft(m.content)
  }
  function cancelEdit() {
    setEditingId(null)
    setDraft("")
  }
  function saveEdit() {
    if (!editingId) return
    onEditMessage?.(editingId, draft)
    cancelEdit()
  }
  function saveAndResend() {
    if (!editingId) return
    onEditMessage?.(editingId, draft)
    onResendMessage?.(editingId)
    cancelEdit()
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col w-full">
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-12 py-6 w-full max-w-none">
        <div className="mb-2 text-3xl font-greatdesk tracking-tight sm:text-4xl md:text-5xl">
          <span className="block leading-[1.05] font-sans text-2xl">{conversation.title}</span>
        </div>
        <div className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Updated {timeAgo(conversation.updatedAt)} · {count} messages
        </div>

        <div className="mb-6 flex flex-wrap gap-2 border-b border-zinc-200 pb-5 dark:border-zinc-800">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:text-zinc-200"
            >
              {t}
            </span>
          ))}
        </div>

        {messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            No messages yet. Say hello to start.
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {messages.map((m) => (
              <div key={m.id} className="space-y-2">
                {editingId === m.id ? (
                  <div className={cls("rounded-2xl border p-2", "border-zinc-200 dark:border-zinc-800")}>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="w-full resize-y rounded-xl bg-transparent p-2 text-sm outline-none"
                      rows={3}
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={saveEdit}
                        className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-white dark:bg-white dark:text-zinc-900"
                      >
                        <Check className="h-3.5 w-3.5" /> Save
                      </button>
                      <button
                        onClick={saveAndResend}
                        className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Save & Resend
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <Message role={m.role}>
                    {m.role === "user" ? (
                      <div className="whitespace-pre-wrap flex flex-col gap-2">
                        {typeof m.content === 'object' && m.content !== null && m.content.image?.dataUrl && (
                          <img src={m.content.image.dataUrl} alt="Uploaded" className="max-w-xs rounded-lg border border-zinc-200 dark:border-zinc-800" />
                        )}
                        {typeof m.content === 'object' && m.content !== null ? String(m.content.text || '') : String(m.content || '')}
                      </div>
                    ) : (
                      <>
                        {m.type === "image-loading" && (
                          <ImageLoadingBubble
                            prompt={m.prompt || ""}
                            status={typeof m.content === 'string' ? m.content : "Generating..."}
                          />
                        )}
                        {m.type === "image" && m.imageData && (
                          <ImageMessage
                            imageData={m.imageData}
                            mimeType={m.mimeType || "image/png"}
                            prompt={m.prompt || ""}
                            userPrompt={m.userPrompt || ""}
                            onRegenerate={() => onSend?.(m.userPrompt)}
                            onVariation={(type) => onVariation?.(m.prompt, m.userPrompt, type)}
                          />
                        )}
                        {(m.type === "text" || !m.type) && (
                          <TypewriterMarkdown
                            content={typeof m.content === 'object' && m.content !== null ? String(m.content.text || JSON.stringify(m.content)) : String(m.content || '')}
                            isNew={m.isNew}
                            messageId={m.id}
                            className="text-sm"
                          />
                        )}
                      </>
                    )}
                    {m.role === "user" && (
                      <div className="mt-1 flex gap-2 text-[11px] text-zinc-500">
                        <button className="inline-flex items-center gap-1 hover:underline" onClick={() => startEdit(m)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          className="inline-flex items-center gap-1 hover:underline"
                          onClick={() => onResendMessage?.(m.id)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Resend
                        </button>
                      </div>
                    )}
                  </Message>
                )}
              </div>
            ))}
            {isThinking && <ThinkingMessage onPause={onPauseThinking} />}
            {/* ✅ BUG 2 FIX: scroll sentinel — always last in the list */}
            <div ref={bottomRef} className="h-1" />
          </div>
        )}
      </div>

      <Composer
        ref={composerRef}
        onSend={async (payload, aesthetic) => {
          const textStr = typeof payload === 'object' && payload !== null ? (payload.text || '') : String(payload || '')
          if (!textStr.trim()) return
          setBusy(true)
          await onSend?.(payload, aesthetic)
          setBusy(false)
        }}
        busy={busy}
        onOpenCreativeStudio={onOpenCreativeStudio}
      />
    </div>
  )
})

export default ChatPane
