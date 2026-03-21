"use client";

import { useState, useEffect, useRef } from "react";
import { getPlayerColor, getPlayerShort } from "@/lib/players";
import { ReactionPicker } from "./reaction-picker";
import { MessageDetailSheet } from "./message-detail-sheet";
import { FullEmojiPicker } from "./full-emoji-picker";
import { GroupSettings } from "./group-settings";

const CYCLING_EMOJIS = ["👍", "😂", "❤️", "🔥"];

function AnimatedReactionButton({ onClick }: { onClick: () => void }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % CYCLING_EMOJIS.length);
        setVisible(true);
      }, 200);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={onClick}
      className="ml-1 rounded px-1 py-0.5 text-xs transition-all hover:scale-125"
      title="Add reaction"
      style={{
        filter: "grayscale(100%)",
        opacity: visible ? 0.4 : 0,
        transition: "opacity 0.2s, filter 0.3s, transform 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.filter = "none";
        e.currentTarget.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = "grayscale(100%)";
        e.currentTarget.style.opacity = visible ? "0.4" : "0";
      }}
    >
      {CYCLING_EMOJIS[index]}
    </button>
  );
}

interface Reaction {
  playerName: string;
  emoji: string;
}

interface Message {
  id: string;
  from: string;
  body: string;
  tag: string | null;
  createdAt: string;
  reactions?: Reaction[];
}

