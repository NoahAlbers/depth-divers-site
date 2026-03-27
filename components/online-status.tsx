"use client";

interface OnlineStatusProps {
  status: "online" | "away" | "offline";
  lastOnline?: string | null;
  size?: "sm" | "md";
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function OnlineStatus({ status, lastOnline, size = "md" }: OnlineStatusProps) {
  const dotSize = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-block rounded-full ${dotSize} ${
          status === "online"
            ? "bg-green-500"
            : status === "away"
            ? "bg-yellow-500"
            : "bg-gray-500"
        }`}
      />
      <span className={`${textSize} text-gray-400`}>
        {status === "online"
          ? "Online"
          : status === "away"
          ? "Away"
          : lastOnline
          ? `Last online ${relativeTime(lastOnline)}`
          : "Offline"}
      </span>
    </div>
  );
}
