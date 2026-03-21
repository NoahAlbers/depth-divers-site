"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getPlayerColor } from "@/lib/players";

interface PinboardPanelProps {
  conversationId: string;
  currentPlayer: string;
  onClose?: () => void;
  isOverlay?: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) + " at " + date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PinboardPanel({
  conversationId,
  currentPlayer,
  onClose,
  isOverlay,
}: PinboardPanelProps) {
  const [content, setContent] = useState("");
  const [updatedBy, setUpdatedBy] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastSavedRef = useRef("");
  const hasPendingEdits = useRef(false);

  const fetchPinboard = useCallback(async () => {
    // Don't overwrite local edits
    if (hasPendingEdits.current) return;

    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/pinboard?player=${currentPlayer}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.pinboard) {
          if (lastSavedRef.current === content || content === "") {
            setContent(data.pinboard.content);
            lastSavedRef.current = data.pinboard.content;
          }
          setUpdatedBy(data.pinboard.updatedBy);
          setUpdatedAt(data.pinboard.updatedAt);
        }
      }
    } catch {}
  }, [conversationId, currentPlayer, content]);

  // Fetch on mount + poll every 1 second
  useEffect(() => {
    fetchPinboard();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchPinboard();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const savePinboard = useCallback(
    async (newContent: string) => {
      setSaving(true);
      try {
        await fetch(`/api/conversations/${conversationId}/pinboard`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: newContent,
            updatedBy: currentPlayer,
          }),
        });
        lastSavedRef.current = newContent;
        hasPendingEdits.current = false;
        setUpdatedBy(currentPlayer);
        setUpdatedAt(new Date().toISOString());
      } catch {}
      setSaving(false);
    },
    [conversationId, currentPlayer]
  );

  const handleChange = (newContent: string) => {
    setContent(newContent);
    hasPendingEdits.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      savePinboard(newContent);
    }, 1000);
  };

  return (
    <div
      className={`flex h-full flex-col ${
        isOverlay
          ? "fixed inset-0 z-50 bg-black/60 p-4 md:relative md:inset-auto md:z-auto md:bg-transparent md:p-0"
          : "border-l border-border bg-surface"
      }`}
    >
      {isOverlay && (
        <div
          className="absolute inset-0 md:hidden"
          onClick={onClose}
        />
      )}
      <div
        className={`flex h-full flex-col ${
          isOverlay
            ? "relative mx-auto w-full max-w-md rounded-lg border border-border bg-surface md:max-w-none md:rounded-none md:border-0"
            : ""
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <h3 className="text-sm font-bold text-gold">Pinboard</h3>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-[10px] text-gray-500">Saving...</span>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Shared notes for this conversation..."
          className="flex-1 resize-none bg-transparent p-3 text-sm text-gray-300 placeholder-gray-600 focus:outline-none"
        />

        {/* Footer */}
        {updatedBy && (
          <div className="border-t border-border px-3 py-1 text-[10px] text-gray-600">
            Last edited by{" "}
            <span style={{ color: getPlayerColor(updatedBy) }}>
              {updatedBy}
            </span>
            {updatedAt && <> — {formatDate(updatedAt)}</>}
          </div>
        )}
      </div>
    </div>
  );
}
