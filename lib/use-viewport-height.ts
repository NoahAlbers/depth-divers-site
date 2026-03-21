"use client";

import { useEffect } from "react";

/**
 * Manages viewport height for mobile keyboard avoidance.
 * Sets --viewport-height CSS variable on document root.
 * Tries VirtualKeyboard API first, falls back to VisualViewport.
 */
export function useViewportHeight() {
  useEffect(() => {
    // Strategy 1: VirtualKeyboard API (Chrome Android 94+)
    if ("virtualKeyboard" in navigator) {
      (navigator as unknown as { virtualKeyboard: { overlaysContent: boolean } })
        .virtualKeyboard.overlaysContent = true;
    }

    // Strategy 2: VisualViewport API
    function updateHeight() {
      const vh = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      document.documentElement.style.setProperty(
        "--viewport-height",
        `${vh}px`
      );
    }

    updateHeight();

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateHeight);
      window.visualViewport.addEventListener("scroll", updateHeight);
    } else {
      window.addEventListener("resize", updateHeight);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateHeight);
        window.visualViewport.removeEventListener("scroll", updateHeight);
      } else {
        window.removeEventListener("resize", updateHeight);
      }
    };
  }, []);
}
