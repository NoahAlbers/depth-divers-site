"use client";

import { useEffect, useState } from "react";
import { getGameById } from "@/lib/games/registry";
import {
  DEFAULT_SKILL_MAPPINGS,
  getSkillBonus,
  getAbilityModifier,
  getProficiencyBonus,
} from "@/lib/games/difficulty";

interface GameInstructionsProps {
  gameId: string;
  difficulty: string;
  playerName?: string;
}

interface CharacterData {
  level: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  skills: Record<string, { proficient: boolean; expertise: boolean }>;
}

// ===== INSTRUCTIONS DATA =====

interface InstructionsData {
  goal: string;
  scoring: string;
  statEffect: (bonus: number) => string;
  visualGuide: () => React.ReactNode;
}

const INSTRUCTIONS: Record<string, InstructionsData> = {
  "arcane-conduit": {
    goal: "Build a pipeline of arcane conduits to channel magical energy as far as possible before it overflows.",
    scoring: "+1 per segment the flow passes through. +3 bonus for cross pipes used twice. -1 for replacing unused pipes. Reach the minimum segment count to succeed.",
    statEffect: (bonus) =>
      bonus > 0
        ? `Your Arcana bonus (+${bonus}) gives you a longer setup delay and slightly slower flow.`
        : "Your Arcana modifier doesn't provide any advantage — standard timing applies.",
    visualGuide: () => (
      <div className="space-y-3">
        {/* Pipe types */}
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase text-gray-500">Pipe Types</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { name: "Straight ═", desc: "Left ↔ Right" },
              { name: "Straight ║", desc: "Up ↔ Down" },
              { name: "Corner ╗", desc: "Turns flow" },
              { name: "Cross ╬", desc: "+3 bonus!" },
            ].map((p) => (
              <div key={p.name} className="rounded bg-background/50 p-1.5 text-center">
                <p className="text-sm">{p.name.split(" ")[1]}</p>
                <p className="text-[9px] text-gray-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Flow diagram */}
        <div className="rounded bg-background/50 p-2">
          <p className="mb-1 text-[10px] text-gray-400">Flow Example:</p>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-purple-400">◆</span>
            <span className="text-gray-500">→</span>
            <span className="text-gray-300">═</span>
            <span className="text-gray-500">→</span>
            <span className="text-gray-300">╗</span>
            <span className="text-gray-500">↓</span>
            <span className="text-gray-300">║</span>
            <span className="text-gray-500">↓</span>
            <span className="text-gray-300">╚</span>
            <span className="text-gray-500">→ ...</span>
          </div>
          <p className="mt-1 text-[9px] text-gray-600">Energy flows from the purple source through connected pipes</p>
        </div>
        {/* Replace hint */}
        <div className="rounded border border-yellow-500/20 bg-yellow-500/5 p-2">
          <p className="text-[10px] text-yellow-300">Tip: Tap an unused pipe to replace it (-1 point penalty)</p>
        </div>
      </div>
    ),
  },

  "rune-echoes": {
    goal: "Memorize and repeat increasingly long sequences of flashing runes.",
    scoring: "Your score is the longest sequence you successfully repeated. Each round adds one more rune.",
    statEffect: (bonus) =>
      bonus > 0
        ? `Your History bonus (+${bonus}) gives you slightly slower flash speed for easier memorization.`
        : "Standard flash speed applies.",
    visualGuide: () => (
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-3">
          {["🔴", "🔵", "🟢", "🟡"].map((r, i) => (
            <div key={i} className={`flex h-10 w-10 items-center justify-center rounded-lg border ${i === 1 ? "border-white bg-white/10" : "border-gray-700 bg-gray-800"}`}>
              <span className="text-lg">{r}</span>
            </div>
          ))}
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-400">Watch: 🔵 → 🔴 → 🟢</p>
          <p className="text-[10px] text-gray-400">Then repeat the same order!</p>
        </div>
      </div>
    ),
  },

  "glyph-race": {
    goal: "Solve magical puzzles as fast as possible — anagrams, ciphers, and pattern matching.",
    scoring: "Your total time across all puzzles is your score. Fastest total time wins.",
    statEffect: (bonus) =>
      bonus > 0
        ? `Your Investigation bonus (+${bonus}) gives you slightly easier puzzle variants.`
        : "Standard puzzle difficulty applies.",
    visualGuide: () => (
      <div className="space-y-2">
        <div className="rounded bg-background/50 p-2 text-center">
          <p className="text-[10px] text-gray-500 mb-1">Example Puzzle:</p>
          <p className="font-mono text-sm text-gold">RCAAAN → <span className="text-green-400">ARCANA</span></p>
        </div>
        <p className="text-[10px] text-gray-500 text-center">Unscramble, decode, and match patterns as fast as you can!</p>
      </div>
    ),
  },

  "stalactite-storm": {
    goal: "Dodge falling stalactites and cave debris. Survive as long as possible.",
    scoring: "Longest survival time wins. Obstacles get faster and denser over time.",
    statEffect: (bonus) =>
      bonus > 0
        ? `Your Acrobatics bonus (+${bonus}) makes obstacles slightly slower.`
        : "Standard obstacle speed applies.",
    visualGuide: () => (
      <div className="space-y-2">
        <div className="rounded bg-background/50 p-3 text-center">
          <div className="flex justify-center gap-4 mb-2">
            <span className="text-gray-500">🪨</span>
            <span className="text-gray-500">🪨</span>
            <span className="text-gray-500">🪨</span>
          </div>
          <p className="text-gray-400">↓ ↓ ↓</p>
          <p className="text-lg">🏃</p>
          <p className="text-gray-400">← →</p>
        </div>
        <p className="text-[10px] text-gray-500 text-center">Move left and right to dodge falling debris!</p>
      </div>
    ),
  },

  "spider-swat": {
    goal: "Squash as many spiders as possible before time runs out. Avoid mushrooms!",
    scoring: "+points per spider squashed. -points for hitting friendly mushrooms. Highest score wins.",
    statEffect: (bonus) =>
      bonus > 0
        ? `Your Perception bonus (+${bonus}) makes spiders slightly slower to disappear.`
        : "Standard spider speed applies.",
    visualGuide: () => (
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <span className="text-2xl">🕷️</span>
            <p className="text-[10px] text-green-400">+points</p>
          </div>
          <div className="text-center">
            <span className="text-2xl">🍄</span>
            <p className="text-[10px] text-red-400">-points!</p>
          </div>
        </div>
        <p className="text-[10px] text-gray-500 text-center">Tap spiders fast! Don&apos;t hit the mushrooms!</p>
      </div>
    ),
  },

  "lockpicking": {
    goal: "Navigate your lockpick through the mechanism without touching the walls.",
    scoring: "Fastest completion time wins. Three wall strikes and the pick breaks!",
    statEffect: (bonus) =>
      bonus > 0
        ? `Your Sleight of Hand bonus (+${bonus}) gives you a slightly wider pick and more forgiving collision.`
        : "Standard pick size and collision applies.",
    visualGuide: () => (
      <div className="space-y-2">
        <div className="rounded bg-background/50 p-3 text-center">
          <div className="inline-block rounded border border-gray-600 p-2">
            <p className="text-[10px] text-gray-400 mb-1">Maze</p>
            <div className="flex items-center gap-1">
              <span className="text-blue-400">●</span>
              <span className="text-gray-600">━━━</span>
              <span className="text-gold">🔓</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-red-400">✕ Strike 1</span>
          <span className="text-xs text-red-400">✕ Strike 2</span>
          <span className="text-xs text-gray-600">○ Strike 3</span>
        </div>
        <p className="text-[10px] text-gray-500 text-center">Guide the pick carefully — 3 strikes and you&apos;re out!</p>
      </div>
    ),
  },

  "stealth-sequence": {
    goal: "Sneak past patrolling guards to reach the exit. Avoid their vision cones!",
    scoring: "Score = number of beats to reach the exit. Lower is better. Getting caught records your progress.",
    statEffect: (bonus) =>
      bonus > 0
        ? `Your Stealth bonus (+${bonus}) gives you warning flashes before guard movements${bonus >= 5 ? " and free close calls" : ""}.`
        : "No warning advantage — time your moves carefully.",
    visualGuide: () => (
      <div className="space-y-2">
        <div className="rounded bg-background/50 p-3">
          <div className="grid grid-cols-5 gap-0.5 mb-2">
            {Array.from({ length: 25 }, (_, i) => {
              const isGuard = i === 12;
              const isVision = [7, 8, 13].includes(i);
              const isPlayer = i === 20;
              const isExit = i === 2;
              return (
                <div
                  key={i}
                  className={`h-5 w-5 rounded-sm ${
                    isGuard ? "bg-purple-500" :
                    isVision ? "bg-red-500/30" :
                    isPlayer ? "bg-blue-400" :
                    isExit ? "bg-gold" :
                    "bg-gray-800"
                  }`}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-3 text-[9px]">
            <span><span className="inline-block h-2 w-2 rounded-sm bg-purple-500" /> Guard</span>
            <span><span className="inline-block h-2 w-2 rounded-sm bg-red-500/30" /> Vision</span>
            <span><span className="inline-block h-2 w-2 rounded-sm bg-blue-400" /> You</span>
            <span><span className="inline-block h-2 w-2 rounded-sm bg-gold" /> Exit</span>
          </div>
        </div>
        <p className="text-[10px] text-gray-500 text-center">Move between beats. Guards move on each beat — avoid their vision cones!</p>
      </div>
    ),
  },

  "drinking-contest": {
    goal: "Match the rhythm to keep drinking. Last one standing wins!",
    scoring: "Score = number of rounds survived. The sweet spot shrinks and speed increases each round.",
    statEffect: (bonus) =>
      bonus > 0
        ? `Your Constitution bonus (+${bonus}) gives you a slightly wider sweet spot.`
        : "Standard sweet spot — watch your timing!",
    visualGuide: () => (
      <div className="space-y-2">
        <div className="rounded bg-background/50 p-3 text-center">
          <div className="mx-auto w-48 h-6 rounded-full bg-gray-800 relative overflow-hidden">
            <div className="absolute left-1/3 w-1/3 h-full bg-green-500/30 rounded" />
            <div className="absolute left-1/2 w-1 h-full bg-white rounded animate-pulse" />
          </div>
          <p className="mt-1 text-[10px] text-green-400">← Sweet Spot →</p>
        </div>
        <p className="text-[10px] text-gray-500 text-center">Tap when the marker is in the green zone. Don&apos;t tap during burp rounds!</p>
      </div>
    ),
  },

  "defuse-the-glyph": {
    goal: "Work together to disarm a magical trap. Each player sees different clues — communicate verbally!",
    scoring: "Cooperative: all players win or lose together. Faster completion = higher score.",
    statEffect: (bonus) =>
      bonus > 0
        ? `Your Arcana bonus (+${bonus}) gives the team slightly simpler symbol sets.`
        : "Standard symbol complexity applies.",
    visualGuide: () => (
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-4">
          <div className="rounded border border-gray-600 bg-background/50 p-2 text-center">
            <p className="text-[9px] text-gray-500">Player A sees:</p>
            <p className="text-lg">🔷 ⭐ 🔶</p>
          </div>
          <div className="text-lg text-gray-500">💬</div>
          <div className="rounded border border-gray-600 bg-background/50 p-2 text-center">
            <p className="text-[9px] text-gray-500">Player B sees:</p>
            <p className="text-lg">🔶 🔷 ⭐</p>
          </div>
        </div>
        <p className="text-[10px] text-gray-500 text-center">Talk to each other — don&apos;t show your screen! Combine clues to disarm the trap.</p>
      </div>
    ),
  },

  "underdark-telephone": {
    goal: "Play telephone with drawings! Write, draw, guess — watch your message transform through the party.",
    scoring: "No scoring — pure fun! The comedy comes from how distorted the message gets.",
    statEffect: () => "No stat influence — this is a social game for everyone!",
    visualGuide: () => (
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {[
            { label: "Write", icon: "✏️", example: '"A drow riding a spider"' },
            { label: "Draw", icon: "🎨", example: "🖼️" },
            { label: "Guess", icon: "✏️", example: '"A purple thing with legs?"' },
            { label: "Draw", icon: "🎨", example: "🖼️" },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-600">→</span>}
              <div className="rounded bg-background/50 px-2 py-1 text-center">
                <span className="text-sm">{step.icon}</span>
                <p className="text-[8px] text-gray-500">{step.label}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-500 text-center">Each chain is revealed at the end — from the original prompt to the final guess!</p>
      </div>
    ),
  },
};

// ===== COMPONENT =====

export function GameInstructions({ gameId, difficulty, playerName }: GameInstructionsProps) {
  const game = getGameById(gameId);
  const instructions = INSTRUCTIONS[gameId];
  const [skillBonus, setSkillBonus] = useState<number | null>(null);

  // Fetch character sheet to compute skill bonus
  useEffect(() => {
    if (!playerName) return;
    const mapping = DEFAULT_SKILL_MAPPINGS[gameId];
    if (!mapping) return;

    fetch(`/api/character?player=${encodeURIComponent(playerName)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.sheet) return;
        const sheet = data.sheet as CharacterData;
        const abilityScore = sheet[mapping.ability as keyof CharacterData] as number;
        if (typeof abilityScore !== "number") return;

        if (mapping.skill) {
          const skillData = sheet.skills[mapping.skill];
          const bonus = getSkillBonus(
            abilityScore,
            sheet.level,
            skillData?.proficient ?? false,
            skillData?.expertise ?? false
          );
          setSkillBonus(bonus);
        } else {
          // Raw ability
          setSkillBonus(getAbilityModifier(abilityScore));
        }
      })
      .catch(() => {});
  }, [playerName, gameId]);

  if (!game || !instructions) return null;

  return (
    <div className="mb-4 space-y-3">
      {/* Goal */}
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase text-gray-500">Goal</p>
        <p className="text-sm font-bold text-gray-200">{instructions.goal}</p>
      </div>

      {/* How it works (from registry) */}
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase text-gray-500">How It Works</p>
        <ul className="space-y-0.5">
          {game.howToPlay.map((step, i) => (
            <li key={i} className="flex gap-1.5 text-xs text-gray-300">
              <span className="text-gold/40">•</span>
              {step}
            </li>
          ))}
        </ul>
      </div>

      {/* Visual guide */}
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase text-gray-500">Visual Guide</p>
        {instructions.visualGuide()}
      </div>

      {/* Scoring */}
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase text-gray-500">Scoring</p>
        <p className="text-xs text-gray-300">{instructions.scoring}</p>
      </div>

      {/* Stat bonus */}
      {skillBonus !== null && game.skillDisplay && (
        <div className="rounded border border-purple-500/20 bg-purple-500/5 p-2">
          <p className="mb-0.5 text-[10px] font-bold uppercase text-gray-500">Your Stat Bonus</p>
          <p className="text-xs text-purple-300">
            {game.skillDisplay} ({skillBonus >= 0 ? "+" : ""}{skillBonus})
          </p>
          <p className="mt-0.5 text-[10px] text-gray-400">
            {instructions.statEffect(skillBonus)}
          </p>
        </div>
      )}

      {/* Difficulty info */}
      <div>
        <p className="mb-0.5 text-[10px] font-bold uppercase text-gray-500">
          Difficulty: <span className="capitalize text-gold">{difficulty}</span>
        </p>
        <p className="text-[10px] text-gray-400">
          {game.difficultyDescriptions[difficulty as "easy" | "medium" | "hard"]}
        </p>
      </div>
    </div>
  );
}
