"use client";

import { useEffect, useRef } from "react";
import { getPlayerColor } from "@/lib/players";

interface Message {
  id: string;
  from: string;
  body: string;
  tag: string | null;
  createdAt: string;
}

interface ChatThreadProps {
  messages: Message[];
  currentPlayer: string;
  conversationName: string;
  onBack?: () => void;
  onTogglePinboard?: () => void;
  showBackButton?: boolean;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ChatThread({
  messages,
  currentPlayer,
  conversationName,
  onBack,
  onTogglePinboard,
  showBackButton,
}: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(messages.length);

  useEffect(() => {
    // Auto-scroll on new messages
    if (messages.length > prevCountRef.current || prevCountRef.current === 0) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: messages.length === prevCountRef.current ? "instant" : "smooth",
      });
    }
    prevCountRef.current = messages.length;
  }, [messages.length]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
        {showBackButton && onBack && (
          <button
            onClick={onBack}
            className="min-h-[44px] min-w-[44px] rounded text-gray-400 transition-colors hover:text-white"
          >
            &#8592;
          </button>
        )}
        <h2 className="flex-1 font-cinzel text-lg font-bold text-gold">
          {conversationName}
        </h2>
        {onTogglePinboard && (
          <button
            onClick={onTogglePinboard}
            className="min-h-[44px] min-w-[44px] rounded px-2 text-gray-400 transition-colors hover:text-gold"
            title="Pinboard"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            No messages yet. Say something!
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((msg) => {
              const isOwn = msg.from === currentPlayer;
              const color = getPlayerColor(msg.from);

              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      isOwn
                        ? "bg-gold/15 border border-gold/20"
                        : "bg-surface border border-border"
                    } ${
                      msg.tag === "IC"
                        ? "border-l-2 border-l-purple-500/50"
                        : msg.tag === "OOC"
                          ? "border-l-2 border-l-blue-500/50"
                          : ""
                    }`}
                  >
                    {/* Sender + tag */}
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className="text-xs font-bold"
                        style={{ color }}
                      >
                        {msg.from}
                      </span>
                      {msg.tag === "IC" && (
                        <span className="rounded bg-purple-600/30 px-1 py-0.5 text-[9px] font-bold text-purple-300">
                          IC
                        </span>
                      )}
                      {msg.tag === "OOC" && (
                        <span className="rounded bg-blue-600/30 px-1 py-0.5 text-[9px] font-bold text-blue-300">
                          OOC
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <p
                      className={`whitespace-pre-wrap text-sm ${
                        msg.tag === "IC"
                          ? "font-cinzel text-gray-200"
                          : "text-gray-300"
                      }`}
                    >
                      {msg.body}
                    </p>

                    {/* Timestamp */}
                    <p className="mt-1 text-right text-[10px] text-gray-600">
                      {relativeTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
