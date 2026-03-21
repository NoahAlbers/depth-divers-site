"use client";

import { useState } from "react";
import { usePlayer } from "@/lib/player-context";
import { usePush } from "@/lib/use-push";

export default function NotificationsPage() {
  const { currentPlayer, effectivePlayer } = usePlayer();
  const playerName = effectivePlayer;
  const { isSupported, isSubscribed, subscribe, unsubscribe, loading } =
    usePush(playerName);
  const [testSent, setTestSent] = useState(false);
  const [testError, setTestError] = useState("");

  const sendTestPush = async () => {
    if (!playerName) return;
    setTestSent(false);
    setTestError("");
    try {
      const res = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName }),
      });
      if (res.ok) {
        setTestSent(true);
      } else {
        setTestError("Failed to send test notification");
      }
    } catch {
      setTestError("Network error");
    }
  };

  if (!currentPlayer) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Log in to manage notifications.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-cinzel text-3xl font-bold text-gold">
        Push Notifications
      </h1>

      {/* Status Card */}
      <div className="mb-8 rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-3 font-cinzel text-lg font-bold text-gold">
          Status
        </h2>

        {!isSupported ? (
          <div className="rounded border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-sm font-bold text-red-400">
              Not Supported
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Your browser doesn&apos;t support push notifications. See the
              setup guides below.
            </p>
          </div>
        ) : isSubscribed ? (
          <div className="rounded border border-green-500/30 bg-green-500/10 px-4 py-3">
            <p className="text-sm font-bold text-green-400">
              Notifications Enabled
            </p>
            <p className="mt-1 text-xs text-gray-400">
              You&apos;ll receive alerts for messages, initiative, and
              seating changes.
            </p>
          </div>
        ) : (
          <div className="rounded border border-gold/30 bg-gold/10 px-4 py-3">
            <p className="text-sm font-bold text-gold">
              Notifications Disabled
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Enable notifications to get alerts even when the tab is in the
              background.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap gap-3">
          {isSupported && !isSubscribed && (
            <button
              onClick={subscribe}
              disabled={loading}
              className="rounded bg-gold px-4 py-2 text-sm font-bold text-background transition-colors hover:bg-[#f0d090] disabled:opacity-50"
            >
              {loading ? "Enabling..." : "Enable Notifications"}
            </button>
          )}
          {isSupported && isSubscribed && (
            <>
              <button
                onClick={unsubscribe}
                disabled={loading}
                className="rounded border border-red-500/30 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
              >
                {loading ? "Disabling..." : "Disable Notifications"}
              </button>
              <button
                onClick={sendTestPush}
                className="rounded border border-gold/30 px-4 py-2 text-sm text-gold transition-colors hover:bg-gold/10"
              >
                Send Test Notification
              </button>
            </>
          )}
        </div>

        {testSent && (
          <p className="mt-3 text-sm text-green-400">
            Test notification sent! You should see it momentarily.
          </p>
        )}
        {testError && (
          <p className="mt-3 text-sm text-red-400">{testError}</p>
        )}
      </div>

      {/* What You'll Get */}
      <div className="mb-8 rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-3 font-cinzel text-lg font-bold text-gold">
          What You&apos;ll Get Notified About
        </h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-lg">💬</span>
            <div>
              <p className="text-sm font-bold text-gray-200">New Messages</p>
              <p className="text-xs text-gray-500">
                When someone sends you a direct message or posts in a group
                chat.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-lg">⚔️</span>
            <div>
              <p className="text-sm font-bold text-gray-200">
                Initiative Started
              </p>
              <p className="text-xs text-gray-500">
                When the DM starts a new encounter and you need to roll
                initiative.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-lg">🔒</span>
            <div>
              <p className="text-sm font-bold text-gray-200">
                Initiative Locked
              </p>
              <p className="text-xs text-gray-500">
                When combat order is finalized and the battle begins.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-lg">🪑</span>
            <div>
              <p className="text-sm font-bold text-gray-200">Seating Locked</p>
              <p className="text-xs text-gray-500">
                When the DM sets the seating arrangement for the session.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Guides */}
      <div className="mb-8 rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-4 font-cinzel text-lg font-bold text-gold">
          Setup Guides
        </h2>

        {/* Android Chrome */}
        <details className="mb-4">
          <summary className="cursor-pointer text-sm font-bold text-gray-200 hover:text-gold">
            Android (Chrome)
          </summary>
          <div className="mt-2 flex flex-col gap-2 pl-4 text-xs text-gray-400">
            <p>
              <span className="font-bold text-gray-300">1.</span> Open the
              site in <span className="text-gold">Chrome</span>
            </p>
            <p>
              <span className="font-bold text-gray-300">2.</span> Log in to
              your account
            </p>
            <p>
              <span className="font-bold text-gray-300">3.</span> Tap the{" "}
              <span className="text-gold">bell icon</span> in the nav bar, or
              press &quot;Enable Notifications&quot; above
            </p>
            <p>
              <span className="font-bold text-gray-300">4.</span> When Chrome
              asks &quot;Allow notifications?&quot; &mdash; tap{" "}
              <span className="text-green-400">Allow</span>
            </p>
            <p>
              <span className="font-bold text-gray-300">5.</span> Done!
              Notifications work even when the tab is in the background.
            </p>
            <div className="mt-2 rounded border border-gold/20 bg-gold/5 p-2">
              <p className="text-[11px] text-gold">
                For the best experience, tap the Chrome menu (three
                dots) and select &quot;Add to Home Screen&quot;. This makes the
                site work like a native app.
              </p>
            </div>
          </div>
        </details>

        {/* iOS Safari */}
        <details className="mb-4">
          <summary className="cursor-pointer text-sm font-bold text-gray-200 hover:text-gold">
            iPhone / iPad (Safari)
          </summary>
          <div className="mt-2 flex flex-col gap-2 pl-4 text-xs text-gray-400">
            <p className="rounded border border-yellow-500/30 bg-yellow-500/10 p-2 text-yellow-400">
              iOS requires the site to be added to your Home Screen before
              push notifications work. This is an Apple requirement.
            </p>
            <p>
              <span className="font-bold text-gray-300">1.</span> Open the
              site in <span className="text-gold">Safari</span> (not Chrome
              or other browsers)
            </p>
            <p>
              <span className="font-bold text-gray-300">2.</span> Tap the{" "}
              <span className="text-gold">Share button</span> (square with
              arrow at the bottom of Safari)
            </p>
            <p>
              <span className="font-bold text-gray-300">3.</span> Scroll down
              and tap{" "}
              <span className="text-gold">
                &quot;Add to Home Screen&quot;
              </span>
            </p>
            <p>
              <span className="font-bold text-gray-300">4.</span> Tap
              &quot;Add&quot; in the top right
            </p>
            <p>
              <span className="font-bold text-gray-300">5.</span> Open the
              site from your <span className="text-gold">Home Screen</span>{" "}
              (not from Safari)
            </p>
            <p>
              <span className="font-bold text-gray-300">6.</span> Log in and
              tap the bell icon or press &quot;Enable Notifications&quot;
            </p>
            <p>
              <span className="font-bold text-gray-300">7.</span> When
              prompted, tap <span className="text-green-400">Allow</span>
            </p>
            <div className="mt-2 rounded border border-gray-700 bg-surface-light p-2">
              <p className="text-[11px] text-gray-500">
                Requires iOS 16.4 or later. Check Settings &gt; General &gt;
                About to see your iOS version.
              </p>
            </div>
          </div>
        </details>

        {/* Desktop Chrome */}
        <details className="mb-4">
          <summary className="cursor-pointer text-sm font-bold text-gray-200 hover:text-gold">
            Desktop (Chrome / Edge / Firefox)
          </summary>
          <div className="mt-2 flex flex-col gap-2 pl-4 text-xs text-gray-400">
            <p>
              <span className="font-bold text-gray-300">1.</span> Open the
              site and log in
            </p>
            <p>
              <span className="font-bold text-gray-300">2.</span> Click the{" "}
              <span className="text-gold">bell icon</span> in the nav bar
            </p>
            <p>
              <span className="font-bold text-gray-300">3.</span> When the
              browser asks to allow notifications, click{" "}
              <span className="text-green-400">Allow</span>
            </p>
            <p>
              <span className="font-bold text-gray-300">4.</span> Done!
              Notifications appear even when the browser is minimized.
            </p>
          </div>
        </details>

        {/* Troubleshooting */}
        <details>
          <summary className="cursor-pointer text-sm font-bold text-gray-200 hover:text-gold">
            Troubleshooting
          </summary>
          <div className="mt-2 flex flex-col gap-3 pl-4 text-xs text-gray-400">
            <div>
              <p className="font-bold text-gray-300">
                &quot;The bell icon doesn&apos;t appear&quot;
              </p>
              <p>
                Your browser may not support push notifications. Try Chrome on
                Android or desktop. On iOS, make sure you&apos;ve added the
                site to your Home Screen first.
              </p>
            </div>
            <div>
              <p className="font-bold text-gray-300">
                &quot;I clicked Allow but nothing happens&quot;
              </p>
              <p>
                Try the &quot;Send Test Notification&quot; button above. If it
                doesn&apos;t arrive, try disabling and re-enabling
                notifications.
              </p>
            </div>
            <div>
              <p className="font-bold text-gray-300">
                &quot;I accidentally blocked notifications&quot;
              </p>
              <p>
                <span className="text-gold">Chrome:</span> Click the lock
                icon in the address bar &gt; Site settings &gt; Notifications
                &gt; Allow
              </p>
              <p>
                <span className="text-gold">Safari:</span> Settings &gt;
                Safari &gt; Notifications &gt; find the site &gt; Allow
              </p>
              <p>
                <span className="text-gold">Firefox:</span> Click the lock
                icon &gt; Connection secure &gt; More information &gt;
                Permissions &gt; Notifications &gt; Allow
              </p>
            </div>
            <div>
              <p className="font-bold text-gray-300">
                &quot;Notifications stopped working&quot;
              </p>
              <p>
                Try disabling and re-enabling using the button above. This
                refreshes the connection.
              </p>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
