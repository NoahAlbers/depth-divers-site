"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  timeLimit: number;
  prompt: string;
  onSubmit: (imageDataUrl: string) => void;
}

const COLORS = [
  { name: "Black", value: "#1a1a1a" },
  { name: "White", value: "#f5f5f5" },
  { name: "Red", value: "#dc2626" },
  { name: "Blue", value: "#2563eb" },
];

const BRUSH_SIZES = [
  { name: "S", value: 3 },
  { name: "M", value: 8 },
  { name: "L", value: 16 },
];

const BACKGROUND_COLOR = "#f5e6c8";

export function DrawingCanvas({
  width = 400,
  height = 400,
  timeLimit,
  prompt,
  onSubmit,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;
  const [color, setColor] = useState(COLORS[0].value);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1].value);
  const [isEraser, setIsEraser] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [submitted, setSubmitted] = useState(false);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const undoStackRef = useRef<ImageData[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  // Initialize canvas with background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, width, height);
  }, [width, height]);

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

  const saveUndoState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStackRef.current.push(imageData);
    if (undoStackRef.current.length > 20) {
      undoStackRef.current.shift();
    }
    setCanUndo(true);
  }, []);

  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || undoStackRef.current.length === 0) return;
    const ctx = canvas.getContext("2d")!;
    const imageData = undoStackRef.current.pop()!;
    ctx.putImageData(imageData, 0, 0);
    setCanUndo(undoStackRef.current.length > 0);
  }, []);

  const handleClear = useCallback(() => {
    if (!confirm("Clear the entire canvas?")) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    saveUndoState();
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [saveUndoState]);

  const getCanvasPos = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * width,
        y: ((e.clientY - rect.top) / rect.height) * height,
      };
    },
    [width, height]
  );

  const drawLine = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = isEraser ? BACKGROUND_COLOR : color;
      ctx.lineWidth = isEraser ? brushSize * 2 : brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    },
    [color, brushSize, isEraser]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (submitted) return;
      e.preventDefault();
      saveUndoState();
      isDrawingRef.current = true;
      const pos = getCanvasPos(e);
      lastPosRef.current = pos;
      // Draw a dot
      drawLine(pos, pos);
    },
    [submitted, saveUndoState, getCanvasPos, drawLine]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawingRef.current || submitted) return;
      e.preventDefault();
      const pos = getCanvasPos(e);
      if (lastPosRef.current) {
        drawLine(lastPosRef.current, pos);
      }
      lastPosRef.current = pos;
    },
    [submitted, getCanvasPos, drawLine]
  );

  const handlePointerUp = useCallback(() => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  }, []);

  const doSubmit = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png", 0.5);
    onSubmitRef.current(dataUrl);
  }, [submitted]);

  const timerPercent = timeLimit > 0 ? (timeLeft / timeLimit) * 100 : 100;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Prompt */}
      <div className="w-full max-w-[400px] rounded border border-gold/30 bg-gold/5 p-2 text-center">
        <p className="text-xs text-gray-400">Draw this:</p>
        <p className="text-sm font-bold text-gold">{prompt}</p>
      </div>

      {/* Timer bar */}
      <div className="h-2 w-full max-w-[400px] rounded-full bg-gray-700">
        <div
          className={`h-full rounded-full transition-all ${
            timerPercent < 20 ? "bg-red-500" : timerPercent < 50 ? "bg-yellow-500" : "bg-gold"
          }`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">{timeLeft}s remaining</p>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg border border-border touch-none cursor-crosshair"
        style={{
          maxWidth: "100%",
          maxHeight: "50vh",
          aspectRatio: `${width}/${height}`,
          background: BACKGROUND_COLOR,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-center gap-2 rounded border border-border bg-surface p-2">
        {/* Colors */}
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                setColor(c.value);
                setIsEraser(false);
              }}
              className={`h-7 w-7 rounded-full border-2 transition-all ${
                color === c.value && !isEraser
                  ? "border-gold scale-110"
                  : "border-gray-600"
              }`}
              style={{ background: c.value }}
              title={c.name}
            />
          ))}
        </div>

        <div className="h-5 w-px bg-gray-600" />

        {/* Brush sizes */}
        <div className="flex gap-1">
          {BRUSH_SIZES.map((s) => (
            <button
              key={s.value}
              onClick={() => setBrushSize(s.value)}
              className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold transition-all ${
                brushSize === s.value
                  ? "bg-gold/20 text-gold border border-gold"
                  : "bg-gray-800 text-gray-400 border border-gray-600"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-gray-600" />

        {/* Eraser */}
        <button
          onClick={() => setIsEraser(!isEraser)}
          className={`rounded px-2 py-1 text-xs font-bold transition-all ${
            isEraser
              ? "bg-pink-500/20 text-pink-300 border border-pink-500"
              : "bg-gray-800 text-gray-400 border border-gray-600"
          }`}
        >
          Eraser
        </button>

        {/* Undo */}
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-400 border border-gray-600 disabled:opacity-30"
        >
          Undo
        </button>

        {/* Clear */}
        <button
          onClick={handleClear}
          className="rounded bg-gray-800 px-2 py-1 text-xs text-red-400 border border-gray-600"
        >
          Clear
        </button>
      </div>

      {/* Done button */}
      {!submitted && (
        <button
          onClick={doSubmit}
          className="w-full max-w-[400px] rounded bg-gold py-2 text-sm font-bold text-background hover:bg-[#f0d090]"
        >
          Done
        </button>
      )}

      {submitted && (
        <p className="text-sm text-green-400">Drawing submitted!</p>
      )}
    </div>
  );
}
