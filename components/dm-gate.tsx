"use client";

import { usePlayer } from "@/lib/player-context";
import type { ReactNode } from "react";

export function DmGate({ children }: { children: ReactNode }) {
  const { isDM } = usePlayer();
  if (!isDM) return null;
  return <>{children}</>;
}
