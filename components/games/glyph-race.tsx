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
  const [flash, setFlash] = useState<"correct" | "wrong" | "timeout" | null>(null);
  const [finished, setFinished] = useState(false);
  const [skippedRounds, setSkippedRounds] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const advancingRef = useRef(false);

  // Load puzzle for current round
  useEffect(() => {
    if (round >= totalRounds) return;
    const p = generatePuzzle(seed, round, difficulty);
    setPuzzle(p);
    setAnswer("");
    setTimeLeft(timePerRound);
    setRoundStartTime(Date.now());
    advancingRef.current = false;

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

  // Handle time expiry — skip with penalty, advance to next round
  useEffect(() => {
    if (timeLeft <= 0 && !finished && !advancingRef.current) {
      advancingRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);

      // Add full timer duration as penalty
      const newTotal = totalTime + timePerRound;
      setTotalTime(newTotal);
      setSkippedRounds((prev) => prev + 1);

      setFlash("timeout");
      setTimeout(() => {
        setFlash(null);
        if (round + 1 >= totalRounds) {
          setFinished(true);
          onComplete(Math.round(newTotal * 10) / 10, { skipped: skippedRounds + 1 });
        } else {
          setRound(round + 1);
        }
      }, 1000);
    }
  }, [timeLeft, finished, round, totalRounds, totalTime, timePerRound, skippedRounds, onComplete]);

  const handleSubmit = useCallback(() => {
    if (!puzzle || finished || advancingRef.current) return;

    const isCorrect =
      answer.trim().toUpperCase() === puzzle.answer.toUpperCase();

    if (isCorrect) {
      advancingRef.current = true;
      const roundTime = (Date.now() - roundStartTime) / 1000;
      const newTotal = totalTime + roundTime;
      setTotalTime(newTotal);

      if (timerRef.current) clearInterval(timerRef.current);

      setFlash("correct");
      setTimeout(() => {
        setFlash(null);
        if (round + 1 >= totalRounds) {
          setFinished(true);
          onComplete(Math.round(newTotal * 10) / 10, { skipped: skippedRounds });
        } else {
          setRound(round + 1);
        }
      }, 800);
    } else {
      setFlash("wrong");
      setAnswer("");
      setTimeout(() => setFlash(null), 500);
    }
  }, [answer, puzzle, finished, round, totalRounds, roundStartTime, totalTime, skippedRounds, onComplete]);

  // Handle pattern-match option click
  const handleOptionSelect = useCallback(
    (option: string) => {
      if (!puzzle || finished || advancingRef.current) return;
      setAnswer(option);
      // Auto-submit for pattern match
      if (option === puzzle.answer) {
        advancingRef.current = true;
        const roundTime = (Date.now() - roundStartTime) / 1000;
        const newTotal = totalTime + roundTime;
        setTotalTime(newTotal);
        if (timerRef.current) clearInterval(timerRef.current);
        setFlash("correct");
        setTimeout(() => {
          setFlash(null);
          if (round + 1 >= totalRounds) {
            setFinished(true);
            onComplete(Math.round(newTotal * 10) / 10, { skipped: skippedRounds });
          } else {
            setRound(round + 1);
          }
        }, 800);
      } else {
        setFlash("wrong");
        setAnswer("");
        setTimeout(() => setFlash(null), 500);
      }
    },
    [puzzle, finished, round, totalRounds, roundStartTime, totalTime, skippedRounds, onComplete]
  );

  if (!puzzle) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-gray-400">Loading puzzle...</p>
      </div>
    );
  }

  const timerPercent = (timeLeft / timePerRound) * 100;
  const puzzleLabel =
    puzzle.type === "math-cipher"
      ? "Solve the Cipher"
      : puzzle.type === "quick-math"
        ? "Quick Math"
        : "What Comes Next?";

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
              : flash === "timeout"
                ? "border-orange-500 bg-orange-500/10"
                : "border-border bg-[#1a1a2e]"
        }`}
      >
        <div className="mb-2 text-xs font-bold uppercase text-gray-500">
          {flash === "timeout" ? "Time's Up! Skipping..." : puzzleLabel}
        </div>
        <div className="whitespace-pre-line font-cinzel text-2xl font-bold text-gold">
          {puzzle.prompt}
        </div>
        {puzzle.hint && (
          <p className="mt-2 text-xs text-gray-500">{puzzle.hint}</p>
        )}
      </div>

      {/* Input — text for math, buttons for pattern match */}
      {!finished && !advancingRef.current && (
        <>
          {puzzle.type === "pattern-match" && puzzle.options ? (
            <div className="grid w-full grid-cols-2 gap-2">
              {puzzle.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleOptionSelect(opt)}
                  className="min-h-[44px] rounded border border-gray-700 bg-background px-4 py-3 text-lg font-bold text-white transition-colors hover:border-gold hover:bg-gold/10"
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex w-full gap-2">
              <input
                ref={inputRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Your answer..."
                className="min-h-[44px] flex-1 rounded border border-gray-700 bg-background px-4 py-2 text-center text-lg font-bold text-white placeholder-gray-500 focus:border-gold focus:outline-none"
                autoComplete="off"
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
        </>
      )}

      {/* Results */}
      {finished && (
        <div className="text-center">
          <p className="text-lg font-bold text-gold">All rounds complete!</p>
          <p className="text-sm text-gray-400">
            Total time: {totalTime.toFixed(1)}s
            {skippedRounds > 0 && (
              <span className="text-orange-400">
                {" "}
                ({skippedRounds} skipped with penalty)
              </span>
            )}
          </p>
        </div>
      )}

      {/* Total time tracker */}
      {!finished && totalTime > 0 && (
        <p className="text-xs text-gray-500">
          Running total: {totalTime.toFixed(1)}s
          {skippedRounds > 0 && ` (${skippedRounds} skipped)`}
        </p>
      )}
    </div>
  );
}
