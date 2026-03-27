"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface MessageTrayState {
  isExpanded: boolean;
  activeConversationId: string | null;
  setExpanded: (expanded: boolean) => void;
  setActiveConversation: (id: string | null) => void;
}

const MessageTrayContext = createContext<MessageTrayState>({
  isExpanded: false,
  activeConversationId: null,
  setExpanded: () => {},
  setActiveConversation: () => {},
});

export function MessageTrayProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setExpanded] = useState(false);
  const [activeConversationId, setActiveConversation] = useState<string | null>(null);

  return (
    <MessageTrayContext.Provider
      value={{ isExpanded, activeConversationId, setExpanded, setActiveConversation }}
    >
      {children}
    </MessageTrayContext.Provider>
  );
}

export function useMessageTray() {
  return useContext(MessageTrayContext);
}
