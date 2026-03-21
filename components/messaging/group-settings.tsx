"use client";

import { useState } from "react";
import { getPlayerColor } from "@/lib/players";
import { FullEmojiPicker } from "./full-emoji-picker";

interface GroupSettingsProps {
  conversationId: string;
  name: string;
  emoji: string | null;
  members: string[];
  createdBy: string;
  currentPlayer: string;
  isDM: boolean;
  onUpdateGroup: (data: { name?: string; emoji?: string }) => void;
  onRequestDeletion: () => void;
  onDeleteGroup: () => void;
  onClose: () => void;
}

export function GroupSettings({
  name: initialName,
  emoji: initialEmoji,
  members,
  createdBy,
  currentPlayer,
  isDM,
  onUpdateGroup,
  onRequestDeletion,
  onDeleteGroup,
  onClose,
}: GroupSettingsProps) {
  const [name, setName] = useState(initialName);
  const [nameError, setNameError] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRequest, setConfirmRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleSaveName = () => {
    if (!name.trim()) {
      setNameError("Name cannot be empty");
      return;
    }
    if (name.length > 50) {
      setNameError("Name must be 50 characters or less");
      return;
    }
    setNameError("");
    onUpdateGroup({ name: name.trim() });
  };

  const handleEmojiSelect = (emoji: string) => {
    setShowEmojiPicker(false);
    onUpdateGroup({ emoji });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-lg border border-border bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-cinzel text-lg font-bold text-gold">
            Group Settings
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Emoji */}
        <div className="mb-4">
          <p className="mb-1 text-xs font-bold text-gray-400">Group Emoji</p>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-background text-3xl transition-colors hover:border-gold"
          >
            {initialEmoji || "👥"}
          </button>
          {showEmojiPicker && (
            <div className="mt-2">
              <FullEmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          )}
        </div>

        {/* Name */}
        <div className="mb-4">
          <p className="mb-1 text-xs font-bold text-gray-400">Group Name</p>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="flex-1 rounded border border-gray-700 bg-background px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
            />
            <button
              onClick={handleSaveName}
              disabled={name.trim() === initialName}
              className="rounded bg-gold px-3 py-2 text-xs font-bold text-background disabled:opacity-50"
            >
              Save
            </button>
          </div>
          {nameError && (
            <p className="mt-1 text-xs text-red-400">{nameError}</p>
          )}
          <p className="mt-1 text-[10px] text-gray-600">
            {name.length}/50 characters
          </p>
        </div>

        {/* Members */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-bold text-gray-400">Members</p>
          <div className="flex flex-col gap-1">
            {members.map((member) => (
              <div key={member} className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: getPlayerColor(member) }}
                />
                <span
                  className="text-sm font-bold"
                  style={{ color: getPlayerColor(member) }}
                >
                  {member}
                </span>
                {member === createdBy && (
                  <span className="text-[10px] text-gray-600">(creator)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="border-t border-gray-700 pt-4">
          {/* Request deletion (players only) */}
          {!isDM && (
            <>
              {confirmRequest ? (
                <div className="mb-3 rounded border border-yellow-500/30 bg-yellow-500/5 p-3">
                  <p className="mb-2 text-xs text-yellow-400">
                    Request deletion of &quot;{initialName}&quot;? The DM will be
                    notified.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmRequest(false)}
                      className="rounded border border-gray-600 px-3 py-1 text-xs text-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onRequestDeletion();
                        setConfirmRequest(false);
                        setRequestSent(true);
                      }}
                      className="rounded bg-yellow-600/80 px-3 py-1 text-xs font-bold text-white"
                    >
                      Request Deletion
                    </button>
                  </div>
                </div>
              ) : requestSent ? (
                <p className="mb-3 text-xs text-green-400">
                  Deletion request sent to the DM.
                </p>
              ) : (
                <button
                  onClick={() => setConfirmRequest(true)}
                  className="mb-3 w-full rounded border border-yellow-500/30 px-3 py-2 text-xs text-yellow-400 hover:bg-yellow-500/10"
                >
                  Request Deletion
                </button>
              )}
            </>
          )}

          {/* Delete group (DM only) */}
          {isDM && (
            <>
              {confirmDelete ? (
                <div className="rounded border border-red-500/30 bg-red-500/5 p-3">
                  <p className="mb-2 text-xs text-red-400">
                    Delete &quot;{initialName}&quot;? All messages will be
                    permanently deleted.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="rounded border border-gray-600 px-3 py-1 text-xs text-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onDeleteGroup}
                      className="rounded bg-red-600 px-3 py-1 text-xs font-bold text-white"
                    >
                      Delete Group
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full rounded border border-red-500/30 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                >
                  Delete Group
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
