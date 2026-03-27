"use client";

interface AchievementCardProps {
  slug: string;
  name: string;
  description: string;
  icon: string;
  hidden: boolean;
  unlocked: boolean;
  earners?: string[];
  onClick?: () => void;
}

export function AchievementCard({
  name,
  description,
  icon,
  hidden,
  unlocked,
  onClick,
}: AchievementCardProps) {
  if (hidden && !unlocked) {
    // Hidden + locked: name visible, description hidden
    return (
      <div className="relative rounded-lg border border-gray-700/50 bg-surface/50 p-3 opacity-60">
        <div className="absolute right-2 top-2 text-gray-600">🔒</div>
        <div className="mb-1 text-lg">🏆</div>
        <p className="text-sm font-bold text-gray-500">{name}</p>
        <p className="text-xs text-gray-600">???</p>
      </div>
    );
  }

  if (!unlocked) {
    // Visible + locked: dimmed
    return (
      <div className="rounded-lg border border-border bg-surface/50 p-3 opacity-50">
        <div className="mb-1 text-lg">{icon}</div>
        <p className="text-sm font-bold text-gray-400">{name}</p>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
    );
  }

  if (hidden && unlocked) {
    // Hidden + unlocked: special secret badge
    return (
      <button
        onClick={onClick}
        className="relative rounded-lg border-2 border-gold/60 bg-gold/10 p-3 text-left transition-colors hover:bg-gold/15"
      >
        <div className="absolute right-2 top-2 text-[10px] font-bold text-gold">
          🔓 SECRET
        </div>
        <div className="mb-1 text-lg">{icon}</div>
        <p className="text-sm font-bold text-gold">{name}</p>
        <p className="text-xs text-gray-300">{description}</p>
      </button>
    );
  }

  // Visible + unlocked
  return (
    <button
      onClick={onClick}
      className="rounded-lg border-2 border-gold/40 bg-gold/5 p-3 text-left transition-colors hover:bg-gold/10"
    >
      <div className="mb-1 text-lg">{icon}</div>
      <p className="text-sm font-bold text-gold">{name}</p>
      <p className="text-xs text-gray-300">{description}</p>
    </button>
  );
}
