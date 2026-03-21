"use client";

import { useState, useEffect, useCallback } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePush(playerName: string | null) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    setIsSupported(supported);

    if (supported && playerName) {
      // Check existing subscription
      navigator.serviceWorker.ready.then(async (registration) => {
        const sub = await registration.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      }).catch(() => {});
    }
  }, [playerName]);

  const subscribe = useCallback(async () => {
    if (!playerName || !isSupported || loading) return;
    setLoading(true);

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Get VAPID public key
      const vapidRes = await fetch("/api/push/vapid");
      const { publicKey } = await vapidRes.json();
      if (!publicKey) throw new Error("No VAPID key");

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
      });

      // Save to server
      const sub = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName,
          subscription: {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
        }),
      });

      setIsSubscribed(true);
      localStorage.setItem("push-subscribed", "true");
    } catch (err) {
      console.error("Push subscribe error:", err);
    } finally {
      setLoading(false);
    }
  }, [playerName, isSupported, loading]);

  const unsubscribe = useCallback(async () => {
    if (!playerName || loading) return;
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerName, endpoint }),
        });
      }

      setIsSubscribed(false);
      localStorage.removeItem("push-subscribed");
    } catch (err) {
      console.error("Push unsubscribe error:", err);
    } finally {
      setLoading(false);
    }
  }, [playerName, loading]);

  return { isSupported, isSubscribed, subscribe, unsubscribe, loading };
}
