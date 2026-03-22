export const PLAYERS = [
  { name: "Mykolov", short: "MYK", color: "#e06c75" },
  { name: "Brent", short: "BRE", color: "#61afef" },
  { name: "Jonathan", short: "JON", color: "#e5c07b" },
  { name: "Justin", short: "JUS", color: "#98c379" },
  { name: "Eric", short: "ERI", color: "#c678dd" },
  { name: "Matthew", short: "MAT", color: "#d19a66" },
] as const;

export const DM = { name: "Noah", short: "DM", color: "#ffffff" };

export const ALL_NAMES = [...PLAYERS.map((p) => p.name), DM.name] as const;

export type PlayerName = (typeof PLAYERS)[number]["name"];
export type CharacterName = PlayerName | "Noah";

export const POLL_INTERVAL_MS = 2500;

export function getPlayerColor(name: string): string {
  if (name === DM.name || name === "DM") return DM.color;
  const player = PLAYERS.find((p) => p.name === name);
  return player?.color ?? "#888888";
}

export function getPlayerShort(name: string): string {
  if (name === DM.name || name === "DM") return DM.short;
  const player = PLAYERS.find((p) => p.name === name);
  return player?.short ?? name.slice(0, 3).toUpperCase();
}
