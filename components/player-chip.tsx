"use client";

import { getPlayerColor, getPlayerShort } from "@/lib/players";

interface PlayerChipProps {
  name: string;
  short?: boolean;
  className?: string;
}

export function PlayerChip({ name, short = false, className = "" }: PlayerChipProps) {
  const color = getPlayerColor(name);
  const display = short ? getPlayerShort(name) : name;

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-sm font-bold ${className}`}
      style={{
        color,
        backgroundColor: `${color}15`,
        border: `1px solid ${color}30`,
      }}
    >
      {display}
    </span>
  );
}
