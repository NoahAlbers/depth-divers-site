"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  generateSequence,
  getConfig,
  RUNE_SYMBOLS,
} from "@/lib/games/rune-echoes";

interface RuneEchoesProps {
  seed: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}

type Phase = "watching" | "input" | "correct" | "wrong" | "done";

export function RuneEchoes({ seed, difficulty, onComplete }: RuneEchoesProps) {
  const config = getConfig(difficulty);
  const maxSequenceLength = 50;
  const fullSequence = useRef(
    generateSequence(seed, maxSequenceLength, config.runeCount)
  );

  const [phase, setPhase] = useState<Phase>("watching");
  const [currentLength, setCurrentLength] = useState(config.startLength);
  const [flashIndex, setFlashIndex] = useState(-1);
  const [activeRune, setActiveRune] = useState(-1);
  const [inputIndex, setInputIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");

  const runes = RUNE_SYMBOLS.slice(0, config.runeCount);
  const gridCols = config.runeCount <= 4 ? 2 : config.runeCount <= 6 ? 3 : 3;

  // Flash the sequence
  const playSequence = useCallback(
    (length: number) => {
      setPhase("watching");
      setFlashIndex(-1);
      setActiveRune(-1);

      let i = 0;
      const interval = setInterval(() => {
        if (i < length) {
          setActiveRune(fullSequence.current[i]);
          setFlashIndex(i);
          // Turn off after half the flash speed
          setTimeout(() => setActiveRune(-1), config.flashSpeed * 0.6);
          i++;
        } else {
          clearInterval(interval);
          setPhase("input");
          setInputIndex(0);
        }
      }, config.flashSpeed);

      return () => clearInterval(interval);
    },
    [config.flashSpeed]
  );

  // Start first sequence
  useEffect(() => {
    const timer = setTimeout(() => {
      playSequence(config.startLength);
    }, 1000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRuneTap = (runeIndex: number) => {
    if (phase !== "input") return;

    const expected = fullSequence.current[inputIndex];

    if (runeIndex === expected) {
      // Correct
      const nextInput = inputIndex + 1;

      if (nextInput >= currentLength) {
        // Completed this round
        const newScore = currentLength - config.startLength + 1;
        setScore(newScore);
        setFeedback(`Round ${newScore} complete!`);
        setPhase("correct");

        setTimeout(() => {
          const newLength = currentLength + 1;
          setCurrentLength(newLength);
          setFeedback("");
          playSequence(newLength);
        }, 1000);
      } else {
        setInputIndex(nextInput);
      }
    } else {
      // Wrong
      const finalScore = currentLength - config.startLength;
      setScore(finalScore);
      setPhase("wrong");
      setFeedback(`Wrong! You reached sequence ${currentLength - config.startLength}.`);

      setTimeout(() => {
        setPhase("done");
        onComplete(finalScore);
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Status */}
      <div className="flex items-center gap-4">
        <span className="rounded bg-surface px-3 py-1 text-sm">
          Sequence:{" "}
          <span className="font-bold text-gold">{currentLength}</span>
        </span>
        <span className="rounded bg-surface px-3 py-1 text-sm">
          Score:{" "}
          <span className="font-bold text-white">{score}</span>
        </span>
        <span
          className={`rounded px-2 py-1 text-xs font-bold ${
            phase === "watching"
              ? "bg-purple-600/20 text-purple-300"
              : phase === "input"
                ? "bg-gold/20 text-gold"
                : phase === "correct"
                  ? "bg-green-600/20 text-green-400"
                  : phase === "wrong"
                    ? "bg-red-600/20 text-red-400"
                    : "bg-gray-700 text-gray-300"
          }`}
        >
          {phase === "watching"
            ? "Watch..."
            : phase === "input"
              ? "Your turn!"
              : phase === "correct"
                ? "Correct!"
                : phase === "wrong"
                  ? "Wrong!"
                  : "Done"}
        </span>
      </div>

      {feedback && (
        <p
          className={`text-sm font-bold ${
            phase === "wrong" ? "text-red-400" : "text-green-400"
          }`}
        >
          {feedback}
        </p>
      )}

      {/* Rune grid */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
      >
        {runes.map((rune, i) => {
          const isFlashing = activeRune === i;
          const isInputPhase = phase === "input";

          return (
            <button
              key={i}
              onClick={() => handleRuneTap(i)}
              disabled={phase !== "input"}
              className={`flex items-center justify-center rounded-lg border-2 transition-all ${
                isFlashing
                  ? "border-gold bg-gold/20 shadow-[0_0_20px_rgba(229,192,123,0.4)] scale-105"
                  : isInputPhase
                    ? "border-[#c678dd]/30 bg-[#1a1a2e] hover:border-[#c678dd]/60 hover:bg-[#c678dd]/10 active:scale-95"
                    : "border-border bg-[#1a1a2e]"
              }`}
              style={{
                width: "clamp(60px, 18vw, 90px)",
                height: "clamp(60px, 18vw, 90px)",
                fontSize: "clamp(24px, 6vw, 36px)",
              }}
            >
              <span
                className={`transition-all ${
                  isFlashing ? "text-gold scale-125" : "text-[#c678dd]/70"
                }`}
              >
                {rune}
              </span>
            </button>
          );
        })}
      </div>

      {/* Progress dots */}
      {phase === "input" && (
        <div className="flex gap-1">
          {Array.from({ length: currentLength }, (_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${
                i < inputIndex ? "bg-green-400" : "bg-gray-600"
              }`}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Watch the sequence, then tap the runes in order.
      </p>
    </div>
  );
}
