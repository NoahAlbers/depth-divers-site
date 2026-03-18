"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const TAGLINES = [
  "An adventure that involves the Underdark... a whole lot of dark.",
  "Bring a torch. Then bring another one.",
  "Where the spiders are the least of your problems.",
  "Somewhere below, something with too many legs is waiting.",
  "The Underdark doesn't care about your darkvision.",
  "It's not the fall that kills you. It's what lives at the bottom.",
  "Fungi down here have opinions. Strong ones.",
  "If you can hear the dripping, you're already too deep.",
  "Drow politics make surface kingdoms look reasonable.",
  "The worms here don't fish. They fish for you.",
  "Every tunnel leads somewhere. Not all of them lead back.",
  "Trust nothing that glows.",
];

const tools = [
  {
    href: "/seating",
    title: "Seating Chart",
    tagline: "Find your place at the table",
    icon: "\u{1FA91}",
  },
  {
    href: "/messages",
    title: "Secret Messages",
    tagline: "Whisper to your allies... or enemies",
    icon: "\u{1F4AC}",
  },
  {
    href: "/initiative",
    title: "Initiative Tracker",
    tagline: "Know when to strike",
    icon: "\u2694\uFE0F",
  },
];

export default function Home() {
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setTaglineIndex((prev) => (prev + 1) % TAGLINES.length);
        setFade(true);
      }, 600);
    }, 5500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      {/* Hero */}
      <div className="mb-16 text-center">
        <h1
          className="animate-fade-in-up font-cinzel text-5xl font-bold text-gold md:text-7xl"
          style={{ animationDelay: "0ms" }}
        >
          Depth Divers
        </h1>
        <p
          className="mt-4 h-12 text-sm italic text-gray-400/80 md:text-base"
          style={{
            opacity: fade ? 1 : 0,
            transition: "opacity 0.6s ease-in-out",
          }}
        >
          {TAGLINES[taglineIndex]}
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
