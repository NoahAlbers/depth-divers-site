"use client";

import { usePlayer } from "@/lib/player-context";
import type { ReactNode } from "react";

export function DmGate({ children }: { children: ReactNode }) {
  const { effectiveIsDM } = usePlayer();
  if (!effectiveIsDM) return null;
  return <>{children}</>;
}