interface ChatThreadProps {
  messages: Message[];
  currentPlayer: string;
  conversationName: string;
  readReceipts?: Record<string, string>;
  conversationMembers?: string[];
  onReact?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onRequestGroupDeletion?: () => void;
  onUpdateGroup?: (data: { name?: string; emoji?: string }) => void;
  onDeleteGroup?: () => void;
  conversationId?: string;
  conversationCreator?: string;
  conversationEmoji?: string | null;
  isGroupChat?: boolean;
  isDM?: boolean;
  highlightMessageId?: string | null;
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
  readReceipts = {},
  conversationMembers = [],
  onReact,
  onRemoveReaction,
  onDeleteMessage,
  onRequestGroupDeletion,
  onUpdateGroup,
  onDeleteGroup,
  conversationId,
  conversationCreator,
  conversationEmoji,
  isGroupChat,
  isDM: isDMProp,
  highlightMessageId,
  currentPlayer,
  conversationName,
  onBack,
  onTogglePinboard,
  showBackButton,
}: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(messages.length);
  const [pickerMessageId, setPickerMessageId] = useState<string | null>(null);
  const [fullPickerMessageId, setFullPickerMessageId] = useState<string | null>(null);
  const [showGroupSettings, setShowGroupSettings] = useState(false);

  // Hover tooltip (desktop)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Bottom sheet (mobile)
  const [sheetMessage, setSheetMessage] = useState<Message | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleMouseEnter = (msgId: string) => {
    hoverTimeoutRef.current = setTimeout(() => setHoveredMessageId(msgId), 500);
  };
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredMessageId(null);
  };
  const handleTouchStart = (msg: Message) => {
    longPressTimerRef.current = setTimeout(() => setSheetMessage(msg), 300);
  };
  const handleTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

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

  // Scroll to highlighted message
  useEffect(() => {
    if (highlightMessageId && scrollRef.current) {
      const el = scrollRef.current.querySelector(`[data-msg-id="${highlightMessageId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [highlightMessageId, messages]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
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
          {isGroupChat && onUpdateGroup && (
            <button
              onClick={() => setShowGroupSettings(true)}
              className="min-h-[44px] rounded px-2 text-gray-400 transition-colors hover:text-gold"
              title="Group settings"
            >
              ⚙️
            </button>
          )}
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
        {/* Group member chips */}
        {conversationMembers.length > 2 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {conversationMembers.slice(0, 4).map((name) => (
              <span
                key={name}
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{
                  color: getPlayerColor(name),
                  backgroundColor: `${getPlayerColor(name)}15`,
                  border: `1px solid ${getPlayerColor(name)}30`,
                }}
              >
                {getPlayerShort(name)}
              </span>
            ))}
            {conversationMembers.length > 4 && (
              <span className="rounded-full bg-surface-light px-2 py-0.5 text-[10px] text-gray-500">
                +{conversationMembers.length - 4} more
              </span>
            )}
          </div>
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
                  data-msg-id={msg.id}
                  className={`relative flex ${isOwn ? "justify-end" : "justify-start"} ${
                    highlightMessageId === msg.id
                      ? "animate-pulse rounded ring-2 ring-gold/50"
                      : ""
                  }`}
                  onMouseEnter={() => handleMouseEnter(msg.id)}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={() => handleTouchStart(msg)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                >
                  {/* Desktop hover tooltip */}
                  {hoveredMessageId === msg.id && (
                    <div
                      className={`pointer-events-none absolute z-50 hidden w-64 rounded-lg border border-border bg-[#1a1a2e] p-3 shadow-xl md:block ${
                        isOwn ? "right-0" : "left-0"
                      } bottom-full mb-2`}
                    >
                      <p className="mb-1 text-[10px] text-gray-400">
                        {new Date(msg.createdAt).toLocaleString("en-US", {
                          month: "long", day: "numeric", year: "numeric",
                          hour: "numeric", minute: "2-digit", second: "2-digit",
                        })}
                      </p>
                      {conversationMembers.length > 0 && (() => {
                        const msgTime = new Date(msg.createdAt).getTime();
                        const others = conversationMembers.filter((m) => m !== msg.from);
                        const readers = others.filter((m) => {
                          const t = readReceipts[m];
                          return t && new Date(t).getTime() > msgTime;
                        });
                        const unread = others.filter((m) => !readers.includes(m));
                        return (
                          <div className="mb-1">
                            {readers.map((name) => (
                              <p key={name} className="text-[10px]">
                                <span style={{ color: getPlayerColor(name) }} className="font-bold">{name}</span>
                                <span className="text-gray-600"> — {new Date(readReceipts[name]).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                              </p>
                            ))}
                            {unread.length > 0 && (
                              <p className="text-[10px] text-gray-600">Not read by: {unread.join(", ")}</p>
                            )}
                          </div>
                        );
                      })()}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="border-t border-gray-700 pt-1">
                          {msg.reactions.map((r, i) => (
                            <span key={i} className="text-[10px]">
                              {r.emoji}{" "}
                              <span style={{ color: getPlayerColor(r.playerName) }} className="font-bold">{r.playerName}</span>
                              {i < msg.reactions!.length - 1 && ", "}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
                      className={`whitespace-pre-wrap break-words text-sm ${
                        msg.tag === "IC"
                          ? "font-cinzel text-gray-200"
                          : "text-gray-300"
                      }`}
                    >
                      {msg.body}
                    </p>

                    {/* Reactions display */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(() => {
                          // Group reactions by emoji
                          const grouped: Record<string, string[]> = {};
                          for (const r of msg.reactions) {
                            if (!grouped[r.emoji]) grouped[r.emoji] = [];
                            grouped[r.emoji].push(r.playerName);
                          }
                          return Object.entries(grouped).map(([emoji, players]) => {
                            const hasReacted = players.includes(currentPlayer);
                            return (
                              <button
                                key={emoji}
                                onClick={() => {
                                  if (hasReacted) {
                                    onRemoveReaction?.(msg.id, emoji);
                                  } else {
                                    onReact?.(msg.id, emoji);
                                  }
                                }}
                                className={`flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors ${
                                  hasReacted
                                    ? "border-gold/40 bg-gold/10"
                                    : "border-border bg-surface-light hover:border-gray-500"
                                }`}
                                title={players.map((p) => p).join(", ")}
                              >
                                <span>{emoji}</span>
                                {players.length > 1 && (
                                  <span className="text-[10px] text-gray-400">
                                    {players.length}
                                  </span>
                                )}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    )}

                    {/* Timestamp + Read receipt */}
                    <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-gray-600">
                      {isOwn && (() => {
                        const msgTime = new Date(msg.createdAt).getTime();
                        const otherMembers = conversationMembers.filter(
                          (m) => m !== currentPlayer
                        );
                        const readBy = otherMembers.filter((m) => {
                          const readAt = readReceipts[m];
                          return readAt && new Date(readAt).getTime() > msgTime;
                        });

                        if (otherMembers.length <= 2) {
                          // DM: simple sent/read
                          return readBy.length > 0 ? (
                            <span className="text-green-500/70">✓✓ Read</span>
                          ) : (
                            <span>✓ Sent</span>
                          );
                        } else {
                          // Group: show who read
                          return readBy.length > 0 ? (
                            <span className="text-green-500/70">
                              Read by {readBy.length}/{otherMembers.length}
                            </span>
                          ) : (
                            <span>✓ Sent</span>
                          );
                        }
                      })()}
                      <span>{relativeTime(msg.createdAt)}</span>
                      {onReact && (
                        <AnimatedReactionButton
                          onClick={() =>
                            setPickerMessageId(
                              pickerMessageId === msg.id ? null : msg.id
                            )
                          }
                        />
                      )}
                      {isDMProp && onDeleteMessage && (
                        <button
                          onClick={() => {
                            if (confirm("Delete this message? This cannot be undone.")) {
                              onDeleteMessage(msg.id);
                            }
                          }}
                          className="ml-1 rounded px-1 py-0.5 text-[10px] text-red-400/40 transition-all hover:text-red-400"
                          title="Delete message"
                        >
                          🗑️
                        </button>
                      )}
                    </div>

                    {/* Reaction picker */}
                    {pickerMessageId === msg.id && onReact && (
                      <div className="mt-1">
                        <ReactionPicker
                          playerName={currentPlayer}
                          onSelect={(emoji) => onReact(msg.id, emoji)}
                          onClose={() => setPickerMessageId(null)}
                          onOpenFullPicker={() => {
                            setPickerMessageId(null);
                            setFullPickerMessageId(msg.id);
                          }}
                        />
                      </div>
                    )}
                    {/* Full emoji picker */}
                    {fullPickerMessageId === msg.id && onReact && (
                      <div className="mt-1">
                        <FullEmojiPicker
                          onSelect={(emoji) => onReact(msg.id, emoji)}
                          onClose={() => setFullPickerMessageId(null)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {sheetMessage && onReact && (
        <MessageDetailSheet
          message={sheetMessage}
          currentPlayer={currentPlayer}
          conversationMembers={conversationMembers}
          readReceipts={readReceipts}
          onReact={onReact}
          onClose={() => setSheetMessage(null)}
        />
      )}

      {/* Group settings modal */}
      {showGroupSettings && isGroupChat && conversationId && onUpdateGroup && (
        <GroupSettings
          conversationId={conversationId}
          name={conversationName}
          emoji={conversationEmoji || null}
          members={conversationMembers}
          createdBy={conversationCreator || ""}
          currentPlayer={currentPlayer}
          isDM={isDMProp || false}
          onUpdateGroup={onUpdateGroup}
          onRequestDeletion={() => {
            onRequestGroupDeletion?.();
            setShowGroupSettings(false);
          }}
          onDeleteGroup={() => {
            onDeleteGroup?.();
            setShowGroupSettings(false);
          }}
          onClose={() => setShowGroupSettings(false)}
        />
      )}
    </div>
  );
}
