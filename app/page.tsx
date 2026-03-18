"use client";

import Link from "next/link";

const tools = [
  {
    href: "/seating",
    title: "Seating Chart",
    tagline: "Find your place at the table",
    icon: "🪑",
  },
  {
    href: "/messages",
    title: "Secret Messages",
    tagline: "Whisper to your allies... or enemies",
    icon: "💬",
  },
  {
    href: "/initiative",
    title: "Initiative Tracker",
    tagline: "Know when to strike",
    icon: "⚔️",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      {/* Hero */}
      <div className="mb-16 text-center">
        <h1
          className="animate-fade-in-up font-cinzel text-5xl font-bold text-gold md:text-7xl"
          style={{ animationDelay: "0ms" }}
        >
          The Adventurer&apos;s Table
        </h1>
        <p
          className="animate-fade-in-up mt-4 text-lg text-gray-400"
          style={{ animationDelay: "150ms" }}
        >
          Campaign tools for the party
        </p>
      </div>

      {/* Navigation cards */}
      <div className="grid w-full max-w-3xl gap-6 md:grid-cols-3">
        {tools.map((tool, i) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="card-glow animate-fade-in-up group rounded-lg border border-border bg-surface p-6 text-center transition-all"
            style={{ animationDelay: `${300 + i * 100}ms` }}
          >
            <div className="mb-3 text-4xl transition-transform group-hover:scale-110">
              {tool.icon}
            </div>
            <h2 className="font-cinzel text-lg font-bold text-gold">
              {tool.title}
            </h2>
            <p className="mt-2 text-sm text-gray-400">{tool.tagline}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
