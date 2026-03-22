"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface WritingPhaseProps {
  previousImage?: string;
  prompt?: string;
  timeLimit: number;
  maxChars?: number;
  onSubmit: (text: string) => void;
}

export function WritingPhase({
  previousImage,
  prompt,
  timeLimit,
  maxChars = 150,
  onSubmit,
}: WritingPhaseProps) {
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;
  const [text, setText] = useState("");
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [submitted, setSubmitted] = useState(false);
  const textRef = useRef("");

  // Keep ref in sync
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  // Timer
  useEffect(() => {
    if (submitted) return;
    if (timeLeft <= 0) {
      doSubmit();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, submitted]);

  const doSubmit = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);
    const finalText = textRef.current.trim() || "[no description]";
    onSubmitRef.current(finalText);
  }, [submitted]);

  const timerPercent = timeLimit > 0 ? (timeLeft / timeLimit) * 100 : 100;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Show what the player is responding to */}
      {previousImage && (
        <div className="w-full max-w-[400px]">
          <p className="mb-1 text-center text-xs text-gray-400">
            Describe what you see:
          </p>
          <img
            src={previousImage}
            alt="Previous drawing"
            className="w-full rounded-lg border border-border"
            style={{ maxHeight: "40vh", objectFit: "contain" }}
          />
        </div>
      )}

      {prompt && !previousImage && (
        <div className="w-full max-w-[400px] rounded border border-gold/30 bg-gold/5 p-3 text-center">
          <p className="text-xs text-gray-400">Write a prompt:</p>
          <p className="text-sm text-gray-300">{prompt}</p>
        </div>
      )}

      {/* Timer bar */}
      <div className="h-2 w-full max-w-[400px] rounded-full bg-gray-700">
        <div
          className={`h-full rounded-full transition-all ${
            timerPercent < 20
              ? "bg-red-500"
              : timerPercent < 50
                ? "bg-yellow-500"
                : "bg-gold"
          }`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">{timeLeft}s remaining</p>

      {/* Text input */}
      {!submitted && (
        <>
          <textarea
            value={text}
            onChange={(e) => {
              if (e.target.value.length <= maxChars) {
                setText(e.target.value);
              }
            }}
            placeholder={
              previousImage
                ? "Describe what you see in the drawing..."
                : "Write a creative prompt..."
            }
            className="w-full max-w-[400px] rounded border border-border bg-background p-3 text-sm text-white placeholder-gray-500 resize-none"
            rows={3}
            autoFocus
          />
          <div className="flex w-full max-w-[400px] items-center justify-between">
            <span
              className={`text-xs ${
                text.length >= maxChars ? "text-red-400" : "text-gray-500"
              }`}
            >
              {text.length}/{maxChars}
            </span>
            <button
              onClick={doSubmit}
              className="rounded bg-gold px-4 py-1.5 text-sm font-bold text-background hover:bg-[#f0d090]"
            >
              Submit
            </button>
          </div>
        </>
      )}

      {submitted && (
        <p className="text-sm text-green-400">Response submitted!</p>
      )}
    </div>
  );
}
