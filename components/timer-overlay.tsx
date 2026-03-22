"use client";

import { useState, useEffect, useCallback } from "react";
import { POLL_INTERVAL_MS } from "@/lib/players";

interface TimerData {
  id: string;
  label: string | null;
  duration: number;
  startedAt: string;
  pausedAt: string | null;
  remaining: number | null;
  dramatic: boolean;
  visible: boolean;
  status: string;
}

export function TimerOverlay() {
  const [timer, setTimer] = useState<TimerData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [displayTime, setDisplayTime] = useState(0);
  const [lastTimerId, setLastTimerId] = useState<string | null>(null);

  // Poll for active timer
  const fetchTimer = useCallback(async () => {
    try {
      const res = await fetch("/api/timers/active");
      if (res.ok) {
        const data = await res.json();
        if (data?.timer) {
          setTimer(data.timer);
          if (data.timer.id !== lastTimerId) {
            setLastTimerId(data.timer.id);
            setDismissed(false);
          }
        } else {
          setTimer(null);
        }
      }
    } catch {}
  }, [lastTimerId]);

  useEffect(() => {
    fetchTimer();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchTimer();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchTimer]);

  // Calculate remaining time client-side
  useEffect(() => {
    if (!timer) return;
    if (timer.status === "paused") {
      setDisplayTime(timer.remaining || 0);
      return;
    }
    if (timer.status !== "running") {
      setDisplayTime(0);
      return;
    }

    const update = () => {
      const elapsed = (Date.now() - new Date(timer.startedAt).getTime()) / 1000;
      const remaining = Math.max(0, timer.duration - elapsed);
      setDisplayTime(remaining);
    };

    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [timer]);

  if (!timer || !timer.visible) return null;

  const totalPercent = timer.duration > 0 ? displayTime / timer.duration : 0;
  const isWarning = totalPercent <= 0.25 && totalPercent > 0.1;
  const isCritical = totalPercent <= 0.1;
  const isExpired = displayTime <= 0 && timer.status === "running";

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const timeColor = isExpired
    ? "text-red-500"
    : isCritical
      ? "text-red-400"
      : isWarning
        ? "text-orange-400"
        : "text-gold";

  // Compact nav display when dismissed
  if (dismissed) {
    return (
      <button
        onClick={() => setDismissed(false)}
        className={`fixed top-1 right-20 z-[55] rounded-full px-3 py-1 text-xs font-bold ${
          isCritical || isExpired
            ? "animate-pulse bg-red-600/80 text-white"
            : "bg-surface border border-border text-gold"
        }`}
      >
        {isExpired ? "TIME'S UP" : `⏱ ${formatTime(displayTime)}`}
      </button>
    );
  }

  // Full overlay
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 text-center">
        {timer.label && (
          <p className="mb-2 font-cinzel text-sm text-gold">{timer.label}</p>
        )}
        <p
          className={`font-cinzel text-6xl font-bold ${timeColor} ${
            (isCritical || isExpired) && timer.dramatic ? "animate-pulse" : ""
          }`}
        >
          {isExpired ? "TIME'S UP" : formatTime(displayTime)}
        </p>
        {timer.status === "paused" && (
          <p className="mt-2 text-sm text-yellow-400">PAUSED</p>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="mt-4 rounded border border-gray-700 px-4 py-2 text-xs text-gray-400 hover:text-white"
        >
          Minimize
        </button>
      </div>
    </div>
  );
}
