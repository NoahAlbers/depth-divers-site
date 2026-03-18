"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { PLAYERS, DM } from "./players";

interface PlayerContextType {
  currentPlayer: string | null;
  setCurrentPlayer: (name: string | null) => void;
  isDM: boolean;
  setDMAuth: (authenticated: boolean, password?: string) => void;
}

const PlayerContext = createContext<PlayerContextType>({
  currentPlayer: null,
  setCurrentPlayer: () => {},
  isDM: false,
  setDMAuth: () => {},
});

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentPlayer, setCurrentPlayerState] = useState<string | null>(null);
  const [isDM, setIsDM] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("dnd-player");
    if (stored) setCurrentPlayerState(stored);
    const dmAuth = localStorage.getItem("dnd-dm-auth");
    if (dmAuth === "true") setIsDM(true);
  }, []);

  const setCurrentPlayer = (name: string | null) => {
    setCurrentPlayerState(name);
    if (name) {
      localStorage.setItem("dnd-player", name);
    } else {
      localStorage.removeItem("dnd-player");
    }
  };

  const setDMAuth = (authenticated: boolean, password?: string) => {
    setIsDM(authenticated);
    if (authenticated) {
      localStorage.setItem("dnd-dm-auth", "true");
      if (password) localStorage.setItem("dnd-dm-password", password);
    } else {
      localStorage.removeItem("dnd-dm-auth");
      localStorage.removeItem("dnd-dm-password");
    }
  };

  if (!mounted) return null;

  return (
    <PlayerContext.Provider
      value={{ currentPlayer, setCurrentPlayer, isDM, setDMAuth }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
