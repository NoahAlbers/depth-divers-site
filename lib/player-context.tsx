"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface PlayerContextType {
  currentPlayer: string | null;
  isDM: boolean;
  dmPassword: string | null;
  login: (name: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setDMAuth: (authenticated: boolean, password?: string) => void;
}

const PlayerContext = createContext<PlayerContextType>({
  currentPlayer: null,
  isDM: false,
  dmPassword: null,
  login: async () => ({ success: false }),
  logout: () => {},
  setDMAuth: () => {},
});

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);
  const [isDM, setIsDM] = useState(false);
  const [dmPassword, setDmPassword] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("dnd-player");
    if (stored) setCurrentPlayer(stored);
    const dmAuth = localStorage.getItem("dnd-dm-auth");
    if (dmAuth === "true") setIsDM(true);
    const storedDmPw = localStorage.getItem("dnd-dm-password");
    if (storedDmPw) setDmPassword(storedDmPw);
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
    localStorage.removeItem("dnd-player");
    localStorage.removeItem("dnd-dm-auth");
    localStorage.removeItem("dnd-dm-password");
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

  if (!mounted) return null;

  return (
    <PlayerContext.Provider
      value={{ currentPlayer, isDM, dmPassword, login, logout, setDMAuth }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
