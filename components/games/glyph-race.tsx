"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  generatePuzzle,
  getRoundCount,
  getTimePerRound,
  getCategoryIcon,
  getRating,
  type Puzzle,
} from "@/lib/games/glyph-race";

interface GlyphRaceProps {
  seed: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
  config?: Record<string, unknown>;
}

export function GlyphRace({ seed, difficulty, onComplete, config = {} }: GlyphRaceProps) {
  const configRounds = Number(config.roundCount) || 0;
  const configTime = Number(config.timePerRound) || 0;
  const configCategories = (config.categories as string) || "all";

  const totalRounds = getRoundCount(difficulty, configRounds);
  const timePerRound = getTimePerRound(difficulty, configTime);

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

  // Sequence repeat state
  const [seqPhase, setSeqPhase] = useState<"showing" | "input">("showing");
  const [seqHighlight, setSeqHighlight] = useState(-1);
  const [seqInput, setSeqInput] = useState<string[]>([]);

  // Sort order state
  const [sortedItems, setSortedItems] = useState<string[]>([]);
  const [remainingItems, setRemainingItems] = useState<string[]>([]);

  // Color count state
  const [colorCountPhase, setColorCountPhase] = useState<"flash" | "answer">("flash");

  // Load puzzle for current round
  useEffect(() => {
    if (round >= totalRounds) return;
    const p = generatePuzzle(seed, round, difficulty, configCategories);
    setPuzzle(p);
    setAnswer("");
    setTimeLeft(timePerRound);
    setRoundStartTime(Date.now());
    advancingRef.current = false;
    setSeqInput([]);
    setSortedItems([]);
    setRemainingItems(p.visualData?.items || []);

    // Special init for sequence-repeat
    if (p.inputMode === "sequence") {
      setSeqPhase("showing");
      setSeqHighlight(-1);
      const seq = p.visualData?.sequence || [];
      // Flash sequence one at a time
      seq.forEach((_, i) => {
        setTimeout(() => setSeqHighlight(i), (i + 1) * 600);
      });
      setTimeout(() => {
        setSeqHighlight(-1);
        setSeqPhase("input");
      }, (seq.length + 1) * 600);
    }

    // Special init for color-count
    if (p.type === "color-count") {
      setColorCountPhase("flash");
      const dur = p.visualData?.flashDuration || 2500;
      setTimeout(() => setColorCountPhase("answer"), dur);
    }

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
  }, [round, seed, difficulty, timePerRound, totalRounds, configCategories]);

  // Handle time expiry
  useEffect(() => {
    if (timeLeft <= 0 && !finished && !advancingRef.current) {
      advancingRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);

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
      }, 800);
    }
  }, [timeLeft, finished, round, totalRounds, totalTime, timePerRound, skippedRounds, onComplete]);

  // Unified answer handler
  const handleAnswer = useCallback(
    (ans: string) => {
      if (!puzzle || finished || advancingRef.current) return;

      const isCorrect = ans.trim().toUpperCase() === puzzle.answer.toUpperCase();

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
        }, 500);
      } else {
        setFlash("wrong");
        setAnswer("");
        setTimeout(() => setFlash(null), 400);
      }
    },
    [puzzle, finished, round, totalRounds, roundStartTime, totalTime, skippedRounds, onComplete]
  );

  const handleTextSubmit = useCallback(() => {
    handleAnswer(answer);
  }, [answer, handleAnswer]);

  // Sequence repeat handler
  const handleSeqTap = useCallback(
    (color: string) => {
      if (!puzzle || seqPhase !== "input" || advancingRef.current) return;
      const newInput = [...seqInput, color];
      setSeqInput(newInput);

      const expected = puzzle.visualData?.sequence || [];
      // Check if wrong
      if (newInput[newInput.length - 1] !== expected[newInput.length - 1]) {
        setFlash("wrong");
        setSeqInput([]);
        setTimeout(() => setFlash(null), 400);
        return;
      }
      // Check if complete
      if (newInput.length === expected.length) {
        handleAnswer(expected.join(","));
      }
    },
    [puzzle, seqPhase, seqInput, handleAnswer]
  );

  // Sort order handler
  const handleSortTap = useCallback(
    (item: string) => {
      if (!puzzle || advancingRef.current) return;
      const expected = puzzle.answer.split(",");
      const nextIdx = sortedItems.length;

      if (item === expected[nextIdx]) {
        const newSorted = [...sortedItems, item];
        const newRemaining = remainingItems.filter((_, i) => remainingItems[i] !== item || i !== remainingItems.indexOf(item));
        setSortedItems(newSorted);
        setRemainingItems(newRemaining);

        if (newSorted.length === expected.length) {
          handleAnswer(expected.join(","));
        }
      } else {
        setFlash("wrong");
        setTimeout(() => setFlash(null), 400);
      }
    },
    [puzzle, sortedItems, remainingItems, handleAnswer]
  );

  if (!puzzle) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-gray-400">Loading puzzle...</p>
      </div>
    );
  }

  const timerPercent = (timeLeft / timePerRound) * 100;
  const categoryIcon = getCategoryIcon(puzzle.category);

  // ===== FINISHED SCREEN =====
  if (finished) {
    const rating = getRating(totalTime, skippedRounds, totalRounds);
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
        <div className="text-4xl">⚡</div>
        <h2 className="font-cinzel text-2xl font-bold text-gold">All Rounds Complete!</h2>
        <p className="text-lg font-bold text-white">{totalTime.toFixed(1)}s total</p>
        {skippedRounds > 0 && (
          <p className="text-sm text-orange-400">{skippedRounds} round{skippedRounds !== 1 ? "s" : ""} skipped (penalty time added)</p>
        )}
        <p className="text-lg">{rating}</p>
      </div>
    );
  }

  // ===== GAME UI =====
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4">
      {/* Timer bar */}
      <div className="w-full">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
          <div
            className={`h-full transition-all ${
              timerPercent > 30 ? "bg-gold" : timerPercent > 10 ? "bg-orange-500" : "bg-red-500"
            }`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>Round {round + 1}/{totalRounds}</span>
          <span>{timeLeft.toFixed(1)}s</span>
        </div>
      </div>

      {/* Puzzle card */}
      <div
        className={`w-full rounded-lg border-2 p-5 text-center transition-all ${
          flash === "correct" ? "border-green-500 bg-green-500/10"
          : flash === "wrong" ? "border-red-500 bg-red-500/10"
          : flash === "timeout" ? "border-orange-500 bg-orange-500/10"
          : "border-gold/20 bg-[#1a1a2e] shadow-[0_0_20px_rgba(229,192,123,0.05)]"
        }`}
      >
        {/* Category icon + type label */}
        <div className="mb-2 flex items-center justify-center gap-2 text-xs text-gray-500">
          <span>{categoryIcon}</span>
          <span className="uppercase">{puzzle.type.replace(/-/g, " ")}</span>
        </div>

        {/* Flash overlays */}
        {flash === "correct" && <div className="mb-2 text-2xl text-green-400">✓</div>}
        {flash === "timeout" && <div className="mb-2 text-sm font-bold text-orange-400">SKIPPED</div>}

        {/* Prompt */}
        {!flash && (
          <>
            <div className="whitespace-pre-line font-cinzel text-xl font-bold text-gold">
              {puzzle.prompt}
            </div>
            {puzzle.hint && <p className="mt-2 text-xs text-gray-500">{puzzle.hint}</p>}
          </>
        )}

        {/* Visual data rendering */}
        {!flash && puzzle.visualData && (
          <div className="mt-3">
            {/* Pattern match / color count grid */}
            {(puzzle.type === "pattern-match" || (puzzle.type === "color-count" && colorCountPhase === "flash")) && puzzle.visualData.grid && (
              <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${puzzle.visualData.grid[0].length}, 1fr)` }}>
                {puzzle.visualData.grid.flat().map((color, i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-sm border border-gray-700"
                    style={{ backgroundColor: color === "missing" ? "#2a2a3e" : color }}
                  >
                    {color === "missing" && <span className="text-lg text-gray-500">?</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Odd one out shapes */}
            {puzzle.type === "odd-one-out" && puzzle.visualData.shapes && (
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {puzzle.visualData.shapes.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(String(i))}
                    className="flex h-14 w-14 items-center justify-center rounded-lg border border-gray-700 bg-background transition-all hover:border-gold"
                  >
                    <div
                      className={`${
                        s.shape === "circle" ? "rounded-full" :
                        s.shape === "diamond" ? "rotate-45 rounded-sm" :
                        s.shape === "triangle" ? "" :
                        "rounded-sm"
                      }`}
                      style={{
                        backgroundColor: s.color,
                        width: s.shape === "triangle" ? 0 : 28,
                        height: s.shape === "triangle" ? 0 : 28,
                        ...(s.shape === "triangle" ? {
                          borderLeft: "14px solid transparent",
                          borderRight: "14px solid transparent",
                          borderBottom: `28px solid ${s.color}`,
                          backgroundColor: "transparent",
                        } : {}),
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Tap target */}
            {puzzle.type === "tap-target" && (
              <div
                className="relative mx-auto mt-2 h-48 w-full max-w-xs rounded-lg border border-gray-700 bg-background"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = ((e.clientX - rect.left) / rect.width) * 100;
                  const clickY = ((e.clientY - rect.top) / rect.height) * 100;
                  const tx = puzzle.visualData?.targetX || 50;
                  const ty = puzzle.visualData?.targetY || 50;
                  const ts = puzzle.visualData?.targetSize || 14;
                  const dist = Math.sqrt((clickX - tx) ** 2 + (clickY - ty) ** 2);
                  if (dist <= ts) handleAnswer("hit");
                }}
              >
                <div
                  className="absolute rounded-full bg-gold animate-pulse"
                  style={{
                    width: `${puzzle.visualData.targetSize || 14}%`,
                    height: `${puzzle.visualData.targetSize || 14}%`,
                    left: `${(puzzle.visualData.targetX || 50) - (puzzle.visualData.targetSize || 14) / 2}%`,
                    top: `${(puzzle.visualData.targetY || 50) - (puzzle.visualData.targetSize || 14) / 2}%`,
                  }}
                />
              </div>
            )}

            {/* Sequence repeat */}
            {puzzle.type === "sequence-repeat" && puzzle.visualData.sequence && (
              <div className="mt-2 flex justify-center gap-2">
                {[...new Set(puzzle.visualData.sequence)].map((color, i) => {
                  const isHighlighted = seqPhase === "showing" && puzzle.visualData!.sequence![seqHighlight] === color;
                  return (
                    <button
                      key={i}
                      onClick={() => seqPhase === "input" && handleSeqTap(color)}
                      disabled={seqPhase === "showing"}
                      className={`h-12 w-12 rounded-lg border-2 transition-all ${
                        isHighlighted ? "border-white scale-110" : "border-gray-700"
                      } ${seqPhase === "input" ? "hover:scale-105 active:scale-95" : "opacity-70"}`}
                      style={{ backgroundColor: color }}
                    />
                  );
                })}
              </div>
            )}
            {puzzle.type === "sequence-repeat" && seqPhase === "input" && (
              <div className="mt-2 flex justify-center gap-1">
                {seqInput.map((c, i) => (
                  <div key={i} className="h-3 w-3 rounded-full" style={{ backgroundColor: c }} />
                ))}
                {Array.from({ length: (puzzle.visualData?.sequence?.length || 0) - seqInput.length }).map((_, i) => (
                  <div key={`e${i}`} className="h-3 w-3 rounded-full bg-gray-700" />
                ))}
              </div>
            )}

            {/* Sort order */}
            {puzzle.type === "sort-order" && (
              <div className="mt-2 space-y-2">
                {sortedItems.length > 0 && (
                  <div className="flex justify-center gap-1">
                    {sortedItems.map((item, i) => (
                      <div key={i} className="rounded bg-green-600/20 px-3 py-1.5 text-sm font-bold text-green-400 border border-green-500/30">
                        {item}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap justify-center gap-2">
                  {remainingItems.map((item, i) => (
                    <button
                      key={`${item}-${i}`}
                      onClick={() => handleSortTap(item)}
                      className="rounded border border-gray-600 bg-background px-4 py-2 text-lg font-bold text-white transition-all hover:border-gold hover:bg-gold/10"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Spot difference — two grids */}
            {puzzle.type === "spot-difference" && puzzle.visualData.grid && puzzle.visualData.grid2 && (
              <div className="mt-2 flex justify-center gap-4">
                {[puzzle.visualData.grid, puzzle.visualData.grid2].map((grid, gi) => (
                  <div key={gi}>
                    <p className="mb-1 text-[9px] text-gray-500">{gi === 0 ? "Original" : "Changed"}</p>
                    <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `repeat(${grid[0].length}, 1fr)` }}>
                      {grid.map((row, ri) =>
                        row.map((color, ci) => (
                          <button
                            key={`${ri}-${ci}`}
                            onClick={() => gi === 1 && handleAnswer(`${ri},${ci}`)}
                            className="h-7 w-7 rounded-sm border border-gray-800 transition-all hover:border-gray-500"
                            style={{ backgroundColor: color }}
                          />
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Direction match */}
            {puzzle.type === "direction-match" && puzzle.visualData.arrow && (
              <div className="mt-3">
                <div className="mb-3 text-5xl">{puzzle.visualData.arrow}</div>
                {puzzle.visualData.trickText && (
                  <p className="mb-2 text-sm text-red-400 line-through">{puzzle.visualData.trickText}</p>
                )}
                <div className="grid grid-cols-3 gap-1 mx-auto w-fit">
                  <div />
                  <button onClick={() => handleAnswer("up")} className="h-12 w-12 rounded border border-gray-600 bg-background text-xl font-bold text-white hover:border-gold">↑</button>
                  <div />
                  <button onClick={() => handleAnswer("left")} className="h-12 w-12 rounded border border-gray-600 bg-background text-xl font-bold text-white hover:border-gold">←</button>
                  <div />
                  <button onClick={() => handleAnswer("right")} className="h-12 w-12 rounded border border-gray-600 bg-background text-xl font-bold text-white hover:border-gold">→</button>
                  <div />
                  <button onClick={() => handleAnswer("down")} className="h-12 w-12 rounded border border-gray-600 bg-background text-xl font-bold text-white hover:border-gold">↓</button>
                  <div />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area — only for text/choice modes */}
      {!flash && !advancingRef.current && (
        <>
          {/* Text input */}
          {puzzle.inputMode === "text" && !(puzzle.type === "color-count" && colorCountPhase === "flash") && (
            <div className="flex w-full gap-2">
              <input
                ref={inputRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
                placeholder="Your answer..."
                className="min-h-[48px] flex-1 rounded border border-gray-700 bg-background px-4 py-2 text-center text-lg font-bold text-white placeholder-gray-500 focus:border-gold focus:outline-none"
                autoComplete="off"
              />
              <button
                onClick={handleTextSubmit}
                disabled={!answer.trim()}
                className="min-h-[48px] min-w-[48px] rounded bg-gold px-4 font-bold text-background disabled:opacity-50"
              >
                Go
              </button>
            </div>
          )}

          {/* Multiple choice */}
          {puzzle.inputMode === "choice" && puzzle.options && (
            <div className="grid w-full grid-cols-2 gap-2">
              {puzzle.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  className="min-h-[48px] rounded border border-gray-700 bg-background px-4 py-3 text-lg font-bold text-white transition-colors hover:border-gold hover:bg-gold/10"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Running total */}
      {totalTime > 0 && (
        <p className="text-xs text-gray-500">
          Total: {totalTime.toFixed(1)}s
          {skippedRounds > 0 && ` (${skippedRounds} skipped)`}
        </p>
      )}
    </div>
  );
}
