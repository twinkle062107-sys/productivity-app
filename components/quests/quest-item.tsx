"use client";

import { useState, useTransition } from "react";
import { completeQuestAction, type QuestCompletionResponse } from "@/lib/actions/quest";
import { XP_BY_DIFFICULTY, DIAMONDS_BY_DIFFICULTY, type Difficulty, type Frequency } from "@/lib/gamification";

export interface QuestData {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  difficulty: Difficulty;
  frequency: Frequency;
  isCompletedToday: boolean;
  completionsCount?: number;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Study: { bg: "bg-[#ece7ff]", text: "text-qd-lavender" },
  Health: { bg: "bg-[#ffe8ef]", text: "text-qd-rose" },
  Craft: { bg: "bg-[#fff4d6]", text: "text-amber-800" },
  Code: { bg: "bg-[#e7fff8]", text: "text-teal-800" },
  Daily: { bg: "bg-[#f1f0fa]", text: "text-qd-ink" },
};

export function QuestItem({
  quest,
  onCompleted,
}: {
  quest: QuestData;
  onCompleted?: (result: QuestCompletionResponse) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [completedLocally, setCompletedLocally] = useState(quest.isCompletedToday);
  const [error, setError] = useState<string | null>(null);

  const isCompleted = quest.isCompletedToday || completedLocally;
  const categoryStyle = CATEGORY_COLORS[quest.category ?? "Daily"] ?? {
    bg: "bg-white/80",
    text: "text-qd-ink",
  };

  const handleComplete = () => {
    if (isCompleted || isPending) return;
    setError(null);

    startTransition(async () => {
      const res = await completeQuestAction({ questId: quest.id });
      if (res.success && res.data) {
        setCompletedLocally(true);
        onCompleted?.(res.data);
      } else {
        setError(res.error ?? "Failed to complete quest");
      }
    });
  };

  return (
    <div
      className={`qd-glass group relative flex items-center justify-between gap-3 rounded-[1.8rem] p-4 transition-all duration-300 ${
        isCompleted
          ? "border-emerald-200/50 bg-white/40 opacity-70"
          : "hover:border-qd-lavender/40 hover:shadow-lg"
      }`}
    >
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${categoryStyle.bg} ${categoryStyle.text}`}
          >
            {quest.category || "Focus"}
          </span>
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-extrabold text-qd-muted">
            +{XP_BY_DIFFICULTY[quest.difficulty] ?? 25} XP · +{DIAMONDS_BY_DIFFICULTY[quest.difficulty] ?? 2} 💎
          </span>
          {quest.frequency !== "DAILY" && (
            <span className="rounded-full bg-qd-ink/5 px-2 py-0.5 text-[10px] font-bold text-qd-muted">
              {quest.frequency.toLowerCase()}
            </span>
          )}
        </div>

        <p
          className={`truncate text-sm font-extrabold text-qd-ink transition ${
            isCompleted ? "line-through text-qd-muted" : ""
          }`}
        >
          {quest.title}
        </p>

        {error && <p className="text-[11px] font-bold text-rose-500">{error}</p>}
      </div>

      <button
        type="button"
        onClick={handleComplete}
        disabled={isCompleted || isPending}
        aria-label={isCompleted ? "Quest completed" : `Complete quest ${quest.title}`}
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition duration-200 active:scale-90 ${
          isCompleted
            ? "bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-200"
            : "border-2 border-qd-lavender/40 bg-white text-qd-lavender shadow-sm hover:border-qd-lavender hover:bg-qd-lavender/10"
        }`}
      >
        {isPending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-qd-lavender border-t-transparent" />
        ) : isCompleted ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <span className="text-xs font-black">✓</span>
        )}
      </button>
    </div>
  );
}
