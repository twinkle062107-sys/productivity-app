"use client";

import type { AchievementItemData } from "@/lib/actions/achievements";

export function AchievementCard({
  achievement,
}: {
  achievement: AchievementItemData;
}) {
  const {
    title,
    description,
    emoji,
    diamondReward,
    category,
    conditionDescription,
    isUnlocked,
    unlockedAt,
    currentValue,
    targetValue,
    progressPct,
  } = achievement;

  const formattedDate = unlockedAt
    ? new Date(unlockedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div
      className={`qd-glass group relative flex flex-col justify-between overflow-hidden rounded-[2rem] p-4.5 transition-all duration-300 ${
        isUnlocked
          ? "border-2 border-amber-300/70 bg-gradient-to-br from-white/95 via-amber-50/30 to-purple-50/20 shadow-md hover:shadow-xl hover:scale-[1.02]"
          : "border-white/50 bg-white/40 opacity-75 hover:opacity-90"
      }`}
    >
      {/* Top row: Badge Icon + Status Tag */}
      <div className="flex items-start justify-between gap-2">
        <div
          className={`flex h-13 w-13 items-center justify-center rounded-2xl text-2xl shadow-sm transition-transform duration-300 group-hover:scale-110 ${
            isUnlocked
              ? "bg-gradient-to-tr from-amber-200 via-yellow-100 to-amber-300 shadow-amber-200/50"
              : "bg-slate-200/80 grayscale"
          }`}
        >
          {emoji}
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
              isUnlocked
                ? "bg-amber-100 text-amber-800"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {category}
          </span>
          <span className="text-[10px] font-black text-amber-600">
            +{diamondReward} 💎
          </span>
        </div>
      </div>

      {/* Middle: Title & Description */}
      <div className="mt-3 min-w-0">
        <h3
          className={`text-sm font-black truncate ${
            isUnlocked ? "text-qd-ink" : "text-slate-700"
          }`}
        >
          {title}
        </h3>
        <p className="mt-0.5 text-xs text-qd-muted line-clamp-2">
          {description}
        </p>
      </div>

      {/* Bottom: Progress or Unlocked info */}
      <div className="mt-4 pt-3 border-t border-white/60">
        {isUnlocked ? (
          <div className="flex items-center justify-between text-[11px] font-extrabold text-emerald-600">
            <span className="flex items-center gap-1">
              <span>✓</span> Unlocked
            </span>
            {formattedDate && (
              <span className="text-[10px] font-bold text-qd-muted">
                {formattedDate}
              </span>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between text-[10px] font-extrabold text-qd-muted">
              <span className="truncate">{conditionDescription}</span>
              <span>
                {currentValue}/{targetValue} ({progressPct}%)
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-qd-lavender to-purple-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
