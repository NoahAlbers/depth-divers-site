"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  generatePuzzle,
  getRoundCount,
  getTimePerRound,
  type Puzzle,
} from "@/lib/games/glyph-race";

interface GlyphRaceProps {
  seed: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}

export function GlyphRace({ seed, difficulty, onComplete }: GlyphRaceProps) {
  const totalRounds = getRoundCount(difficulty);
  const timePerRound = getTimePerRound(difficulty);

  const [round, setRound] = useState(0);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(timePerRound);
  const [totalTime, setTotalTime] = useState(0);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [finished, setFinished] = useState(false);
  const [dnf, setDnf] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Load puzzle for current round
  useEffect(() => {
    if (round >= totalRounds) return;
    const p = generatePuzzle(seed, round, difficulty);
    setPuzzle(p);
    setAnswer("");
    setTimeLeft(timePerRound);
    setRoundStartTime(Date.now());

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) return 0;
        return prev - 0.1;
      });
    }, 100);

    setTimeout(() => inputRef.current?.focus(), 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [round, seed, difficulty, timePerRound, totalRounds]);

  // Check time expiry
  useEffect(() => {
    if (timeLeft <= 0 && !finished) {
      setDnf(true);
      setFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);
      onComplete(999, { dnf: true, roundsCompleted: round });
    }
  }, [timeLeft, finished, round, onComplete]);

  const handleSubmit = useCallback(() => {
    if (!puzzle || finished) return;

    const isCorrect =
      answer.trim().toUpperCase() === puzzle.answer.toUpperCase();

    if (isCorrect) {
      const roundTime = (Date.now() - roundStartTime) / 1000;
      const newTotal = totalTime + roundTime;
      setTotalTime(newTotal);

      if (timerRef.current) clearInterval(timerRef.current);

      setFlash("correct");
      setTimeout(() => {
        setFlash(null);
        if (round + 1 >= totalRounds) {
          setFinished(true);
          onComplete(Math.round(newTotal * 10) / 10);
        } else {
          setRound(round + 1);
        }
      }, 800);
    } else {
      setFlash("wrong");
      setAnswer("");
      setTimeout(() => setFlash(null), 500);
    }
  }, [answer, puzzle, finished, round, totalRounds, roundStartTime, totalTime, onComplete]);

  if (!puzzle) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-gray-400">Loading puzzle...</p>
      </div>
    );
  }

  const timerPercent = (timeLeft / timePerRound) * 100;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6">
      {/* Timer bar */}
      <div className="w-full">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
          <div
            className={`h-full transition-all ${
              timerPercent > 30
                ? "bg-gold"
                : timerPercent > 10
                  ? "bg-orange-500"
                  : "bg-red-500"
            }`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>
            Round {round + 1}/{totalRounds}
          </span>
          <span>{timeLeft.toFixed(1)}s</span>
        </div>
      </div>

      {/* Puzzle */}
      <div
        className={`w-full rounded-lg border-2 p-6 text-center transition-all ${
          flash === "correct"
            ? "border-gold bg-gold/10"
            : flash === "wrong"
              ? "border-red-500 bg-red-500/10"
              : "border-border bg-[#1a1a2e]"
        }`}
      >
        <div className="mb-2 text-xs font-bold uppercase text-gray-500">
          {puzzle.type === "anagram" ? "Unscramble" : "Solve"}
        </div>
        <div className="whitespace-pre-line font-cinzel text-2xl font-bold text-gold">
          {puzzle.prompt}
        </div>
        {puzzle.hint && (
          <p className="mt-2 text-xs text-gray-500">{puzzle.hint}</p>
        )}
      </div>

      {/* Input */}
      {!finished && (
        <div className="flex w-full gap-2">
          <input
            ref={inputRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Your answer..."
            className="min-h-[44px] flex-1 rounded border border-gray-700 bg-background px-4 py-2 text-center text-lg font-bold text-white placeholder-gray-500 focus:border-gold focus:outline-none"
            autoComplete="off"
            autoCapitalize="characters"
          />
          <button
            onClick={handleSubmit}
            disabled={!answer.trim()}
            className="min-h-[44px] min-w-[44px] rounded bg-gold px-4 font-bold text-background disabled:opacity-50"
          >
            Go
          </button>
        </div>
      )}

      {/* Results */}
      {finished && !dnf && (
        <div className="text-center">
          <p className="text-lg font-bold text-gold">
            All rounds complete!
          </p>
          <p className="text-sm text-gray-400">
            Total time: {totalTime.toFixed(1)}s
          </p>
        </div>
      )}

      {dnf && (
        <div className="text-center">
          <p className="text-lg font-bold text-red-400">Time&apos;s up!</p>
          <p className="text-sm text-gray-400">
            Completed {round} of {totalRounds} rounds
          </p>
        </div>
      )}

      {/* Total time tracker */}
      {!finished && totalTime > 0 && (
        <p className="text-xs text-gray-500">
          Running total: {totalTime.toFixed(1)}s
        </p>
      )}
    </div>
  );
}
