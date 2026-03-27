"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { usePlayer } from "@/lib/player-context";
import { usePolling } from "@/lib/polling";
import { POLL_INTERVAL_MS } from "@/lib/players";
import { useMessageTray } from "@/lib/message-tray-context";
import { ChatInput } from "./chat-input";
import { getPlayerColor } from "@/lib/players";
import { UnreadBadge } from "./unread-badge";

interface ConversationItem {
  id: string;
  type: string;
  name: string | null;
  members: string[];
  lastMessage: { from: string; body: string; createdAt: string } | null;
  unreadCount: number;
}

interface TrayMessage {
  id: string;
  from: string;
  body: string;
  tag: string | null;
  imageUrl: string | null;
  createdAt: string;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function MessageTray() {
  const pathname = usePathname();
  const { effectivePlayer, currentPlayer } = usePlayer();
  const { isExpanded, setExpanded, activeConversationId, setActiveConversation } =
    useMessageTray();
  const [messages, setMessages] = useState<TrayMessage[]>([]);

  const playerName = effectivePlayer;

  // Hide on messages page and game pages
  const shouldHide =
    !currentPlayer ||
    pathname === "/messages" ||
    pathname.startsWith("/games/");

  // Poll conversations
  const { data: convosData } = usePolling<{ conversations: ConversationItem[] }>(
    playerName && !shouldHide ? `/api/conversations?player=${playerName}` : ""
  );

  const conversations = convosData?.conversations ?? [];
  const dmConversations = conversations.filter((c) => c.type === "dm");
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const activeConvo = conversations.find((c) => c.id === activeConversationId);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async () => {
    if (!activeConversationId || !playerName) return;
    try {
      const res = await fetch(
        `/api/conversations/${activeConversationId}/messages?player=${playerName}&limit=30`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {}
  }, [activeConversationId, playerName]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    fetchMessages();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchMessages();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [activeConversationId, fetchMessages]);

  const handleSend = async (body: string, tag: "IC" | "OOC" | null) => {
    if (!activeConversationId || !playerName) return;
    await fetch(`/api/conversations/${activeConversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: playerName, body, tag }),
    });
    fetchMessages();
  };

  const getDisplayName = (convo: ConversationItem) => {
    if (convo.type === "group") return convo.name || "Group";
    return convo.members.find((m) => m !== playerName) || "Unknown";
  };

  if (shouldHide) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100]">
      {/* Expanded panel */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/40"
          onClick={() => {
            setExpanded(false);
            setActiveConversation(null);
          }}
        />
      )}

      {isExpanded && (
        <div className="relative mx-auto max-w-lg rounded-t-xl border border-b-0 border-border bg-surface shadow-2xl"
          style={{ height: "60vh" }}
        >
          {/* Drag handle */}
          <div
            className="flex cursor-pointer items-center justify-center py-2"
            onClick={() => {
              setExpanded(false);
              setActiveConversation(null);
            }}
          >
            <div className="h-1 w-10 rounded-full bg-gray-600" />
          </div>

          {!activeConversationId ? (
            /* Conversation list */
            <div className="flex h-[calc(100%-40px)] flex-col">
              <div className="flex items-center justify-between px-4 pb-2">
                <span className="font-cinzel text-sm font-bold text-gold">Messages</span>
                <a
                  href="/messages"
                  className="text-xs text-gold hover:underline"
                >
                  Open full
                </a>
              </div>
              <div className="flex-1 overflow-y-auto">
                {dmConversations.map((convo) => {
                  const displayName = getDisplayName(convo);
                  const color = getPlayerColor(displayName);
                  return (
                    <button
                      key={convo.id}
                      onClick={() => setActiveConversation(convo.id)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-light"
                    >
                      <span
                        className="h-3 w-3 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="truncate text-sm font-bold" style={{ color }}>
                            {displayName}
                          </span>
                          {convo.lastMessage && (
                            <span className="ml-2 text-[10px] text-gray-500">
                              {relativeTime(convo.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        {convo.lastMessage && (
                          <p className="truncate text-xs text-gray-500">
                            {convo.lastMessage.from === playerName ? "You: " : ""}
                            {convo.lastMessage.body}
                          </p>
                        )}
                      </div>
                      {convo.unreadCount > 0 && (
                        <UnreadBadge count={convo.unreadCount} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Mini chat */
            <div className="flex h-[calc(100%-40px)] flex-col">
              <div className="flex items-center gap-2 border-b border-border px-4 pb-2">
                <button
                  onClick={() => setActiveConversation(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ←
                </button>
                <span
                  className="text-sm font-bold"
                  style={{ color: activeConvo ? getPlayerColor(getDisplayName(activeConvo)) : undefined }}
                >
                  {activeConvo ? getDisplayName(activeConvo) : "Chat"}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-2">
                {messages.map((msg) => {
                  const isOwn = msg.from === playerName;
                  return (
                    <div
                      key={msg.id}
                      className={`mb-2 flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-1.5 text-xs ${
                          isOwn
                            ? "bg-gold/15 text-gray-200"
                            : "bg-surface-light text-gray-300"
                        }`}
                      >
                        {!isOwn && (
                          <p
                            className="text-[10px] font-bold"
                            style={{ color: getPlayerColor(msg.from) }}
                          >
                            {msg.from}
                          </p>
                        )}
                        {msg.body && <p className="whitespace-pre-wrap">{msg.body}</p>}
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt=""
                            className="mt-1 max-h-32 rounded"
                            loading="lazy"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <ChatInput onSend={handleSend} playerName={playerName || undefined} />
            </div>
          )}
        </div>
      )}

      {/* Collapsed tab bar */}
      {!isExpanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mx-auto flex w-full max-w-lg items-center justify-center gap-2 rounded-t-lg border border-b-0 border-border bg-surface px-4 py-2.5 shadow-lg"
        >
          <span className="text-base">💬</span>
          <span className="text-xs font-bold text-gray-300">Messages</span>
          {totalUnread > 0 && <UnreadBadge count={totalUnread} />}
        </button>
      )}
    </div>
  );
}
