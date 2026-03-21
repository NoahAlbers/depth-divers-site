"use client";

import { useState, useEffect } from "react";

const DEFAULT_EMOJIS = ["👍", "👎", "😂", "😢", "❤️", "🔥"];

interface ReactionPickerProps {
  playerName: string;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function ReactionPicker({
  playerName,
  onSelect,
  onClose,
}: ReactionPickerProps) {
  const [quickEmojis, setQuickEmojis] = useState(DEFAULT_EMOJIS);

  // Load personalized emoji stats
  useEffect(() => {
    fetch(`/api/messages/emoji-stats?player=${playerName}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.topEmojis && data.topEmojis.length > 0) {
          // Merge with defaults: use top emojis first, fill remaining with defaults
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
    <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1 shadow-lg">
      {quickEmojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onSelect(emoji);
            onClose();
          }}
          className="min-h-[36px] min-w-[36px] rounded text-lg transition-transform hover:scale-125 hover:bg-surface-light active:scale-95"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
