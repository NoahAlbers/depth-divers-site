import React from "react";

/**
 * Strip markdown syntax from text (for previews).
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^> ?/gm, "");
}

/**
 * Render markdown text as React elements.
 * Supports: **bold**, *italic*, ~~strikethrough~~, `code`, > blockquote
 * Safe by design — returns React elements, not raw HTML.
 */
export function renderMarkdown(
  content: React.ReactNode
): React.ReactNode {
  if (typeof content !== "string") {
    // If it's already React elements (e.g., from renderTextWithLinks), process each text child
    if (React.isValidElement(content)) return content;
    if (Array.isArray(content)) {
      return content.map((child, i) =>
        typeof child === "string" ? (
          <React.Fragment key={i}>{parseMarkdownString(child)}</React.Fragment>
        ) : (
          <React.Fragment key={i}>{child}</React.Fragment>
        )
      );
    }
    return content;
  }

  return parseMarkdownString(content);
}

function parseMarkdownString(text: string): React.ReactNode {
  // Process line by line for blockquotes
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (i > 0) result.push("\n");

    const line = lines[i];
    if (line.startsWith("> ") || line === ">") {
      const quoteText = line.replace(/^> ?/, "");
      result.push(
        <span
          key={`bq-${i}`}
          className="ml-2 border-l-2 border-gold/40 pl-2 text-gray-400 italic"
        >
          {parseInlineMarkdown(quoteText)}
        </span>
      );
    } else {
      result.push(...parseInlineMarkdown(line));
    }
  }

  return <>{result}</>;
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  // Combined regex for all inline patterns
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~|`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // **bold**
      result.push(
        <strong key={`b-${match.index}`} className="font-bold">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // *italic*
      result.push(
        <em key={`i-${match.index}`} className="italic">
          {match[3]}
        </em>
      );
    } else if (match[4]) {
      // ~~strikethrough~~
      result.push(
        <del key={`s-${match.index}`} className="line-through opacity-60">
          {match[4]}
        </del>
      );
    } else if (match[5]) {
      // `code`
      result.push(
        <code
          key={`c-${match.index}`}
          className="rounded bg-surface-light px-1 py-0.5 font-mono text-[0.9em] text-gold"
        >
          {match[5]}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last match
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  if (result.length === 0) result.push(text);

  return result;
}
