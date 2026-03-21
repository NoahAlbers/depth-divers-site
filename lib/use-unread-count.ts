"use client";

import { usePolling } from "./polling";

interface ConversationWithUnread {
  id: string;
  unreadCount: number;
}

interface ConversationsResponse {
  conversations: ConversationWithUnread[];
  lastUpdated: string;
}

export function useUnreadCount(playerName: string | null) {
  const { data } = usePolling<ConversationsResponse>(
    playerName ? `/api/conversations?player=${playerName}` : ""
  );

  const totalUnread =
    data?.conversations?.reduce((sum, c) => sum + (c.unreadCount || 0), 0) ?? 0;

  return { totalUnread };
}
