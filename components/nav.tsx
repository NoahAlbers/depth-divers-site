"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePlayer } from "@/lib/player-context";
import { PLAYERS, DM } from "@/lib/players";
import { useUnreadCount } from "@/lib/use-unread-count";
import { UnreadBadge } from "@/components/messaging/unread-badge";
import { usePush } from "@/lib/use-push";
import { usePlayerColors } from "@/lib/player-colors-context";

const ALL_CHARACTERS = [...PLAYERS, DM];

export function Nav() {
  const { currentPlayer, isDM, effectivePlayer, effectiveIsDM, isImpersonating, login, logout } = usePlayer();
  const { totalUnread } = useUnreadCount(effectivePlayer);
  const { isSupported: pushSupported, isSubscribed: pushSubscribed } = usePush(effectivePlayer);

  // Update document title with unread count
  useEffect(() => {
    document.title = totalUnread > 0 ? `(${totalUnread}) Depth Divers` : "Depth Divers";
  }, [totalUnread]);

  const [showLogin, setShowLogin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loginName, setLoginName] = useState<string>(PLAYERS[0].name);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogin = async () => {
    setLoginError("");
    const result = await login(loginName, loginPassword);
    if (result.success) {
      setShowLogin(false);
      setLoginPassword("");
    } else {
      setLoginError(result.error || "Login failed");
    }
  };

  const handleLogout = () => {
    logout();
    setShowLogin(false);
    setShowSettings(false);
  };

  const displayPlayer = effectivePlayer;
  const playerColor = displayPlayer
    ? ALL_CHARACTERS.find((p) => p.name === displayPlayer)?.color
    : undefined;

  const navLinks = [
    { href: "/messages", label: "Messages" },
    { href: "/initiative", label: "Initiative" },
    { href: "/games", label: "Games" },
    { href: "/seating", label: "Seating" },
    { href: "/character", label: "Character" },
    { href: "/achievements", label: "Achievements" },
    ...(isDM ? [{ href: "/dm", label: "DM Area" }] : []),
  ];

  return (
    <>
    <nav className="sticky top-0 z-50 border-b border-[#e5c07b]/20 bg-[#0d1117]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="font-cinzel text-lg font-bold text-[#e5c07b] transition-colors hover:text-[#f0d090]"
        >
          Depth Divers
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-sm text-gray-300 transition-colors hover:text-[#e5c07b]"
            >
              {link.label}
              {link.href === "/messages" && totalUnread > 0 && (
                <UnreadBadge count={totalUnread} className="ml-1" />
              )}
            </Link>
          ))}

          <div className="flex items-center gap-3 border-l border-gray-700 pl-4">
            {currentPlayer ? (
              <>
                <span className="text-sm text-gray-400">
                  Logged in as{" "}
                  <span style={{ color: playerColor }} className="font-bold">
                    {displayPlayer}
                  </span>
                </span>
                {effectiveIsDM && (
                  <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-bold text-white">
                    DM
                  </span>
                )}
                {pushSupported && (
                  <Link
                    href="/notifications"
                    className={`transition-colors ${pushSubscribed ? "text-[#e5c07b]" : "text-gray-400 hover:text-white"}`}
                    title={pushSubscribed ? "Notification settings" : "Enable notifications"}
                  >
                    <svg className="h-4 w-4" fill={pushSubscribed ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </Link>
                )}
                <button
                  onClick={() => setShowSettings(true)}
                  className="text-gray-400 transition-colors hover:text-white"
                  title="Settings"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  onClick={handleLogout}
                  className="text-xs text-gray-500 transition-colors hover:text-gray-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="rounded border border-[#e5c07b]/30 px-3 py-1 text-sm text-[#e5c07b] transition-colors hover:bg-[#e5c07b]/10"
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-gray-300 md:hidden"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

    </nav>

    {/* Mobile menu — rendered outside nav to avoid sticky stacking context trapping z-index */}
    <div
      className={`fixed inset-0 z-[100] md:hidden transition-opacity duration-300 ${
        mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setMobileMenuOpen(false)}
      />
      {/* Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-72 border-l border-gray-800 bg-[#0d1117] px-4 py-4 transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="mb-4 text-gray-400 hover:text-white"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-gray-300 hover:text-[#e5c07b]"
          >
            {link.label}
            {link.href === "/messages" && totalUnread > 0 && (
              <UnreadBadge count={totalUnread} className="ml-1" />
            )}
          </Link>
        ))}
        <div className="mt-2 border-t border-gray-800 pt-2">
          {currentPlayer ? (
            <>
              <div className="flex items-center gap-2 py-2">
                <span className="text-sm text-gray-400">
                  <span style={{ color: playerColor }} className="font-bold">
                    {displayPlayer}
                  </span>
                </span>
                {effectiveIsDM && (
                  <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-bold text-white">
                    DM
                  </span>
                )}
              </div>
              {pushSupported && (
                <Link
                  href="/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 text-sm ${pushSubscribed ? "text-[#e5c07b]" : "text-gray-400 hover:text-white"}`}
                >
                  {pushSubscribed ? "Notifications On" : "Enable Notifications"}
                </Link>
              )}
              <button
                onClick={() => { setShowSettings(true); setMobileMenuOpen(false); }}
                className="block py-2 text-sm text-gray-400 hover:text-white"
              >
                Settings
              </button>
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="block py-2 text-xs text-gray-500"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => { setShowLogin(true); setMobileMenuOpen(false); }}
              className="block py-2 text-sm text-[#e5c07b]"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Login modal — rendered outside nav to avoid sticky/transform containing block */}
    {showLogin && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
        onClick={() => setShowLogin(false)}
      >
        <div
          className="w-full max-w-[400px] max-h-[90vh] overflow-y-auto rounded-lg border border-[#e5c07b]/20 bg-[#161b22] p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="mb-4 font-cinzel text-lg text-[#e5c07b]">
            Enter the Tavern
          </h3>
          <select
            value={loginName}
            onChange={(e) => setLoginName(e.target.value)}
            className="mb-3 w-full rounded border border-gray-700 bg-[#0d1117] px-3 py-2 text-sm text-white"
          >
            {ALL_CHARACTERS.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="password"
            value={loginPassword}
            onChange={(e) => { setLoginPassword(e.target.value); setLoginError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Enter your passphrase"
            className="mb-3 w-full rounded border border-gray-700 bg-[#0d1117] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#e5c07b] focus:outline-none"
          />
          {loginError && (
            <p className="mb-2 text-sm text-red-400">{loginError}</p>
          )}
          <button
            onClick={handleLogin}
            className="w-full rounded bg-[#e5c07b] px-4 py-2 text-sm font-bold text-[#0d1117] transition-colors hover:bg-[#f0d090]"
          >
            Enter
          </button>
        </div>
      </div>
    )}

    {/* Settings modal — rendered outside nav */}
    {showSettings && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
        onClick={() => setShowSettings(false)}
      >
        <div
          className="w-full max-w-[400px] max-h-[90vh] overflow-y-auto rounded-lg border border-[#e5c07b]/20 bg-[#161b22] p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <SettingsPanel
            currentPlayer={currentPlayer!}
            isDM={isDM}
            onClose={() => setShowSettings(false)}
          />
        </div>
      </div>
    )}
    </>
  );
}

function SettingsPanel({
  currentPlayer,
  isDM,
  onClose,
}: {
  currentPlayer: string;
  isDM: boolean;
  onClose: () => void;
}) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState(false);

  // DM reset
  const [resetTarget, setResetTarget] = useState<string>(PLAYERS[0].name);
  const [resetPw, setResetPw] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetError, setResetError] = useState(false);

  const handleChangePassword = async () => {
    setPwMsg("");
    setPwError(false);

    if (newPw !== confirmPw) {
      setPwMsg("New passwords do not match");
      setPwError(true);
      return;
    }
    if (!newPw) {
      setPwMsg("New password cannot be empty");
      setPwError(true);
      return;
    }

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: currentPlayer,
        currentPassword: currentPw,
        newPassword: newPw,
      }),
    });
    const data = await res.json();

    if (res.ok) {
      setPwMsg("Password changed successfully");
      setPwError(false);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } else {
      setPwMsg(data.error || "Failed to change password");
      setPwError(true);
    }
  };

  const handleResetPassword = async () => {
    setResetMsg("");
    setResetError(false);

    if (!resetPw) {
      setResetMsg("New password cannot be empty");
      setResetError(true);
      return;
    }

    const dmPw = localStorage.getItem("dnd-dm-password") || "";
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-dm-password": dmPw,
      },
      body: JSON.stringify({
        targetPlayer: resetTarget,
        newPassword: resetPw,
      }),
    });
    const data = await res.json();

    if (res.ok) {
      setResetMsg(`Password reset for ${resetTarget}`);
      setResetError(false);
      setResetPw("");
    } else {
      setResetMsg(data.error || "Reset failed");
      setResetError(true);
    }
  };

  return (
    <div>
      <h3 className="mb-4 font-cinzel text-lg text-[#e5c07b]">Settings</h3>

      {/* Push Notifications link */}
      <Link
        href="/notifications"
        onClick={onClose}
        className="mb-4 flex items-center gap-3 rounded border border-gold/20 bg-gold/5 px-4 py-3 transition-colors hover:bg-gold/10"
      >
        <svg className="h-5 w-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <div>
          <p className="text-sm font-bold text-gold">Push Notifications</p>
          <p className="text-xs text-gray-500">Setup, test, and troubleshoot</p>
        </div>
      </Link>

      {/* Your Color */}
      <ColorPicker currentPlayer={currentPlayer} />

      {/* Change own password */}
      <div className="mb-6">
        <h4 className="mb-2 text-sm font-bold text-gray-300">Change Password</h4>
        <input
          type="password"
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
          placeholder="Current password"
          className="mb-2 w-full rounded border border-gray-700 bg-[#0d1117] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#e5c07b] focus:outline-none"
        />
        <input
          type="password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          placeholder="New password"
          className="mb-2 w-full rounded border border-gray-700 bg-[#0d1117] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#e5c07b] focus:outline-none"
        />
        <input
          type="password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          placeholder="Confirm new password"
          onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
          className="mb-2 w-full rounded border border-gray-700 bg-[#0d1117] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#e5c07b] focus:outline-none"
        />
        {pwMsg && (
          <p className={`mb-2 text-sm ${pwError ? "text-red-400" : "text-green-400"}`}>
            {pwMsg}
          </p>
        )}
        <button
          onClick={handleChangePassword}
          className="w-full rounded bg-[#e5c07b] px-4 py-2 text-sm font-bold text-[#0d1117] transition-colors hover:bg-[#f0d090]"
        >
          Change Password
        </button>
      </div>

      {/* DM: Reset player passwords */}
      {isDM && (
        <div className="border-t border-gray-700 pt-4">
          <h4 className="mb-2 text-sm font-bold text-gray-300">
            DM: Reset Player Password
          </h4>
          <select
            value={resetTarget}
            onChange={(e) => setResetTarget(e.target.value)}
            className="mb-2 w-full rounded border border-gray-700 bg-[#0d1117] px-3 py-2 text-sm text-white"
          >
            {PLAYERS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="password"
            value={resetPw}
            onChange={(e) => setResetPw(e.target.value)}
            placeholder="New password for player"
            onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
            className="mb-2 w-full rounded border border-gray-700 bg-[#0d1117] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#e5c07b] focus:outline-none"
          />
          {resetMsg && (
            <p className={`mb-2 text-sm ${resetError ? "text-red-400" : "text-green-400"}`}>
              {resetMsg}
            </p>
          )}
          <button
            onClick={handleResetPassword}
            className="w-full rounded bg-[#e5c07b] px-4 py-2 text-sm font-bold text-[#0d1117] transition-colors hover:bg-[#f0d090]"
          >
            Reset Password
          </button>
        </div>
      )}

      <button
        onClick={onClose}
        className="mt-4 w-full rounded border border-gray-700 px-4 py-2 text-sm text-gray-400 transition-colors hover:text-white"
      >
        Close
      </button>
    </div>
  );
}

