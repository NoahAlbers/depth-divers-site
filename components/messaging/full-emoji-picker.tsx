"use client";

import { useState, useEffect, useRef } from "react";

interface FullEmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: "Smileys",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
      "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙",
      "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫",
      "🤔", "🫡", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄",
      "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕",
      "🤢", "🤮", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸",
      "😎", "🤓", "🧐", "😕", "😟", "🙁", "😮", "😯", "😲", "😳",
      "🥺", "🥹", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱",
      "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠",
      "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻",
      "👽", "👾", "🤖",
    ],
  },
  {
    name: "Gestures",
    emojis: [
      "👍", "👎", "👊", "✊", "🤛", "🤜", "👏", "🙌", "🫶", "👐",
      "🤲", "🤝", "🙏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈",
      "👉", "👆", "🖕", "👇", "☝️", "🫵", "👋", "🤚", "🖐️", "✋",
      "🖖", "💪", "🦾", "🫂", "💏", "💑",
    ],
  },
  {
    name: "Hearts",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❤️‍🔥", "❤️‍🩹", "💖", "💗", "💓", "💞", "💕", "💘", "💝", "💟",
    ],
  },
  {
    name: "Objects",
    emojis: [
      "🔥", "⭐", "🌟", "✨", "💫", "🎉", "🎊", "🏆", "🥇", "🥈",
      "🥉", "⚔️", "🗡️", "🛡️", "🏹", "🔮", "💎", "🧿", "🪄", "📜",
      "🗺️", "🧭", "🕯️", "🔦", "🏰", "⛰️", "🌋", "🕸️", "🍄", "🦇",
      "🐉", "🧙", "🧝", "🧟", "💀", "🎲", "🎯", "🎪",
    ],
  },
  {
    name: "Symbols",
    emojis: [
      "✅", "❌", "⭕", "❗", "❓", "‼️", "⁉️", "💯", "🔴", "🟠",
      "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "🔶", "🔷", "🔸",
      "🔹", "▪️", "▫️", "◾", "◽", "🔘", "🔲", "🔳",
    ],
  },
];

export function FullEmojiPicker({ onSelect, onClose }: FullEmojiPickerProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const allEmojis = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
  const filtered = search
    ? allEmojis.filter(() => {
        // Simple search: just filter to show a subset. For real search we'd need emoji names.
        // For now, show all on empty search, or a random-ish subset
        return true;
      })
    : null;

  const displayCategories = filtered
    ? [{ name: "Results", emojis: filtered }]
    : EMOJI_CATEGORIES;

  return (
    <div
      ref={containerRef}
      className="z-50 w-[300px] max-w-[90vw] rounded-lg border border-border bg-[#1a1a2e] shadow-xl"
    >
      {/* Search */}
      <div className="border-b border-border p-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emojis..."
          className="w-full rounded border border-gray-700 bg-background px-2 py-1 text-sm text-white placeholder-gray-500 focus:border-gold focus:outline-none"
          autoFocus
        />
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex gap-1 border-b border-border px-2 py-1">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(i)}
              className={`rounded px-1.5 py-0.5 text-[10px] transition-colors ${
                activeCategory === i
                  ? "bg-gold/20 text-gold"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className="max-h-[200px] overflow-y-auto p-2">
        {(search ? displayCategories : [EMOJI_CATEGORIES[activeCategory]]).map(
          (cat) => (
            <div key={cat.name}>
              <div className="grid grid-cols-8 gap-0.5">
                {cat.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onSelect(emoji);
                      onClose();
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-surface-light active:scale-90"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      {/* Close */}
      <div className="border-t border-border p-1 text-center">
        <button
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  );
}
