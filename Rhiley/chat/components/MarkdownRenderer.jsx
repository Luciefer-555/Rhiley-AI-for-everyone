"use client"

import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Play, PlayCircle, X, TerminalSquare, CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react"
import { DesignAnalysisBlock } from "./DesignAnalysisBlock"

const CodeBlockRunner = ({ node, inline, className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || "") // Restore language assignment
  const language = match ? match[1] : ""

  const [copiedCode, setCopiedCode] = useState(false)
  const [terminalOutput, setTerminalOutput] = useState(null)
  const [isExecuting, setIsExecuting] = useState(false)

  if (language === "design-analysis") {
    try {
      const analysis = JSON.parse(String(children).replace(/\n$/, ""))
      return <DesignAnalysisBlock analysis={analysis} />
    } catch (e) {
      console.error("Failed to parse design analysis JSON:", e)
      // Fallback to regular code block if parsing fails
    }
  }

  const codeString = String(children).replace(/\n$/, "")

  const getSandpackConfig = (language, code) => {
    const lang = (language || '').toLowerCase().trim();

    if (lang === 'tsx' || lang === 'react' || lang === 'typescript') {
      return { template: 'react-ts', file: '/App.tsx', previewLabel: 'React Preview' };
    }
    if (lang === 'jsx') {
      return { template: 'react', file: '/App.jsx', previewLabel: 'React Preview' };
    }
    if (lang === 'html' || lang === 'css') {
      return { template: 'static', file: '/index.html', previewLabel: 'HTML Preview' };
    }
    if (lang === 'javascript' || lang === 'js') {
      return { template: 'vanilla', file: '/index.js', previewLabel: 'JS Preview' };
    }
    // Auto-detect React from code content
    if (code && (
      code.includes("from 'react'") ||
      code.includes('from "react"') ||
      code.includes('export default function') ||
      code.includes('useState') ||
      code.includes('<motion.') ||
      code.includes("'use client'")
    )) {
      return { template: 'react-ts', file: '/App.tsx', previewLabel: 'React Preview' };
    }
    // HTML doctype detected
    if (code && code.trim().startsWith('<!DOCTYPE')) {
      return { template: 'static', file: '/index.html', previewLabel: 'HTML Preview' };
    }
    // Default = react-ts
    return { template: 'react-ts', file: '/App.tsx', previewLabel: 'Preview' };
  };

  const getCodeBadge = (language, code) => {
    const lang = (language || '').toLowerCase();
    const badges = {
      tsx: 'TSX', react: 'TSX', typescript: 'TSX',
      jsx: 'JSX', html: 'HTML', css: 'CSS',
      javascript: 'JS', js: 'JS', python: 'PY',
      java: 'JAVA', go: 'GO', rust: 'RUST',
    };
    if (badges[lang]) return badges[lang];
    // Auto-detect
    if (code && (code.includes("from 'react'") || code.includes('export default function'))) return 'TSX';
    if (code && code.trim().startsWith('<!DOCTYPE')) return 'HTML';
    return lang.toUpperCase() || 'CODE';
  };

  const config = getSandpackConfig(language, codeString);
  const badgeLabel = getCodeBadge(language, codeString);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(codeString)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const executePiston = async () => {
    setIsExecuting(true)
    setTerminalOutput(null)

    // Map standard markdown languages to Piston aliases
    const languageMap = {
      python: 'python',
      javascript: 'javascript',
      js: 'javascript',
      java: 'java',
      c: 'c',
      cpp: 'c++',
      'c++': 'c++',
      rust: 'rust',
      go: 'go'
    }

    const targetLang = languageMap[language.toLowerCase()] || language.toLowerCase()

    try {
      // Fetch latest piston runtimes to get version
      const runtimesRes = await fetch('https://emkc.org/api/v2/piston/runtimes')
      const runtimes = await runtimesRes.json()
      const runtime = runtimes.find(r => r.language === targetLang || r.aliases.includes(targetLang))

      if (!runtime) {
        setTerminalOutput({ type: 'error', text: `Language '${targetLang}' not supported by execution engine.` })
        setIsExecuting(false)
        return
      }

      const res = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: runtime.language,
          version: runtime.version,
          files: [{ content: codeString }],
          compile_timeout: 10000,
          run_timeout: 10000
        })
      });

      const data = await res.json();

      if (data.compile && data.compile.code !== 0) {
        setTerminalOutput({ type: 'error', text: data.compile.stderr || data.compile.output })
      } else if (data.run && data.run.code !== 0) {
        setTerminalOutput({ type: 'error', text: data.run.stderr || data.run.output })
      } else {
        setTerminalOutput({ type: 'success', text: data.run.stdout || data.run.output })
      }
    } catch (err) {
      setTerminalOutput({ type: 'error', text: 'Execution failed: Network or timeout error.' })
    } finally {
      setIsExecuting(false)
    }
  }

  // Web languages for Sandpack
  const webLangs = ['html', 'css', 'javascript', 'js', 'react', 'jsx', 'tsx', 'vue']
  const isWebLang = webLangs.includes(language.toLowerCase())
  const hasTailwind = codeString.includes('tailwind') || codeString.includes('className=')

  // We now rely on SandpackBlock to handle files internally based on language
  const getSandpackFiles = () => ({})
  const getSandpackTemplate = () => config.template

  if (!inline && language) {
    return (
      <div className="relative my-4 flex flex-col group rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-[#1e1e1e]">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800/50 text-xs font-medium">
          <div className="flex items-center gap-3 overflow-hidden pr-2">
            <span className="text-zinc-400 font-mono uppercase tracking-wider shrink-0">{badgeLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            {isWebLang ? (
              <a
                href="/live"
                target="_blank"
                className="text-emerald-400 hover:bg-emerald-400/10 px-2 py-1 rounded transition-colors flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                View in Live Preview →
              </a>
            ) : (
              <button
                onClick={Object.keys(terminalOutput || {}).length > 0 ? () => setTerminalOutput(null) : executePiston}
                disabled={isExecuting}
                className="text-amber-400 hover:bg-amber-400/10 px-2 py-1 rounded transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                {Object.keys(terminalOutput || {}).length > 0 ? (
                  <><X className="w-3 h-3" /> Close</>
                ) : isExecuting ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Running</>
                ) : (
                  <><Play className="w-3 h-3" /> Run</>
                )}
              </button>
            )}

            <div className="w-px h-3 bg-zinc-700 mx-1"></div>

            <button
              onClick={copyToClipboard}
              className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
              title="Copy code"
            >
              {copiedCode ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1M8 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {terminalOutput && !isWebLang && (
          <div className="bg-[#0c0c0c] border-b border-zinc-800 p-4 font-mono text-xs overflow-x-auto min-h-[100px] max-h-[300px] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 mb-2 text-zinc-500 uppercase tracking-widest text-[10px]">
              <TerminalSquare className="w-3 h-3" /> Executed on Piston Engine
            </div>
            <pre className={`whitespace-pre-wrap ${terminalOutput.type === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>
              {terminalOutput.text || '(No output)'}
            </pre>
          </div>
        )}

        {/* Syntax Highlighter Block */}
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"
          className="!mt-0 !bg-transparent !mb-0"
          customStyle={{
            margin: 0,
            background: 'transparent',
            padding: '16px',
            fontSize: '13px',
            overflowX: 'auto',
          }}
          {...props}
        >
          {codeString}
        </SyntaxHighlighter>


      </div>
    )
  }

  // Inline code renderer
  if (inline) {
    return (
      <code className="px-1.5 py-0.5 mx-0.5 bg-zinc-200/50 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 rounded-md text-[13px] font-mono border border-zinc-300/30 dark:border-zinc-700/50" {...props}>
        {children}
      </code>
    )
  }

  // Fallback for code blocks without language
  // Wrapped in div to prevent <pre> from ever nesting inside <p>
  return (
    <div className="my-4">
      <pre className="p-4 bg-zinc-100 dark:bg-[#1e1e1e] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto">
        <code className="text-[13px] font-mono text-zinc-800 dark:text-zinc-200" {...props}>
          {children}
        </code>
      </pre>
    </div>
  )
}

const MarkdownRenderer = ({ content, className = "" }) => {
  const [copiedCode, setCopiedCode] = useState(null)

  const copyToClipboard = async (text, codeId) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(codeId)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const components = {
    // Inject the isolated state manager for code blocks
    code: (props) => <CodeBlockRunner {...props} />,

    // Custom heading renderer
    h1({ children, ...props }) {
      return (
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-6 mb-4 first:mt-0" {...props}>
          {children}
        </h1>
      )
    },

    h2({ children, ...props }) {
      return (
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-5 mb-3 first:mt-0" {...props}>
          {children}
        </h2>
      )
    },

    h3({ children, ...props }) {
      return (
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-4 mb-2 first:mt-0" {...props}>
          {children}
        </h3>
      )
    },

    h4({ children, ...props }) {
      return (
        <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-3 mb-2 first:mt-0" {...props}>
          {children}
        </h4>
      )
    },

    h5({ children, ...props }) {
      return (
        <h5 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-2 mb-1 first:mt-0" {...props}>
          {children}
        </h5>
      )
    },

    h6({ children, ...props }) {
      return (
        <h6 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-2 mb-1 first:mt-0" {...props}>
          {children}
        </h6>
      )
    },

    // Custom list renderer
    ul({ children, ...props }) {
      return (
        <ul className="list-disc list-inside my-3 space-y-1 text-zinc-700 dark:text-zinc-300" {...props}>
          {children}
        </ul>
      )
    },

    ol({ children, ...props }) {
      return (
        <ol className="list-decimal list-inside my-3 space-y-1 text-zinc-700 dark:text-zinc-300" {...props}>
          {children}
        </ol>
      )
    },

    li({ children, ...props }) {
      return (
        <li className="ml-2" {...props}>
          {children}
        </li>
      )
    },

    // Custom paragraph renderer — use div whenever children contain block-level elements.
    // react-markdown wraps fenced code blocks in a <p> in some edge cases;
    // CodeBlockRunner renders those as <div> or <pre>, both illegal inside <p>.
    p({ children, node, ...props }) {
      const blockTags = new Set(['pre', 'div', 'blockquote', 'ul', 'ol', 'table', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

      const hasBlockChild = node?.children?.some(child => {
        if (child.type !== 'element') return false
        // Direct block tag
        if (blockTags.has(child.tagName)) return true
        // code element — CodeBlockRunner will render it as a block-level div/pre
        if (child.tagName === 'code') return true
        // One level deeper (e.g. strong > code)
        return child.children?.some(grandchild =>
          grandchild.type === 'element' && (blockTags.has(grandchild.tagName) || grandchild.tagName === 'code')
        )
      })

      if (hasBlockChild) {
        return (
          <div className="my-3 text-zinc-700 dark:text-zinc-300 leading-relaxed" {...props}>
            {children}
          </div>
        )
      }
      return (
        <p className="my-3 text-zinc-700 dark:text-zinc-300 leading-relaxed" {...props}>
          {children}
        </p>
      )
    },

    // Custom blockquote renderer
    blockquote({ children, ...props }) {
      return (
        <blockquote
          className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 my-4 italic text-zinc-600 dark:text-zinc-400"
          {...props}
        >
          {children}
        </blockquote>
      )
    },

    // Custom table renderer
    table({ children, ...props }) {
      return (
        <div className="my-4 overflow-x-auto">
          <table className="min-w-full border-collapse border border-zinc-200 dark:border-zinc-700" {...props}>
            {children}
          </table>
        </div>
      )
    },

    thead({ children, ...props }) {
      return (
        <thead className="bg-zinc-50 dark:bg-zinc-800" {...props}>
          {children}
        </thead>
      )
    },

    tbody({ children, ...props }) {
      return (
        <tbody {...props}>
          {children}
        </tbody>
      )
    },

    tr({ children, ...props }) {
      return (
        <tr className="border-b border-zinc-200 dark:border-zinc-700" {...props}>
          {children}
        </tr>
      )
    },

    th({ children, ...props }) {
      return (
        <th className="px-4 py-2 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider" {...props}>
          {children}
        </th>
      )
    },

    td({ children, ...props }) {
      return (
        <td className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300" {...props}>
          {children}
        </td>
      )
    },

    // Custom link renderer
    a({ children, href, ...props }) {
      return (
        <a
          href={href}
          className="text-blue-600 dark:text-blue-400 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      )
    },

    // Custom emphasis (italic) renderer
    em({ children, ...props }) {
      return (
        <em className="italic text-zinc-700 dark:text-zinc-300" {...props}>
          {children}
        </em>
      )
    },

    // Custom strong (bold) renderer
    strong({ children, ...props }) {
      return (
        <strong className="font-bold text-zinc-900 dark:text-zinc-100" {...props}>
          {children}
        </strong>
      )
    },

    // Custom horizontal rule renderer
    hr({ ...props }) {
      return (
        <hr className="my-6 border-t border-zinc-200 dark:border-zinc-700" {...props} />
      )
    }
  }

  return (
    <div className={`llm-reply prose prose-zinc dark:prose-invert prose-sm max-w-none ${className}`}>
      <style jsx>{`
        .llm-reply {
          font-family: 'Greatdesk', serif;
        }
        
        .llm-reply pre,
        .llm-reply code {
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
          font-style: normal;
        }
        
        .llm-reply h1,
        .llm-reply h2,
        .llm-reply h3,
        .llm-reply h4,
        .llm-reply h5,
        .llm-reply h6,
        .llm-reply p,
        .llm-reply ul,
        .llm-reply ol,
        .llm-reply li,
        .llm-reply blockquote {
          font-family: 'Greatdesk', serif;
        }
      `}</style>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
