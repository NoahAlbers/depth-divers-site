"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { usePlayer } from "@/lib/player-context";
import { PLAYERS, DM, getPlayerColor, POLL_INTERVAL_MS } from "@/lib/players";
import { PlayerChip } from "@/components/player-chip";
import { DmGate } from "@/components/dm-gate";

interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function MessagesPage() {
  const { currentPlayer, isDM } = usePlayer();
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipient, setRecipient] = useState<string>("DM");
  const [body, setBody] = useState("");
  const [dmFilter, setDmFilter] = useState<string | null>(null);

  const senderName = isDM ? "DM" : currentPlayer;

  const fetchMessages = useCallback(async () => {
    if (!senderName) return;
    const player = isDM ? "DM" : senderName;
    const headers: Record<string, string> = {};
    if (isDM) {
      headers["x-dm-password"] = localStorage.getItem("dnd-dm-password") || "noah";
    }
    try {
      const res = await fetch(`/api/messages?player=${player}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch {}
  }, [senderName, isDM]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchMessages();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const sendMessage = async () => {
    if (!body.trim() || !senderName) return;
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: senderName, to: recipient, body }),
    });
    setBody("");
    fetchMessages();
  };

  // Get available recipients
  const recipients = useMemo(() => {
    const others = PLAYERS.filter((p) => p.name !== currentPlayer).map(
      (p) => p.name
    );
    if (!isDM) {
      return [...others, "DM", "ALL"];
    }
    return [...PLAYERS.map((p) => p.name), "ALL"];
  }, [currentPlayer, isDM]);

  // Group conversations for DM view
  const conversationPairs = useMemo(() => {
    if (!isDM) return [];
    const pairs = new Map<string, Message[]>();
    messages.forEach((m) => {
      const key =
        m.to === "ALL"
          ? "Group"
          : [m.from, m.to].sort().join(" & ");
      if (!pairs.has(key)) pairs.set(key, []);
      pairs.get(key)!.push(m);
    });
    return Array.from(pairs.entries()).sort(
      (a, b) =>
        new Date(b[1][0].createdAt).getTime() -
        new Date(a[1][0].createdAt).getTime()
    );
  }, [messages, isDM]);

  // Filter messages for player view by current conversation
  const visibleMessages = useMemo(() => {
    if (isDM) {
      if (dmFilter) {
        return conversationPairs.find(([key]) => key === dmFilter)?.[1] ?? [];
      }
      return messages;
    }
    // Player view: show conversation with selected recipient
    return messages
      .filter((m) => {
        if (recipient === "ALL") return m.to === "ALL";
        return (
          (m.from === senderName && m.to === recipient) ||
          (m.from === recipient && m.to === senderName)
        );
      })
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }, [messages, isDM, recipient, senderName, dmFilter, conversationPairs]);

  if (!currentPlayer && !isDM) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">
          Select your character from the nav bar to use messaging.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-cinzel text-3xl font-bold text-gold">
        Secret Messages
      </h1>

      {/* DM God Mode Inbox */}
      {isDM && (
        <div className="mb-6">
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              onClick={() => setDmFilter(null)}
              className={`rounded px-3 py-1 text-xs font-bold transition-colors ${
                !dmFilter
                  ? "bg-gold text-background"
                  : "bg-surface text-gray-400 hover:text-white"
              }`}
            >
              All
            </button>
            {conversationPairs.map(([key, msgs]) => (
              <button
                key={key}
                onClick={() => setDmFilter(dmFilter === key ? null : key)}
                className={`rounded px-3 py-1 text-xs transition-colors ${
                  dmFilter === key
                    ? "bg-gold text-background font-bold"
                    : "bg-surface text-gray-400 hover:text-white"
                }`}
              >
                {key} ({msgs.length})
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Compose */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 font-cinzel text-sm font-bold text-gold">
            Send Message
          </h2>
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="mb-3 w-full rounded border border-gray-700 bg-background px-3 py-2 text-sm text-white"
          >
            {recipients.map((r) => (
              <option key={r} value={r}>
                {r === "ALL" ? "Everyone" : r}
              </option>
            ))}
          </select>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Write your message..."
            rows={3}
            className="mb-3 w-full resize-none rounded border border-gray-700 bg-background px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gold focus:outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!body.trim()}
            className="w-full rounded bg-gold px-4 py-2 text-sm font-bold text-background transition-colors hover:bg-[#f0d090] disabled:opacity-50"
          >
            Send
          </button>
        </div>

        {/* Messages */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 font-cinzel text-sm font-bold text-gold">
            {isDM
              ? dmFilter
                ? `Conversation: ${dmFilter}`
                : "All Messages"
              : `Conversation with ${recipient === "ALL" ? "Everyone" : recipient}`}
          </h2>
          <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
            {visibleMessages.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                No messages yet
              </p>
            ) : (
              visibleMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded px-3 py-2 ${
                    msg.from === senderName
                      ? "ml-8 bg-surface-light"
                      : "mr-8 bg-background"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <PlayerChip name={msg.from} />
                    {isDM && (
                      <span className="text-[10px] text-gray-500">
                        to{" "}
                        <span
                          style={{ color: getPlayerColor(msg.to) }}
                          className="font-bold"
                        >
                          {msg.to === "ALL" ? "Everyone" : msg.to}
                        </span>
                      </span>
                    )}
                    <span className="ml-auto text-[10px] text-gray-500">
                      {timeAgo(msg.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200">{msg.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