const PRESET_COLORS = [
  "#e06c75", "#61afef", "#e5c07b", "#98c379", "#c678dd", "#d19a66",
  "#56b6c2", "#be5046", "#e06ca0", "#61ef8f", "#c0c0c0", "#f0e68c",
];

function ColorPicker({ currentPlayer }: { currentPlayer: string }) {
  const { getColor, refreshColors } = usePlayerColors();
  const currentColor = getColor(currentPlayer);
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [hexInput, setHexInput] = useState(currentColor);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!/^#[0-9a-fA-F]{6}$/.test(selectedColor)) return;
    setSaving(true);
    await fetch("/api/auth/update-color", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: currentPlayer, color: selectedColor }),
    });
    refreshColors();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = async () => {
    setSaving(true);
    await fetch("/api/auth/update-color", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: currentPlayer, color: null }),
    });
    refreshColors();
    setSaving(false);
    const defaultColor = getColor(currentPlayer);
    setSelectedColor(defaultColor);
    setHexInput(defaultColor);
  };

  return (
    <div className="mb-6 border-b border-gray-700 pb-4">
      <h4 className="mb-2 text-sm font-bold text-gray-300">Your Color</h4>

      {/* Preview */}
      <div className="mb-3 flex items-center gap-2">
        <div
          className="h-6 w-6 rounded-full border border-gray-600"
          style={{ backgroundColor: selectedColor }}
        />
        <span className="text-sm font-bold" style={{ color: selectedColor }}>
          {currentPlayer}
        </span>
      </div>

      {/* Preset grid */}
      <div className="mb-3 grid grid-cols-6 gap-1.5">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => { setSelectedColor(color); setHexInput(color); }}
            className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
              selectedColor === color ? "border-white scale-110" : "border-transparent"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Hex input */}
      <div className="mb-3 flex gap-2">
        <input
          value={hexInput}
          onChange={(e) => {
            setHexInput(e.target.value);
            if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
              setSelectedColor(e.target.value);
            }
          }}
          placeholder="#e06c75"
          className="flex-1 rounded border border-gray-700 bg-[#0d1117] px-3 py-1 text-sm text-white font-mono focus:border-[#e5c07b] focus:outline-none"
        />
        <button
          onClick={handleSave}
          disabled={saving || selectedColor === currentColor}
          className="rounded bg-[#e5c07b] px-3 py-1 text-xs font-bold text-[#0d1117] disabled:opacity-50"
        >
          {saving ? "..." : "Save"}
        </button>
      </div>

      {saved && (
        <p className="mb-2 text-xs text-green-400">Color updated!</p>
      )}

      <button
        onClick={handleReset}
        className="text-[10px] text-gray-600 hover:text-gray-400"
      >
        Reset to default
      </button>
    </div>
  );
}
