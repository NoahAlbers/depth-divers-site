"use client";

import { useState, useEffect, useRef } from "react";

export function InstallPrompt() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPromptRef = useRef<Event | null>(null);

  useEffect(() => {
    // Check if already installed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // Check dismiss state
    const dismissCount = Number(localStorage.getItem("pwa-dismiss-count") || "0");
    if (dismissCount >= 3) return;
    const lastDismiss = localStorage.getItem("pwa-dismiss-time");
    if (lastDismiss && Date.now() - Number(lastDismiss) < 7 * 24 * 60 * 60 * 1000) return;

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      // iOS doesn't have beforeinstallprompt — show manual instructions
      setShowBanner(true);
      return;
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    const prompt = deferredPromptRef.current as unknown as {
      prompt: () => void;
      userChoice: Promise<{ outcome: string }>;
    };
    if (!prompt) return;
    prompt.prompt();
    await prompt.userChoice;
    setShowBanner(false);
    deferredPromptRef.current = null;
  };

  const handleDismiss = () => {
    setShowBanner(false);
    const count = Number(localStorage.getItem("pwa-dismiss-count") || "0") + 1;
    localStorage.setItem("pwa-dismiss-count", String(count));
    localStorage.setItem("pwa-dismiss-time", String(Date.now()));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[90] border-t border-[#e5c07b]/20 bg-[#161b22] px-4 py-3">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="flex-1">
          {isIOS ? (
            <p className="text-xs text-gray-300">
              Tap{" "}
              <span className="inline-block rounded bg-surface-light px-1.5 py-0.5 text-[10px]">
                ↑ Share
              </span>{" "}
              then{" "}
              <span className="font-bold text-[#e5c07b]">
                &quot;Add to Home Screen&quot;
              </span>{" "}
              to install Depth Divers
            </p>
          ) : (
            <p className="text-xs text-gray-300">
              Install <span className="font-bold text-[#e5c07b]">Depth Divers</span> for the best experience
            </p>
          )}
        </div>
        {!isIOS && (
          <button
            onClick={handleInstall}
            className="rounded bg-[#e5c07b] px-3 py-1.5 text-xs font-bold text-[#0d1117]"
          >
            Install
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
