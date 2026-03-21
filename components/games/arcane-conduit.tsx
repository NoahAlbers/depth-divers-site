"use client";

interface ArcaneConduitProps {
  seed: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}

export function ArcaneConduit({ onComplete }: ArcaneConduitProps) {
  // Placeholder — will be implemented in task 4.7
  return (
    <div className="flex min-h-[40vh] items-center justify-center rounded-lg border border-border bg-surface p-6">
      <div className="text-center">
        <div className="mb-4 text-6xl">🔮</div>
        <p className="text-lg text-gold">Arcane Conduit</p>
        <p className="mt-2 text-sm text-gray-400">Coming soon...</p>
        <button
          onClick={() => onComplete(10)}
          className="mt-4 rounded bg-gold px-4 py-2 text-sm font-bold text-background"
        >
          Submit Test Score (10s)
        </button>
      </div>
    </div>
  );
}
