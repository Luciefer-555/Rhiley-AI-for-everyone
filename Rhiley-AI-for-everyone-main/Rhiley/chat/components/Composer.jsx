"use client"

import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Loader2, Plus, Mic, Eye, Sparkles, ChevronDown, ChevronUp, MessageSquare } from "lucide-react"
import { ConversationalInput } from "./ConversationalInput"
import ComposerActionsPopover from "./ComposerActionsPopover"
import { cls } from "./utils"

const Composer = forwardRef(function Composer({ onSend, busy, onOpenCreativeStudio }, ref) {
  const [value, setValue] = useState("")
  const [sending, setSending] = useState(false)
  const [attachedImage, setAttachedImage] = useState(null)
  const [isConversational, setIsConversational] = useState(false)

  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  // ── Auto-resize textarea ────────────────────────────────────────────────────
  useEffect(() => {
    const textarea = inputRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    const scrollHeight = textarea.scrollHeight
    const lineHeight = 24
    const maxLines = 12
    if (scrollHeight <= lineHeight * maxLines) {
      textarea.style.height = `${Math.max(24, scrollHeight)}px`
      textarea.style.overflowY = "hidden"
    } else {
      textarea.style.height = `${lineHeight * maxLines}px`
      textarea.style.overflowY = "auto"
    }
  }, [value])

  // ── Expose insertTemplate + focus ───────────────────────────────────────────
  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent) => {
        setValue((prev) => {
          const newValue = prev ? `${prev}\n\n${templateContent}` : templateContent
          setTimeout(() => {
            inputRef.current?.focus()
            const length = newValue.length
            inputRef.current?.setSelectionRange(length, length)
          }, 0)
          return newValue
        })
      },
      focus: () => inputRef.current?.focus(),
      setValue: (val) => {
        setValue(val)
        setTimeout(() => {
          inputRef.current?.focus()
          const length = val.length
          inputRef.current?.setSelectionRange(length, length)
        }, 0)
      },
    }),
    [],
  )

  // ── Send handler ────────────────────────────────────────────────────────────
  async function handleSend(overridePayload = null, overrideAesthetic = null) {
    const payload = overridePayload || (attachedImage ? { text: value, image: attachedImage } : value)

    // Safety check
    if (!overridePayload && !value.trim() && !attachedImage) return
    if (sending || busy) return

    setValue("")
    setAttachedImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ""

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.overflowY = "hidden"
    }

    setSending(true)
    try {
      await onSend?.(payload, overrideAesthetic)
    } finally {
      setSending(false)
    }
  }

  const isLoading = sending || busy
  const hasContent = value.trim().length > 0 || attachedImage !== null

  return (
    <div className="w-full">
      <div
        className={cls(
          "w-full flex flex-col bg-white/80 dark:bg-black/40 backdrop-blur-xl transition-all duration-300 border-t",
          isLoading
            ? "border-violet-400/60 dark:border-violet-500/60 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
            : "border-zinc-200 dark:border-zinc-800/80",
        )}
      >
        {/* Textarea area */}
        <div className="flex-1 px-4 pt-4 pb-2">
          {isConversational ? (
            <div className="py-2">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Design Navigator</span>
                </div>
                <button
                  onClick={() => setIsConversational(false)}
                  className="text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white uppercase font-bold"
                >
                  Cancel
                </button>
              </div>
              <ConversationalInput
                onGenerate={(prompt, aesthetic) => {
                  setIsConversational(false)
                  handleSend(prompt, aesthetic)
                }}
              />
            </div>
          ) : (
            <>
              {/* LLaVA Vision badge */}
              <AnimatePresence>
                {attachedImage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="relative inline-block mb-3">
                      <img
                        src={attachedImage.dataUrl}
                        alt="Attached"
                        className="h-16 w-16 object-cover rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-lg"
                      />
                      <button
                        onClick={() => setAttachedImage(null)}
                        className="absolute -top-2 -right-2 bg-zinc-900 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <textarea
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={
                  isLoading
                    ? "Rhiley is thinking..."
                    : attachedImage
                      ? "Ask Rhiley about your image..."
                      : "How can I help you today?"
                }
                rows={1}
                disabled={isLoading}
                className={cls(
                  "w-full resize-none bg-transparent text-sm outline-none transition-all duration-200",
                  "min-h-[24px] text-left leading-6",
                  isLoading
                    ? "placeholder:text-violet-400/60 dark:placeholder:text-violet-400/40 cursor-not-allowed opacity-60"
                    : "placeholder:text-zinc-400",
                )}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    if (hasContent) handleSend()
                  }
                }}
              />
            </>
          )}
        </div>

        {/* Bottom toolbar */}
        {!isConversational && (
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1">
              <ComposerActionsPopover
                onImageUpload={setAttachedImage}
                onCreativeStudioOpen={onOpenCreativeStudio}
              >
                <button
                  className="inline-flex shrink-0 items-center justify-center rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
                  title="Add attachment"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </ComposerActionsPopover>

              <button
                onClick={() => setIsConversational(true)}
                disabled={isLoading}
                className={cls(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase transition-all",
                  "bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-white/40 hover:text-purple-400 hover:bg-purple-500/10"
                )}
              >
                <Sparkles className="h-3 w-3" />
                Sparkle Mode
              </button>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                className="inline-flex items-center justify-center rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
                title="Voice input"
              >
                <Mic className="h-5 w-5" />
              </button>

              <motion.button
                onClick={() => handleSend()}
                disabled={isLoading || !hasContent}
                whileTap={!isLoading && hasContent ? { scale: 0.88 } : {}}
                className={cls(
                  "inline-flex shrink-0 items-center justify-center rounded-full p-2.5 transition-colors duration-200",
                  hasContent && !isLoading
                    ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
                    : "bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed",
                )}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isLoading ? (
                    <motion.span key="l" exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </motion.span>
                  ) : (
                    <motion.span key="s" exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
                      <Send className="h-5 w-5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full flex justify-center py-2 px-1 text-center text-[11px] bg-white/80 dark:bg-black/60 backdrop-blur-sm text-zinc-400 dark:text-zinc-500">
        AI can make mistakes. Check important info.
      </div>
    </div>
  )
})

export default Composer
