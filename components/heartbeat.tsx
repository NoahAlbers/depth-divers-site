"use client";

import { useEffect } from "react";
import { usePlayer } from "@/lib/player-context";

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds

export function Heartbeat() {
  const { effectivePlayer } = usePlayer();

  useEffect(() => {
    if (!effectivePlayer) return;

    const sendHeartbeat = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: effectivePlayer }),
      }).catch(() => {});
    };

    sendHeartbeat(); // Send immediately on login
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, [effectivePlayer]);

  return null;
}
