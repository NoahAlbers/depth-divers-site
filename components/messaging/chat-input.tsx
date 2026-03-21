"use client";

import { useState, useRef, useCallback } from "react";

interface ChatInputProps {
  onSend: (body: string, tag: "IC" | "OOC" | null) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const [tag, setTag] = useState<"IC" | "OOC" | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (!text.trim() || disabled) return;
    onSend(text.trim(), tag);
    setText("");
    textareaRef.current?.focus();
  }, [text, tag, onSend, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleTag = (newTag: "IC" | "OOC") => {
    setTag(tag === newTag ? null : newTag);
  };

  return (
    <div className="border-t border-border bg-surface p-3" style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}>
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className="max-h-[100px] min-h-[44px] w-full resize-none rounded border border-gray-700 bg-background px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gold focus:outline-none disabled:opacity-50"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleTag("IC")}
              className={`rounded px-2 py-1 text-xs font-bold transition-colors ${
                tag === "IC"
                  ? "bg-purple-600/30 text-purple-300 ring-1 ring-purple-500/50"
                  : "bg-surface-light text-gray-500 hover:text-gray-300"
              }`}
            >
              IC
            </button>
            <button
              onClick={() => toggleTag("OOC")}
              className={`rounded px-2 py-1 text-xs font-bold transition-colors ${
                tag === "OOC"
                  ? "bg-blue-600/30 text-blue-300 ring-1 ring-blue-500/50"
                  : "bg-surface-light text-gray-500 hover:text-gray-300"
              }`}
            >
              OOC
            </button>
            {tag && (
              <span className="text-[10px] text-gray-500">
                {tag === "IC" ? "In Character" : "Out of Character"}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="min-h-[44px] min-w-[44px] rounded bg-gold px-4 py-2 text-sm font-bold text-background transition-colors hover:bg-[#f0d090] disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
