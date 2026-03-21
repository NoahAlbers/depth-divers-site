"use client";

import { useState, useEffect } from "react";

const DEFAULT_EMOJIS = ["👍", "👎", "😂", "😢", "❤️", "🔥"];

interface ReactionPickerProps {
  playerName: string;
  onSelect: (emoji: string) => void;
  onClose: () => void;
  onOpenFullPicker?: () => void;
}

export function ReactionPicker({
  playerName,
  onSelect,
  onClose,
  onOpenFullPicker,
}: ReactionPickerProps) {
  const [quickEmojis, setQuickEmojis] = useState(DEFAULT_EMOJIS);

  useEffect(() => {
    fetch(`/api/messages/emoji-stats?player=${playerName}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.topEmojis && data.topEmojis.length > 0) {
          const merged = [...data.topEmojis];
          for (const emoji of DEFAULT_EMOJIS) {
            if (!merged.includes(emoji) && merged.length < 6) {
              merged.push(emoji);
            }
          }
          setQuickEmojis(merged.slice(0, 6));
        }
      })
      .catch(() => {});
  }, [playerName]);

  return (
    <div className="flex max-w-full items-center gap-1 overflow-hidden rounded-lg border border-border bg-surface p-1 shadow-lg">
      {/* Responsive: show 4 on tiny, 5 on small, 6 on normal */}
      {quickEmojis.map((emoji, i) => (
        <button
          key={emoji}
          onClick={() => {
            onSelect(emoji);
            onClose();
          }}
          className={`min-h-[36px] min-w-[36px] flex-shrink-0 rounded text-lg transition-transform hover:scale-125 hover:bg-surface-light active:scale-95 ${
            i >= 5 ? "hidden min-[480px]:inline-flex" : ""
          } ${
            i >= 4 ? "hidden min-[360px]:inline-flex" : ""
          }`}
        >
          {emoji}
        </button>
      ))}
      {onOpenFullPicker && (
        <button
          onClick={() => {
            onOpenFullPicker();
          }}
          className="min-h-[36px] min-w-[36px] flex-shrink-0 rounded text-sm text-gray-500 transition-colors hover:bg-surface-light hover:text-gray-300"
          title="More emojis"
        >
          +
        </button>
      )}
    </div>
  );
}
