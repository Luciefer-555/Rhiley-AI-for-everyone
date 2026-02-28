"use client"
import { MoreHorizontal, Menu } from "lucide-react"
import GhostIconButton from "./GhostIconButton"
import { BrainStatusBar } from "./BrainStatusBar"

export default function Header({ createNewChat, sidebarCollapsed, setSidebarOpen }) {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-zinc-200/60 bg-white/80 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden inline-flex items-center justify-center rounded-lg p-2 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-800"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <div className="ml-auto flex items-center gap-2">
        <a
          href="/preview"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold hover:bg-purple-500/20 transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          Live Preview
        </a>
        <div className="scale-90 origin-right">
          <BrainStatusBar />
        </div>
        <GhostIconButton label="More">
          <MoreHorizontal className="h-4 w-4" />
        </GhostIconButton>
      </div>
    </div>
  )
}
