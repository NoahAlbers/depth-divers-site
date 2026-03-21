"use client";

import { useState } from "react";
import { getPlayerColor, PLAYERS, DM } from "@/lib/players";
import { UnreadBadge } from "./unread-badge";

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

interface ConversationListProps {
  conversations: ConversationItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  currentPlayer: string;
  onCreateGroup: (name: string, members: string[]) => void;
}

function getDisplayName(convo: ConversationItem, viewer: string): string {
  if (convo.type === "group") return convo.name || "Group Chat";
  const other = convo.members.find((m) => m !== viewer);
  return other || "Unknown";
}

function getDisplayColor(convo: ConversationItem, viewer: string): string {
  if (convo.type === "group") return "#e5c07b";
  const other = convo.members.find((m) => m !== viewer);
  return other ? getPlayerColor(other) : "#888";
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  currentPlayer,
  onCreateGroup,
}: ConversationListProps) {
  const [tab, setTab] = useState<"friends" | "groups">("friends");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<Set<string>>(new Set());

  const dmConvos = conversations.filter((c) => c.type === "dm");
  const groupConvos = conversations.filter((c) => c.type === "group");
  const active = tab === "friends" ? dmConvos : groupConvos;

  const handleCreateGroup = () => {
    if (!groupName.trim() || groupMembers.size === 0) return;
    onCreateGroup(groupName.trim(), [...groupMembers]);
    setGroupName("");
    setGroupMembers(new Set());
    setShowCreateGroup(false);
  };

  const toggleMember = (name: string) => {
    const next = new Set(groupMembers);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setGroupMembers(next);
  };

  return (
    <div className="flex h-full flex-col border-r border-border bg-surface">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("friends")}
          className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${
            tab === "friends"
              ? "border-b-2 border-gold text-gold"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Friends
        </button>
        <button
          onClick={() => setTab("groups")}
          className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${
            tab === "groups"
              ? "border-b-2 border-gold text-gold"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Groups
        </button>
      </div>

      {/* Create group button */}
      {tab === "groups" && (
        <button
          onClick={() => setShowCreateGroup(!showCreateGroup)}
          className="mx-2 mt-2 rounded border border-gold/30 px-3 py-1.5 text-xs text-gold transition-colors hover:bg-gold/10"
        >
          + New Group
        </button>
      )}

      {/* Create group form */}
      {showCreateGroup && (
        <div className="mx-2 mt-2 rounded border border-border bg-background p-3">
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            className="mb-2 w-full rounded border border-gray-700 bg-surface px-2 py-1 text-sm text-white placeholder-gray-500"
          />
          <div className="mb-2 flex flex-wrap gap-1">
            {[...PLAYERS, DM].map((p) => {
              if (p.name === currentPlayer) return null;
              return (
                <button
                  key={p.name}
                  onClick={() => toggleMember(p.name)}
                  className={`rounded px-2 py-0.5 text-xs font-bold transition-all ${
                    groupMembers.has(p.name)
                      ? "ring-1 ring-white/30"
                      : "opacity-60"
                  }`}
                  style={{
                    color: p.color,
                    backgroundColor: groupMembers.has(p.name)
                      ? `${p.color}25`
                      : `${p.color}10`,
                  }}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || groupMembers.size === 0}
            className="w-full rounded bg-gold px-3 py-1 text-xs font-bold text-background disabled:opacity-50"
          >
            Create
          </button>
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {active.map((convo) => {
          const displayName = getDisplayName(convo, currentPlayer);
          const color = getDisplayColor(convo, currentPlayer);
          const isSelected = selectedId === convo.id;

          return (
            <button
              key={convo.id}
              onClick={() => onSelect(convo.id)}
              className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${
                isSelected
                  ? "bg-gold/10 border-l-2 border-gold"
                  : "hover:bg-surface-light border-l-2 border-transparent"
              }`}
            >
              {/* Color dot */}
              <div
                className="h-3 w-3 flex-shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className="truncate text-sm font-bold"
                    style={{ color }}
                  >
                    {displayName}
                  </span>
                  {convo.lastMessage && (
                    <span className="ml-2 flex-shrink-0 text-[10px] text-gray-500">
                      {relativeTime(convo.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                {convo.lastMessage && (
                  <p className="truncate text-xs text-gray-500">
                    <span className="text-gray-400">
                      {convo.lastMessage.from}:
                    </span>{" "}
                    {convo.lastMessage.body}
                  </p>
                )}
              </div>

              <UnreadBadge count={convo.unreadCount} />
            </button>
          );
        })}

        {active.length === 0 && (
          <p className="p-4 text-center text-sm text-gray-500">
            {tab === "friends"
              ? "No conversations yet"
              : "No groups yet. Create one!"}
          </p>
        )}
      </div>
    </div>
  );
}
