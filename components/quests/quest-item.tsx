"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  completeQuestAction,
  deleteQuestAction,
  type QuestCompletionResponse,
} from "@/lib/actions/quest";
import {
  XP_BY_DIFFICULTY,
  DIAMONDS_BY_DIFFICULTY,
  type Difficulty,
  type Frequency,
} from "@/lib/gamification";

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
  onDeleted,
}: {
  quest: QuestData;
  onCompleted?: (result: QuestCompletionResponse) => void;
  onDeleted?: (questId: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [completedLocally, setCompletedLocally] = useState(quest.isCompletedToday);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCompleted = quest.isCompletedToday || completedLocally;
  const categoryStyle = CATEGORY_COLORS[quest.category ?? "Daily"] ?? {
    bg: "bg-white/80",
    text: "text-qd-ink",
  };

  const handleComplete = () => {
    if (isCompleted || isPending || deleted) return;
    setError(null);
    // Optimistically mark as completed to prevent double-click race
    setCompletedLocally(true);

    startTransition(async () => {
      const res = await completeQuestAction({ questId: quest.id });
      if (res.success && res.data) {
        onCompleted?.(res.data);
      } else {
        // Roll back optimistic update on failure
        setCompletedLocally(false);
        setError(res.error ?? "Failed to complete quest.");
      }
    });
  };

  const handleDelete = () => {
    if (isPending || deleted) return;
    setError(null);

    startTransition(async () => {
      const res = await deleteQuestAction(quest.id);
      if (res.success) {
        setDeleted(true);
        onDeleted?.(quest.id);
      } else {
        setError(res.error ?? "Failed to remove quest.");
      }
    });
  };

  if (deleted) {
    return null;
  }

  return (
    <div
      className={`qd-glass group relative flex items-center justify-between gap-3 rounded-[1.8rem] p-4 transition-all duration-300 ${
        isCompleted
          ? "border-emerald-200/50 bg-white/40 opacity-70"
          : "hover:border-qd-lavender/40 hover:shadow-lg"
      }`}
    >
      <Link
        href={`/quests/${quest.id}`}
        className="flex flex-1 flex-col gap-1.5 min-w-0 transition hover:opacity-85"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${categoryStyle.bg} ${categoryStyle.text}`}
          >
            {quest.category || "Focus"}
          </span>
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-extrabold text-qd-muted">
            +{XP_BY_DIFFICULTY[quest.difficulty] ?? 25} XP · +
            {DIAMONDS_BY_DIFFICULTY[quest.difficulty] ?? 2} 💎
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

        {error && (
          <p className="text-[11px] font-bold text-rose-500">{error}</p>
        )}
      </Link>

      <div className="flex flex-shrink-0 items-center gap-1.5">
        {/* Delete button */}
        {!isCompleted && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            aria-label={`Delete quest ${quest.title}`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-qd-muted/40 transition duration-200 hover:bg-rose-50 hover:text-rose-400 active:scale-90 disabled:opacity-30"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* Complete button */}
        <button
          type="button"
          onClick={handleComplete}
          disabled={isCompleted || isPending}
          aria-label={
            isCompleted ? "Quest completed" : `Complete quest ${quest.title}`
          }
          className={`flex h-10 w-10 items-center justify-center rounded-full transition duration-200 active:scale-90 ${
            isCompleted
              ? "bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-200"
              : "border-2 border-qd-lavender/40 bg-white text-qd-lavender shadow-sm hover:border-qd-lavender hover:bg-qd-lavender/10"
          }`}
        >
          {isPending && !completedLocally ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-qd-lavender border-t-transparent" />
          ) : isCompleted ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <span className="text-xs font-black">✓</span>
          )}
        </button>
      </div>
    </div>
  );
}
