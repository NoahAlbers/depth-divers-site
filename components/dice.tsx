"use client";

interface DiceProps {
  value?: number;
  size?: number;
  className?: string;
}

const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

export function Dice({ value = 6, size = 40, className = "" }: DiceProps) {
  const dots = DOT_POSITIONS[value] ?? DOT_POSITIONS[6];
  const dotRadius = size * 0.08;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
    >
      <rect
        x="5"
        y="5"
        width="90"
        height="90"
        rx="12"
        fill="none"
        stroke="#e5c07b"
        strokeWidth="3"
      />
      {dots.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={dotRadius}
          fill="#e5c07b"
        />
      ))}
    </svg>
  );
}
