"use client";

import React from "react";

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

export function FormattedMarkdown({ content, className = "" }: FormattedMarkdownProps) {
  if (!content) return null;

  // Split into lines
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let listType: "ul" | "ol" = "ul";

  const flushList = () => {
    if (currentList.length > 0) {
      const items = [...currentList];
      const isOrdered = listType === "ol";
      elements.push(
        isOrdered ? (
          <ol key={`ol-${elements.length}`} className="my-3 space-y-1.5 pl-4 list-decimal text-xs text-slate-700">
            {items.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInline(item)}
              </li>
            ))}
          </ol>
        ) : (
          <ul key={`ul-${elements.length}`} className="my-3 space-y-2">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0070ba] mt-1.5 shrink-0" />
                <span className="flex-1">{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        )
      );
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Blank line
    if (!trimmed) {
      flushList();
      continue;
    }

    // Horizontal Rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      flushList();
      elements.push(<hr key={`hr-${i}`} className="my-4 border-slate-200" />);
      continue;
    }

    // Heading 1
    if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={`h1-${i}`} className="text-xl sm:text-2xl font-black text-slate-900 pb-2 border-b border-slate-200 mt-5 mb-3 tracking-tight">
          {renderInline(trimmed.slice(2))}
        </h1>
      );
      continue;
    }

    // Heading 2
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="text-base sm:text-lg font-extrabold text-slate-900 mt-5 mb-2 pb-1 border-b border-slate-100 tracking-tight">
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      continue;
    }

    // Heading 3
    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="text-sm font-bold text-slate-900 mt-4 mb-1.5">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      continue;
    }

    // Unordered List item (- or *)
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      listType = "ul";
      currentList.push(trimmed.slice(2));
      continue;
    }

    // Ordered List item (e.g. 1. )
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (olMatch) {
      listType = "ol";
      currentList.push(olMatch[2]);
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="my-2.5 text-xs text-slate-700 leading-relaxed font-normal">
        {renderInline(rawLine)}
      </p>
    );
  }

  flushList();

  return (
    <div className={`prose-clean font-sans text-xs text-slate-800 ${className}`}>
      {elements}
    </div>
  );
}

// -------------------------------------------------------------
// Inline Markdown Tokenizer: bold, italics, code/badges
// -------------------------------------------------------------
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Regex tokenizer for `code`, **bold**, *italic*, [TAG]
  // Matches: `code`, **bold**, *italic*
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Inline code or badge: `...`
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      const codeContent = part.slice(1, -1);

      // Check if it's an acceptance test badge e.g. [RESPONSIVE_VIEWPORT], [HTTP_STATUS], etc.
      const isBadge = codeContent.startsWith("[") && codeContent.endsWith("]");
      const badgeText = isBadge ? codeContent.slice(1, -1) : codeContent;

      if (isBadge) {
        return (
          <span
            key={idx}
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border border-slate-300 bg-slate-100 text-slate-900 mr-1.5 align-middle"
          >
            {badgeText}
          </span>
        );
      }

      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] border border-slate-200 mx-0.5"
        >
          {codeContent}
        </code>
      );
    }

    // Bold text: **...**
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const boldContent = part.slice(2, -2);
      return (
        <strong key={idx} className="font-bold text-slate-900">
          {renderInline(boldContent)}
        </strong>
      );
    }

    // Italic text: *...*
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      const italicContent = part.slice(1, -1);
      return (
        <em key={idx} className="italic text-slate-800">
          {renderInline(italicContent)}
        </em>
      );
    }

    // Plain text
    return <span key={idx}>{part}</span>;
  });
}

