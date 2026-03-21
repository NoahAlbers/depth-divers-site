"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  generateGrid,
  checkSolved,
  getConnectedCells,
  type Grid,
  type Tile,
  type TileType,
} from "@/lib/games/arcane-conduit";

interface ArcaneConduitProps {
  seed: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}

// SVG pipe shapes for each tile type at rotation 0
// Connections: straight=up/down, corner=up/right, tee=up/right/down, cross=all
function PipeSVG({
  type,
  rotation,
  connected,
  isSource,
  isTarget,
  solved,
}: {
  type: TileType;
  rotation: number;
  connected: boolean;
  isSource: boolean;
  isTarget: boolean;
  solved: boolean;
}) {
  const color = solved
    ? "#e5c07b"
    : connected
      ? "#c678dd"
      : "#4a4a5a";
  const bg = isSource
    ? "rgba(198, 120, 221, 0.15)"
    : isTarget
      ? "rgba(229, 192, 123, 0.15)"
      : "transparent";

  return (
    <svg
      viewBox="0 0 100 100"
      className="h-full w-full"
      style={{ transform: `rotate(${rotation * 90}deg)`, transition: "transform 0.15s ease" }}
    >
      <rect width="100" height="100" fill={bg} />

      {/* Center dot */}
      <circle cx="50" cy="50" r="8" fill={color} />

      {/* Pipes based on type (at rotation 0) */}
      {/* Up */}
      {(type === "straight" || type === "corner" || type === "tee" || type === "cross") && (
        <rect x="42" y="0" width="16" height="50" fill={color} rx="3" />
      )}
      {/* Right */}
      {(type === "corner" || type === "tee" || type === "cross") && (
        <rect x="50" y="42" width="50" height="16" fill={color} rx="3" />
      )}
      {/* Down */}
      {(type === "straight" || type === "tee" || type === "cross") && (
        <rect x="42" y="50" width="16" height="50" fill={color} rx="3" />
      )}
      {/* Left */}
      {type === "cross" && (
        <rect x="0" y="42" width="50" height="16" fill={color} rx="3" />
      )}

      {/* Source/Target markers */}
      {isSource && (
        <circle cx="50" cy="50" r="14" fill="none" stroke="#c678dd" strokeWidth="3" opacity="0.8" />
      )}
      {isTarget && (
        <circle cx="50" cy="50" r="14" fill="none" stroke="#e5c07b" strokeWidth="3" opacity="0.8" />
      )}

      {/* Glow effect when solved */}
      {solved && connected && (
        <circle cx="50" cy="50" r="12" fill="#e5c07b" opacity="0.4">
          <animate attributeName="r" values="10;16;10" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

export function ArcaneConduit({
  seed,
  difficulty,
  onComplete,
}: ArcaneConduitProps) {
  const [grid, setGrid] = useState<Grid | null>(null);
  const [solved, setSolved] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [connectedCells, setConnectedCells] = useState<boolean[][]>([]);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Generate grid on mount
  useEffect(() => {
    const g = generateGrid(seed, difficulty);
    setGrid(g);
    setConnectedCells(getConnectedCells(g));
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setElapsedTime((Date.now() - startTimeRef.current) / 1000);
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [seed, difficulty]);

  const rotateTile = useCallback(
    (row: number, col: number) => {
      if (!grid || solved) return;

      const newGrid: Grid = {
        ...grid,
        tiles: grid.tiles.map((r, ri) =>
          r.map((tile, ci) => {
            if (ri === row && ci === col) {
              return { ...tile, rotation: (tile.rotation + 1) % 4 };
            }
            return tile;
          })
        ),
      };

      setGrid(newGrid);

      const newConnected = getConnectedCells(newGrid);
      setConnectedCells(newConnected);

      if (checkSolved(newGrid)) {
        setSolved(true);
        if (timerRef.current) clearInterval(timerRef.current);
        const finalTime = (Date.now() - startTimeRef.current) / 1000;
        setElapsedTime(finalTime);
        // Delay to show the solved animation
        setTimeout(() => {
          onComplete(Math.round(finalTime * 10) / 10);
        }, 1500);
      }
    },
    [grid, solved, onComplete]
  );

  if (!grid) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-gray-400">Generating puzzle...</p>
      </div>
    );
  }

  const cellSize = Math.min(
    Math.floor(500 / grid.cols),
    Math.floor(400 / grid.rows),
    64
  );

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Timer */}
      <div className="flex items-center gap-4">
        <span className="rounded bg-surface px-3 py-1 text-sm">
          Time:{" "}
          <span className={`font-bold ${solved ? "text-gold" : "text-white"}`}>
            {elapsedTime.toFixed(1)}s
          </span>
        </span>
        {solved && (
          <span className="rounded bg-gold/20 px-3 py-1 text-sm font-bold text-gold">
            Solved!
          </span>
        )}
      </div>

      {/* Grid */}
      <div
        className="rounded-lg border border-border bg-[#1a1a2e] p-2"
        style={{ lineHeight: 0 }}
      >
        {grid.tiles.map((row, ri) => (
          <div key={ri} className="flex">
            {row.map((tile, ci) => {
              const isConnected =
                connectedCells[ri] && connectedCells[ri][ci];
              return (
                <button
                  key={`${ri}-${ci}`}
                  onClick={() => rotateTile(ri, ci)}
                  disabled={solved}
                  className="border border-[#2a2a3e] transition-colors hover:border-[#4a4a6e] disabled:cursor-default"
                  style={{ width: cellSize, height: cellSize }}
                >
                  <PipeSVG
                    type={tile.type}
                    rotation={tile.rotation}
                    connected={isConnected}
                    isSource={tile.isSource}
                    isTarget={tile.isTarget}
                    solved={solved}
                  />
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        Tap pipes to rotate. Connect the{" "}
        <span className="text-[#c678dd]">source</span> to the{" "}
        <span className="text-gold">target</span>.
      </p>
    </div>
  );
}
