"use client";

import Link from "next/link";
import { useState } from "react";
import { usePlayer } from "@/lib/player-context";
import { PLAYERS, DM } from "@/lib/players";

export function Nav() {
  const { currentPlayer, setCurrentPlayer, isDM, setDMAuth } = usePlayer();
  const [showSelector, setShowSelector] = useState(false);
  const [showDMLogin, setShowDMLogin] = useState(false);
  const [dmPassword, setDMPassword] = useState("");
  const [dmError, setDMError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleDMLogin = async () => {
    try {
      const res = await fetch("/api/auth/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: dmPassword }),
      });
      if (res.ok) {
        setDMAuth(true, dmPassword);
        setShowDMLogin(false);
        setDMPassword("");
        setDMError(false);
      } else {
        setDMError(true);
      }
    } catch {
      setDMError(true);
    }
  };

  const navLinks = [
    { href: "/seating", label: "Seating" },
    { href: "/messages", label: "Messages" },
    { href: "/initiative", label: "Initiative" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-[#e5c07b]/20 bg-[#0d1117]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="font-cinzel text-lg font-bold text-[#e5c07b] transition-colors hover:text-[#f0d090]"
        >
          The Adventurer&apos;s Table
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-300 transition-colors hover:text-[#e5c07b]"
            >
              {link.label}
            </Link>
          ))}

          <div className="flex items-center gap-3 border-l border-gray-700 pl-4">
            {currentPlayer ? (
              <button
                onClick={() => setShowSelector(true)}
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                Logged in as{" "}
                <span
                  style={{ color: currentPlayer === DM.name ? DM.color : PLAYERS.find(p => p.name === currentPlayer)?.color }}
                  className="font-bold"
                >
                  {currentPlayer}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setShowSelector(true)}
                className="rounded border border-[#e5c07b]/30 px-3 py-1 text-sm text-[#e5c07b] transition-colors hover:bg-[#e5c07b]/10"
              >
                Select Player
              </button>
            )}

            {isDM && (
              <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-bold text-white">
                DM
              </span>
            )}

            {!isDM && (
              <button
                onClick={() => setShowDMLogin(true)}
                className="text-xs text-gray-500 transition-colors hover:text-gray-300"
              >
                DM Mode
              </button>
            )}

            {isDM && (
              <button
                onClick={() => setDMAuth(false)}
                className="text-xs text-gray-500 transition-colors hover:text-gray-300"
              >
                Exit DM
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

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-800 px-4 py-3 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-gray-300 hover:text-[#e5c07b]"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 border-t border-gray-800 pt-2">
            {currentPlayer ? (
              <button
                onClick={() => { setShowSelector(true); setMobileMenuOpen(false); }}
                className="block py-2 text-sm text-gray-400"
              >
                Playing as <span className="font-bold text-white">{currentPlayer}</span>
              </button>
            ) : (
              <button
                onClick={() => { setShowSelector(true); setMobileMenuOpen(false); }}
                className="block py-2 text-sm text-[#e5c07b]"
              >
                Select Player
              </button>
            )}
            {!isDM ? (
              <button
                onClick={() => { setShowDMLogin(true); setMobileMenuOpen(false); }}
                className="block py-2 text-xs text-gray-500"
              >
                DM Mode
              </button>
            ) : (
              <div className="flex items-center gap-2 py-2">
                <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-bold text-white">DM</span>
                <button onClick={() => setDMAuth(false)} className="text-xs text-gray-500">
                  Exit
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Player selector modal */}
      {showSelector && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowSelector(false)}
        >
          <div
            className="w-80 rounded-lg border border-[#e5c07b]/20 bg-[#161b22] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 font-cinzel text-lg text-[#e5c07b]">
              Select Your Character
            </h3>
            <div className="flex flex-col gap-2">
              {PLAYERS.map((player) => (
                <button
                  key={player.name}
                  onClick={() => {
                    setCurrentPlayer(player.name);
                    setShowSelector(false);
                  }}
                  className="rounded px-4 py-2 text-left text-sm font-medium transition-colors hover:bg-white/5"
                  style={{ color: player.color }}
                >
                  {player.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DM login modal */}
      {showDMLogin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowDMLogin(false)}
        >
          <div
            className="w-80 rounded-lg border border-[#e5c07b]/20 bg-[#161b22] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 font-cinzel text-lg text-[#e5c07b]">
              DM Authentication
            </h3>
            <input
              type="password"
              value={dmPassword}
              onChange={(e) => { setDMPassword(e.target.value); setDMError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleDMLogin()}
              placeholder="Enter DM password"
              className="mb-3 w-full rounded border border-gray-700 bg-[#0d1117] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#e5c07b] focus:outline-none"
            />
            {dmError && (
              <p className="mb-2 text-sm text-red-400">Incorrect password</p>
            )}
            <button
              onClick={handleDMLogin}
              className="w-full rounded bg-[#e5c07b] px-4 py-2 text-sm font-bold text-[#0d1117] transition-colors hover:bg-[#f0d090]"
            >
              Enter
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
