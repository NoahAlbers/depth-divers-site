"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { POLL_INTERVAL_MS } from "./players";

interface UsePollingResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePolling<T>(url: string): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastUpdatedRef = useRef<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const updatedAt = json.lastUpdated || json.updatedAt;
      if (updatedAt && updatedAt === lastUpdatedRef.current) return;
      if (updatedAt) lastUpdatedRef.current = updatedAt;

      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fetch failed");
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchData();
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
