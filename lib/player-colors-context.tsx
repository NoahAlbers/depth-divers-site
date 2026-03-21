"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { getPlayerColor as getDefaultColor } from "./players";

interface PlayerColorsContextType {
  getColor: (name: string) => string;
  refreshColors: () => void;
}

const PlayerColorsContext = createContext<PlayerColorsContextType>({
  getColor: getDefaultColor,
  refreshColors: () => {},
});

export function PlayerColorsProvider({ children }: { children: ReactNode }) {
  const [customColors, setCustomColors] = useState<Map<string, string>>(
    new Map()
  );

  const fetchColors = useCallback(async () => {
    try {
      const res = await fetch("/api/players");
      if (res.ok) {
        const data = await res.json();
        const map = new Map<string, string>();
        for (const p of data.players) {
          if (p.color) map.set(p.name, p.color);
        }
        setCustomColors(map);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchColors();
  }, [fetchColors]);

  const getColor = useCallback(
    (name: string): string => {
      return customColors.get(name) || getDefaultColor(name);
    },
    [customColors]
  );

  return (
    <PlayerColorsContext.Provider value={{ getColor, refreshColors: fetchColors }}>
      {children}
    </PlayerColorsContext.Provider>
  );
}

export function usePlayerColors() {
  return useContext(PlayerColorsContext);
}
