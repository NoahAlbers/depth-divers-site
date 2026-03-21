"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface PlayerContextType {
  // Real auth state
  currentPlayer: string | null;
  isDM: boolean;
  dmPassword: string | null;
  login: (name: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setDMAuth: (authenticated: boolean, password?: string) => void;

  // Impersonation
  isImpersonating: boolean;
  impersonatedPlayer: string | null;
  startImpersonating: (playerName: string) => void;
  stopImpersonating: () => void;

  // Effective values — use these in all UI and API calls
  effectivePlayer: string | null;
  effectiveIsDM: boolean;
}

const PlayerContext = createContext<PlayerContextType>({
  currentPlayer: null,
  isDM: false,
  dmPassword: null,
  login: async () => ({ success: false }),
  logout: () => {},
  setDMAuth: () => {},
  isImpersonating: false,
  impersonatedPlayer: null,
  startImpersonating: () => {},
  stopImpersonating: () => {},
  effectivePlayer: null,
  effectiveIsDM: false,
});

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);
  const [isDM, setIsDM] = useState(false);
  const [dmPassword, setDmPassword] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [impersonatedPlayer, setImpersonatedPlayer] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("dnd-player");
    if (stored) setCurrentPlayer(stored);
    const dmAuth = localStorage.getItem("dnd-dm-auth");
    if (dmAuth === "true") setIsDM(true);
    const storedDmPw = localStorage.getItem("dnd-dm-password");
    if (storedDmPw) setDmPassword(storedDmPw);

    // Restore impersonation from sessionStorage
    const storedImpersonate = sessionStorage.getItem("dnd-impersonate");
    if (storedImpersonate) setImpersonatedPlayer(storedImpersonate);
  }, []);

  const login = async (
    name: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error };
      }

      setCurrentPlayer(name);
      localStorage.setItem("dnd-player", name);

      if (data.isDM) {
        setIsDM(true);
        setDmPassword(password);
        localStorage.setItem("dnd-dm-auth", "true");
        localStorage.setItem("dnd-dm-password", password);
      }

      return { success: true };
    } catch {
      return { success: false, error: "Login failed" };
    }
  };

  const logout = () => {
    setCurrentPlayer(null);
    setIsDM(false);
    setDmPassword(null);
    setImpersonatedPlayer(null);
    localStorage.removeItem("dnd-player");
    localStorage.removeItem("dnd-dm-auth");
    localStorage.removeItem("dnd-dm-password");
    sessionStorage.removeItem("dnd-impersonate");
  };

  const setDMAuth = (authenticated: boolean, password?: string) => {
    setIsDM(authenticated);
    if (authenticated) {
      localStorage.setItem("dnd-dm-auth", "true");
      if (password) {
        setDmPassword(password);
        localStorage.setItem("dnd-dm-password", password);
      }
    } else {
      setIsDM(false);
      setDmPassword(null);
      localStorage.removeItem("dnd-dm-auth");
      localStorage.removeItem("dnd-dm-password");
    }
  };

  const startImpersonating = useCallback((playerName: string) => {
    setImpersonatedPlayer(playerName);
    sessionStorage.setItem("dnd-impersonate", playerName);
  }, []);

  const stopImpersonating = useCallback(() => {
    setImpersonatedPlayer(null);
    sessionStorage.removeItem("dnd-impersonate");
  }, []);

  const isImpersonating = isDM && impersonatedPlayer !== null;
  const effectivePlayer = isImpersonating
    ? impersonatedPlayer
    : isDM
      ? "Noah"
      : currentPlayer;
  const effectiveIsDM = isDM && !isImpersonating;

  if (!mounted) return null;

  return (
    <PlayerContext.Provider
      value={{
        currentPlayer,
        isDM,
        dmPassword,
        login,
        logout,
        setDMAuth,
        isImpersonating,
        impersonatedPlayer,
        startImpersonating,
        stopImpersonating,
        effectivePlayer,
        effectiveIsDM,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
