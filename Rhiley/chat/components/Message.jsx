"use client"

import React, { useState } from "react"
import { cls } from "./utils"
import MarkdownRenderer from "./MarkdownRenderer"

const DESIGN_ANALYSIS_REGEX = /```design-analysis\n([\s\S]*?)\n```/g;

function parseMessageContent(content) {
  const parts = [];
  let lastIndex = 0;
  let match;

  const regex = /```design-analysis\n([\s\S]*?)\n```/g;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index)
      });
    }

    parts.push({
      type: 'design-analysis',
      content: match[1]
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex)
    });
  }

  return parts;
}

function renderMessageContent(content) {
  const parts = parseMessageContent(content);

  return parts.map((part, i) => {
    if (part.type === 'text') {
      return (
        <MarkdownRenderer key={i} content={part.content.trim()} className="text-sm" />
      );
    }

    if (part.type === 'design-analysis') {
      try {
        const analysis = JSON.parse(part.content);
        return (
          <div key={i} className="my-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            {/* Minimal inline replacement since DesignAnalysisBlock isn't explicitly provided */}
            <h4 className="font-bold text-xs uppercase mb-1 opacity-70">Design Analysis</h4>
            <div className="text-sm">
              <p><strong>Vibe:</strong> {analysis.vibe}</p>
              <p><strong>Aesthetic:</strong> {analysis.aesthetic}</p>
              <div className="flex gap-2 my-2">
                {Array.isArray(analysis.colors) && analysis.colors.map((c, j) => (
                  <div key={j} className="h-6 w-6 rounded-full" style={{ backgroundColor: c.hex }} title={c.description} />
                ))}
              </div>
              <p><strong>Typography:</strong> {analysis.typography}</p>
            </div>
            {/* Alternatively, if they DO have DesignAnalysisBlock imported, I would use that, but I dont see it imported. */}
          </div>
        );
      } catch (e) {
        console.error('Failed to parse design analysis:', e);
        return (
          <pre key={i} className="text-xs p-3 bg-[var(--surface)] bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-auto whitespace-pre-wrap">
            {part.content}
          </pre>
        );
      }
    }
  });
}

export default function Message({ role, children }) {
  const isUser = role === "user"

  // Safety check: ensure children is a string or valid React node
  const isString = typeof children === 'string';
  const content = isString ? children : children;

  return (
    <div className={cls("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-zinc-900 text-[10px] font-bold text-white dark:bg-white dark:text-zinc-900 shrink-0">
          R
        </div>
      )}
      <div
        className={cls(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm relative group",
          isUser
            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            : "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800",
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{content}</div>
        ) : (
          <div className="flex flex-col gap-1 w-full font-greatdesk">
            <div className="llm-reply w-full overflow-hidden mt-1 space-y-3">
              {isString
                ? renderMessageContent(content)
                : content}
              {typeof content === 'string' && false /* Custom rendering for Sandpack is handled internally by MarkdownRenderer or extracted out based on hasCode logic, but for now we'll rely on the parent or implement a basic check here if possible */}
            </div>
          </div>
        )}
      </div>
      {isUser && (
        <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-zinc-900 text-[10px] font-bold text-white dark:bg-white dark:text-zinc-900">
          JD
        </div>
      )}
    </div>
  )
}
