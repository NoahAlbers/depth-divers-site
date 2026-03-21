"use client";

import { useState } from "react";
import { getPlayerColor, PLAYERS, DM } from "@/lib/players";
import { UnreadBadge } from "./unread-badge";

const ALL_CHARACTERS = [...PLAYERS, DM];

interface ConversationItem {
  id: string;
  type: string;
  name: string | null;
  emoji: string | null;
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
  isDM: boolean;
  onCreateGroup: (name: string, members: string[]) => void;
  onDeleteGroup?: (conversationId: string) => void;
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

function ConvoRow({
  convo,
  displayName,
  color,
  isSelected,
  onSelect,
  onDelete,
}: {
  convo: ConversationItem;
  displayName: string;
  color: string;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`group flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${
        isSelected
          ? "bg-gold/10 border-l-2 border-gold"
          : "hover:bg-surface-light border-l-2 border-transparent"
      }`}
    >
      {convo.type === "group" ? (
        <span className="flex-shrink-0 text-sm">{convo.emoji || "👥"}</span>
      ) : (
        <div
          className="h-3 w-3 flex-shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm font-bold" style={{ color }}>
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
            <span className="text-gray-400">{convo.lastMessage.from}:</span>{" "}
            {convo.lastMessage.body}
          </p>
        )}
      </div>
      <UnreadBadge count={convo.unreadCount} />
      {onDelete && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete "${displayName}"? All messages will be permanently deleted.`)) {
              onDelete();
            }
          }}
          className="hidden flex-shrink-0 text-[10px] text-red-400/40 hover:text-red-400 group-hover:inline"
          title="Delete group"
        >
          🗑️
        </span>
      )}
    </button>
  );
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  currentPlayer,
  isDM,
  onCreateGroup,
  onDeleteGroup,
}: ConversationListProps) {
  const dmTabs = isDM
    ? (["my-chats", "player-chats", "groups"] as const)
    : (["friends", "groups"] as const);
  type TabType = (typeof dmTabs)[number];

  const [tab, setTab] = useState<TabType>(dmTabs[0]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<Set<string>>(new Set());

  const dmConvos = conversations.filter((c) => c.type === "dm");
  const groupConvos = conversations.filter((c) => c.type === "group");

  // For DM: split DM convos into "my chats" (Noah is member) and "player chats" (Noah is NOT member)
  const myDmConvos = dmConvos.filter((c) => c.members.includes("Noah"));
  const playerToPlayerConvos = dmConvos.filter((c) => !c.members.includes("Noah"));

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

  const switchTab = (newTab: TabType) => {
    setTab(newTab);
    setShowCreateGroup(false);
    setGroupName("");
    setGroupMembers(new Set());
  };

  // Get the display name for a DM conversation from the other person's perspective
  function getDmDisplayName(convo: ConversationItem): string {
    if (isDM && !convo.members.includes("Noah")) {
      // Player-to-player: show both names
      return convo.members.join(" \u2194 ");
    }
    const other = convo.members.find((m) => m !== currentPlayer);
    return other || "Unknown";
  }

  function getDmDisplayColor(convo: ConversationItem): string {
    if (isDM && !convo.members.includes("Noah")) {
      return "#888"; // neutral for player-to-player
    }
    const other = convo.members.find((m) => m !== currentPlayer);
    return other ? getPlayerColor(other) : "#888";
  }

  // For the Friends tab (non-DM): show all characters except self, sorted by last message
  function renderFriendsTab() {
    const others = ALL_CHARACTERS.filter((c) => c.name !== currentPlayer);

    // Sort by last message time
    const sorted = [...others].sort((a, b) => {
      const convoA = dmConvos.find((c) => c.members.includes(a.name));
      const convoB = dmConvos.find((c) => c.members.includes(b.name));
      const timeA = convoA?.lastMessage ? new Date(convoA.lastMessage.createdAt).getTime() : 0;
      const timeB = convoB?.lastMessage ? new Date(convoB.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return sorted.map((char) => {
      // Find the DM conversation for this pair
      const convo = dmConvos.find((c) => c.members.includes(char.name));
      const isSelected = convo ? selectedId === convo.id : false;

      if (convo) {
        return (
          <ConvoRow
            key={convo.id}
            convo={convo}
            displayName={char.name}
            color={char.color}
            isSelected={isSelected}
            onSelect={() => onSelect(convo.id)}
          />
        );
      }

      // No conversation yet — show grayed entry (shouldn't happen with ensureConversations)
      return (
        <div
          key={char.name}
          className="flex items-center gap-3 px-3 py-3 opacity-50"
        >
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: char.color }}
          />
          <span className="text-sm" style={{ color: char.color }}>
            {char.name}
          </span>
        </div>
      );
    });
  }

  // Render conversation rows for a list of convos, sorted by last message
  function renderConvoList(convos: ConversationItem[]) {
    if (convos.length === 0) {
      return (
        <p className="p-4 text-center text-sm text-gray-500">
          No conversations
        </p>
      );
    }

    const sorted = [...convos].sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    return sorted.map((convo) => {
      const displayName =
        convo.type === "group"
          ? convo.name || "Group Chat"
          : getDmDisplayName(convo);
      const color =
        convo.type === "group" ? "#e5c07b" : getDmDisplayColor(convo);

      return (
        <ConvoRow
          key={convo.id}
          convo={convo}
          displayName={displayName}
          color={color}
          isSelected={selectedId === convo.id}
          onSelect={() => onSelect(convo.id)}
          onDelete={isDM && convo.type === "group" && onDeleteGroup ? () => onDeleteGroup(convo.id) : undefined}
        />
      );
    });
  }

  const tabLabels: Record<string, string> = {
    friends: "Friends",
    groups: "Groups",
    "my-chats": "My Chats",
    "player-chats": "Player Chats",
  };

  return (
    <div className="flex h-full flex-col border-r border-border bg-surface">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {dmTabs.map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`flex-1 px-2 py-2 text-xs font-bold transition-colors ${
              tab === t
                ? "border-b-2 border-gold text-gold"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tabLabels[t]}
          </button>
        ))}
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
      {showCreateGroup && tab === "groups" && (
        <div className="mx-2 mt-2 rounded border border-border bg-background p-3">
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            className="mb-2 w-full rounded border border-gray-700 bg-surface px-2 py-1 text-sm text-white placeholder-gray-500"
          />
          <div className="mb-2 flex flex-wrap gap-1">
            {ALL_CHARACTERS.map((p) => {
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
        {/* Non-DM: Friends tab */}
        {tab === "friends" && renderFriendsTab()}

        {/* DM: My Chats tab */}
        {tab === "my-chats" && renderConvoList([...myDmConvos, ...groupConvos.filter((c) => c.members.includes("Noah"))])}

        {/* DM: Player Chats (god mode) tab */}
        {tab === "player-chats" && (
          <>
            {playerToPlayerConvos.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">
                No player-to-player conversations yet
              </p>
            ) : (
              <>
                <p className="px-3 pt-2 text-[10px] text-gray-600">
                  Eavesdropping on player conversations
                </p>
                {renderConvoList(playerToPlayerConvos)}
              </>
            )}
          </>
        )}

        {/* Groups tab (both DM and player) */}
        {tab === "groups" && renderConvoList(groupConvos)}
      </div>
    </div>
  );
}
