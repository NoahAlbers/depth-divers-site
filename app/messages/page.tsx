"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { usePlayer } from "@/lib/player-context";
import { usePolling } from "@/lib/polling";
import { POLL_INTERVAL_MS } from "@/lib/players";
import { ConversationList } from "@/components/messaging/conversation-list";
import { ChatThread } from "@/components/messaging/chat-thread";
import { ChatInput } from "@/components/messaging/chat-input";
import { PinboardPanel } from "@/components/messaging/pinboard-panel";

function getConversationDisplayName(
  convo: { type: string; name: string | null; members: string[] },
  viewerName: string
): string {
  if (convo.type === "group") return convo.name || "Group Chat";
  const other = convo.members.find((m) => m !== viewerName);
  return other || "Unknown";
}

interface ConversationItem {
  id: string;
  type: string;
  name: string | null;
  members: string[];
  createdBy: string;
  lastMessage: {
    from: string;
    body: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

interface Message {
  id: string;
  from: string;
  body: string;
  tag: string | null;
  createdAt: string;
}

interface ConversationsResponse {
  conversations: ConversationItem[];
  lastUpdated: string;
}

interface MessagesResponse {
  messages: Message[];
  readReceipts: Record<string, string>;
  members: string[];
  lastUpdated: string;
}

export default function MessagesPage() {
  const { currentPlayer, effectivePlayer, effectiveIsDM } = usePlayer();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat" | "pinboard">(
    "list"
  );
  const [showPinboard, setShowPinboard] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [readReceipts, setReadReceipts] = useState<Record<string, string>>({});
  const [convoMembers, setConvoMembers] = useState<string[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);

  const playerName = effectivePlayer;

  // Handle URL params for deep-linking from DM feed
  useEffect(() => {
    const convoParam = searchParams.get("conversation");
    const msgParam = searchParams.get("message");
    if (convoParam) {
      setSelectedId(convoParam);
      setMobileView("chat");
      if (msgParam) {
        setHighlightMessageId(msgParam);
        // Clear highlight after 3 seconds
        setTimeout(() => setHighlightMessageId(null), 3000);
      }
    }
  }, [searchParams]);

  // Poll conversations list
  const { data: convosData, refetch: refetchConvos } =
    usePolling<ConversationsResponse>(
      playerName ? `/api/conversations?player=${playerName}` : ""
    );

  const conversations = convosData?.conversations ?? [];
  const selectedConvo = conversations.find((c) => c.id === selectedId);

  // Poll messages for selected conversation
  const fetchMessages = useCallback(async () => {
    if (!selectedId || !playerName) return;
    try {
      const res = await fetch(
        `/api/conversations/${selectedId}/messages?player=${playerName}`
      );
      if (res.ok) {
        const data: MessagesResponse = await res.json();
        setMessages(data.messages);
        setReadReceipts(data.readReceipts || {});
        setConvoMembers(data.members || []);
      }
    } catch {}
  }, [selectedId, playerName]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    setMessagesLoading(true);
    fetchMessages().then(() => setMessagesLoading(false));

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchMessages();
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [selectedId, fetchMessages]);

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    setMobileView("chat");
  };

  const handleBack = () => {
    setMobileView("list");
    setSelectedId(null);
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!playerName) return;
    await fetch("/api/messages/react", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, playerName, emoji }),
    });
    fetchMessages();
  };

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    if (!playerName) return;
    await fetch("/api/messages/react", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, playerName, emoji }),
    });
    fetchMessages();
  };

  const handleRequestGroupDeletion = async () => {
    if (!selectedId || !playerName || !selectedConvo) return;
    const groupName = selectedConvo.name || "this group";
    await fetch(`/api/conversations/${selectedId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: playerName,
        body: `⚠️ ${playerName} has requested deletion of group "${groupName}"`,
        tag: null,
      }),
    });
    fetchMessages();
    refetchConvos();
  };

  const handleSend = async (body: string, tag: "IC" | "OOC" | null) => {
    if (!selectedId || !playerName) return;

    await fetch(`/api/conversations/${selectedId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: playerName, body, tag }),
    });

    fetchMessages();
    refetchConvos();
  };

  const handleCreateGroup = async (name: string, members: string[]) => {
    if (!playerName) return;

    await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        members: [...members, playerName],
        createdBy: playerName,
      }),
    });

    refetchConvos();
  };

  const conversationDisplayName = selectedConvo
    ? getConversationDisplayName(selectedConvo, playerName || "")
    : "";

  if (!currentPlayer) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Log in to view messages.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col">
      {mobileView === "list" && (
        <h1 className="mb-2 px-0 font-cinzel text-3xl font-bold text-gold md:mb-0 md:hidden">
          Messages
        </h1>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
        {/* Left panel - conversation list */}
        <div
          className={`w-full flex-shrink-0 md:w-[280px] ${
            mobileView !== "list" ? "hidden md:block" : ""
          }`}
        >
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={handleSelectConversation}
            currentPlayer={playerName || ""}
            isDM={effectiveIsDM}
            onCreateGroup={handleCreateGroup}
          />
        </div>

        {/* Center panel - chat */}
        <div
          className={`flex min-w-0 flex-1 flex-col ${
            mobileView !== "chat" ? "hidden md:flex" : ""
          }`}
        >
          {selectedId && selectedConvo ? (
            <>
              <ChatThread
                messages={messages}
                currentPlayer={playerName || ""}
                conversationName={conversationDisplayName}
                readReceipts={readReceipts}
                conversationMembers={convoMembers}
                onReact={handleReact}
                onRemoveReaction={handleRemoveReaction}
                onRequestGroupDeletion={handleRequestGroupDeletion}
                isGroupChat={selectedConvo?.type === "group"}
                isDM={effectiveIsDM}
                highlightMessageId={highlightMessageId}
                onBack={handleBack}
                onTogglePinboard={() => {
                  setShowPinboard(!showPinboard);
                  // On small screens, show as overlay
                  if (window.innerWidth < 768) {
                    setMobileView("pinboard");
                  }
                }}
                showBackButton={true}
              />
              <ChatInput onSend={handleSend} disabled={messagesLoading} />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-gray-500">
                Select a conversation to start chatting
              </p>
            </div>
          )}
        </div>

        {/* Right panel - pinboard (desktop only) */}
        {showPinboard && selectedId && (
          <div className="hidden w-[240px] flex-shrink-0 md:block">
            <PinboardPanel
              conversationId={selectedId}
              currentPlayer={playerName || ""}
              onClose={() => setShowPinboard(false)}
            />
          </div>
        )}
      </div>

      {/* Pinboard overlay (mobile) */}
      {mobileView === "pinboard" && selectedId && (
        <PinboardPanel
          conversationId={selectedId}
          currentPlayer={playerName || ""}
          onClose={() => setMobileView("chat")}
          isOverlay
        />
      )}
    </div>
  );
}
