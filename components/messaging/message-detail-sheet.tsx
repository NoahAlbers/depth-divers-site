"use client";

import { useState, useRef } from "react";
import { getPlayerColor } from "@/lib/players";
import { ReactionPicker } from "./reaction-picker";
import { FullEmojiPicker } from "./full-emoji-picker";

interface Reaction {
  playerName: string;
  emoji: string;
  createdAt?: string;
}

interface MessageDetailSheetProps {
  message: {
    id: string;
    from: string;
    body: string;
    tag: string | null;
    createdAt: string;
    reactions?: Reaction[];
  };
  currentPlayer: string;
  conversationMembers: string[];
  readReceipts: Record<string, string>;
  onReact: (messageId: string, emoji: string) => void;
  onClose: () => void;
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MessageDetailSheet({
  message,
  currentPlayer,
  conversationMembers,
  readReceipts,
  onReact,
  onClose,
}: MessageDetailSheetProps) {
  const [dragY, setDragY] = useState(0);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    setDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) setDragY(delta);
  };

  const handleTouchEnd = () => {
    setDragging(false);
    if (dragY > 100) {
      onClose();
    }
    setDragY(0);
  };

  const msgTime = new Date(message.createdAt).getTime();
  const otherMembers = conversationMembers.filter((m) => m !== message.from);
  const readBy = otherMembers.filter((m) => {
    const readAt = readReceipts[m];
    return readAt && new Date(readAt).getTime() > msgTime;
  });
  const notReadBy = otherMembers.filter((m) => !readBy.includes(m));

  // Group reactions by emoji
  const reactionGroups: Record<string, Reaction[]> = {};
  for (const r of message.reactions || []) {
    if (!reactionGroups[r.emoji]) reactionGroups[r.emoji] = [];
    reactionGroups[r.emoji].push(r);
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-xl border-t border-border bg-surface"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: dragging ? "none" : "transform 0.3s ease",
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-2">
          <div className="h-1 w-10 rounded-full bg-gray-600" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center text-lg text-gray-500 hover:text-white"
        >
          ✕
        </button>

        <div className="max-h-[70vh] overflow-y-auto px-4 pb-4">
          {/* Message preview */}
          <div className="mb-3 rounded border border-border bg-background p-3">
            <span
              className="text-xs font-bold"
              style={{ color: getPlayerColor(message.from) }}
            >
              {message.from}
            </span>
            <p className="mt-1 text-sm text-gray-300">
              {message.body.length > 200
                ? message.body.slice(0, 200) + "..."
                : message.body}
            </p>
          </div>

          {/* Sent time */}
          <div className="mb-3">
            <p className="text-xs text-gray-500">
              Sent: {formatFullDate(message.createdAt)}
            </p>
          </div>

          {/* Read by */}
          <div className="mb-3">
            <p className="mb-1 text-xs font-bold text-gray-400">Read by</p>
            {readBy.length > 0 ? (
              <div className="flex flex-col gap-1">
                {readBy.map((name) => (
                  <p key={name} className="text-xs">
                    <span
                      className="font-bold"
                      style={{ color: getPlayerColor(name) }}
                    >
                      {name}
                    </span>
                    <span className="text-gray-600">
                      {" "}
                      — {formatTime(readReceipts[name])}
                    </span>
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600">No one yet</p>
            )}
            {notReadBy.length > 0 && (
              <p className="mt-1 text-[10px] text-gray-600">
                Not yet read by: {notReadBy.join(", ")}
              </p>
            )}
          </div>

          {/* Reactions detail */}
          {Object.keys(reactionGroups).length > 0 && (
            <div className="mb-3">
              <p className="mb-1 text-xs font-bold text-gray-400">Reactions</p>
              {Object.entries(reactionGroups).map(([emoji, reactors]) => (
                <p key={emoji} className="text-xs">
                  {emoji}{" "}
                  {reactors.map((r, i) => (
                    <span key={r.playerName}>
                      {i > 0 && ", "}
                      <span
                        className="font-bold"
                        style={{ color: getPlayerColor(r.playerName) }}
                      >
                        {r.playerName}
                      </span>
                      {r.createdAt && (
                        <span className="text-gray-600">
                          {" "}
                          ({formatTime(r.createdAt)})
                        </span>
                      )}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          )}

          {/* Add reaction */}
          <div className="mb-2">
            <p className="mb-1 text-xs font-bold text-gray-400">Add Reaction</p>
            {showFullPicker ? (
              <>
                <button
                  onClick={() => setShowFullPicker(false)}
                  className="mb-2 text-xs text-gray-500 hover:text-gray-300"
                >
                  ← Back
                </button>
                <FullEmojiPicker
                  onSelect={(emoji) => {
                    onReact(message.id, emoji);
                    onClose();
                  }}
                  onClose={() => setShowFullPicker(false)}
                />
              </>
            ) : (
              <ReactionPicker
                playerName={currentPlayer}
                onSelect={(emoji) => {
                  onReact(message.id, emoji);
                  onClose();
                }}
                onClose={onClose}
                onOpenFullPicker={() => setShowFullPicker(true)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
