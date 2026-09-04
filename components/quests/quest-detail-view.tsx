"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { EditQuestDialog } from "@/components/quests/edit-quest-dialog";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AchievementUnlockModal } from "@/components/achievements/achievement-unlock-modal";
import { BossDefeatModal } from "@/components/boss/boss-defeat-modal";
import {
  completeQuestAction,
  type QuestDetailData,
  type QuestCompletionResponse,
  type BossDefeatedInfo,
  type UnlockedAchievementInfo,
} from "@/lib/actions/quest";
import {
  XP_BY_DIFFICULTY,
  DIAMONDS_BY_DIFFICULTY,
} from "@/lib/gamification";

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Study: { bg: "bg-[#ece7ff]", text: "text-qd-lavender" },
  Health: { bg: "bg-[#ffe8ef]", text: "text-qd-rose" },
  Craft: { bg: "bg-[#fff4d6]", text: "text-amber-800" },
  Code: { bg: "bg-[#e7fff8]", text: "text-teal-800" },
  Daily: { bg: "bg-[#f1f0fa]", text: "text-qd-ink" },
  Story: { bg: "bg-[#eef2ff]", text: "text-indigo-800" },
  Focus: { bg: "bg-[#f1f0fa]", text: "text-qd-ink" },
};

export function QuestDetailView({
  initialQuest,
}: {
  initialQuest: QuestDetailData;
}) {
  const [quest, setQuest] = useState<QuestDetailData>(initialQuest);
  const [isPending, startTransition] = useTransition();
  const [rewardToast, setRewardToast] = useState<QuestCompletionResponse | null>(null);
  const [bossDefeatedModal, setBossDefeatedModal] = useState<BossDefeatedInfo | null>(null);
  const [achievementModal, setAchievementModal] = useState<UnlockedAchievementInfo | null>(null);

  const categoryStyle = CATEGORY_COLORS[quest.category ?? "Focus"] ?? {
    bg: "bg-white/80",
    text: "text-qd-ink",
  };

  const handleComplete = () => {
    if (quest.isCompletedToday || isPending) return;

    startTransition(async () => {
      const res = await completeQuestAction({ questId: quest.id });
      if (res.success && res.data) {
        const now = new Date();
        setQuest((prev) => ({
          ...prev,
          isCompletedToday: true,
          totalCompletions: prev.totalCompletions + 1,
          totalXpEarned: prev.totalXpEarned + res.data!.xpAwarded,
          totalDiamondsEarned: prev.totalDiamondsEarned + res.data!.diamondsAwarded,
          completions: [
            {
              id: `comp-${Date.now()}`,
              completedAt: now,
              xpAwarded: res.data!.xpAwarded,
              diamondsAwarded: res.data!.diamondsAwarded,
            },
            ...prev.completions,
          ],
        }));

        if (res.data.bossDefeated) {
          setBossDefeatedModal(res.data.bossDefeated);
        }

        if (res.data.newAchievements && res.data.newAchievements.length > 0) {
          setAchievementModal(res.data.newAchievements[0]);
        }

        setRewardToast(res.data);
        setTimeout(() => {
          setRewardToast((current) =>
            current?.questId === res.data!.questId ? null : current
          );
        }, 4000);
      }
    });
  };

  return (
    <>
      {/* Achievement Unlocked Modal */}
      {achievementModal && (
        <AchievementUnlockModal
          achievement={achievementModal}
          onClose={() => setAchievementModal(null)}
        />
      )}

      {/* Boss Defeated Modal */}
      {bossDefeatedModal && (
        <BossDefeatModal
          info={bossDefeatedModal}
          onClose={() => setBossDefeatedModal(null)}
        />
      )}

      {/* Reward Toast */}
      {rewardToast && (
        <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="qd-glass flex items-center gap-3 rounded-full border-2 border-white bg-white/95 px-5 py-3 shadow-2xl backdrop-blur-xl">
            <span className="text-2xl animate-bounce">🎉</span>
            <div>
              <p className="text-xs font-black text-qd-ink">
                {rewardToast.leveledUp
                  ? `Level Up! Reached Level ${rewardToast.newLevel}!`
                  : "Quest Completed!"}
              </p>
              <p className="text-[11px] font-bold text-qd-lavender">
                +{rewardToast.xpAwarded} XP · +{rewardToast.diamondsAwarded} 💎 · {rewardToast.newStreak} 🔥 Streak
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Breadcrumb & Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/quests"
          className="inline-flex items-center gap-1.5 text-xs font-black text-qd-lavender hover:underline"
        >
          <span>←</span> Back to Quests
        </Link>
        <EditQuestDialog quest={quest} onQuestUpdated={setQuest} />
      </div>

      {/* Main Quest Hero Card */}
      <section className="qd-glass mt-4 rounded-[2rem] p-6 border border-purple-200/50 bg-gradient-to-br from-white/90 to-purple-50/30 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wider ${categoryStyle.bg} ${categoryStyle.text}`}
          >
            {quest.category || "Focus"}
          </span>
          <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-black text-qd-muted">
            +{XP_BY_DIFFICULTY[quest.difficulty]} XP · +
            {DIAMONDS_BY_DIFFICULTY[quest.difficulty]} 💎
          </span>
          <span className="rounded-full bg-qd-ink/5 px-2.5 py-0.5 text-xs font-bold text-qd-muted">
            {quest.frequency.toLowerCase()}
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-black text-qd-ink">{quest.title}</h1>
        {quest.description && (
          <p className="mt-2 text-sm text-qd-muted leading-relaxed">
            {quest.description}
          </p>
        )}

        {quest.chainTitle && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-purple-100/70 px-2.5 py-1 text-xs font-bold text-purple-800">
            <span>🔗 Part of Chain:</span>
            <span className="font-extrabold">{quest.chainTitle}</span>
          </div>
        )}

        {/* Completion status & button */}
        <div className="mt-6 flex items-center justify-between border-t border-purple-100/60 pt-4">
          <div>
            <p className="text-xs font-extrabold text-qd-muted uppercase tracking-wider">
              Today&apos;s Status
            </p>
            <p
              className={`text-sm font-black mt-0.5 ${
                quest.isCompletedToday ? "text-emerald-600" : "text-qd-ink"
              }`}
            >
              {quest.isCompletedToday
                ? "✓ Completed for today!"
                : "Ready to conquer"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleComplete}
            disabled={quest.isCompletedToday || isPending}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition active:scale-95 ${
              quest.isCompletedToday
                ? "bg-emerald-100 text-emerald-800 shadow-sm opacity-90 cursor-default"
                : "bg-gradient-to-r from-qd-lavender to-purple-600 text-white shadow-md shadow-qd-lavender/30 hover:opacity-95"
            }`}
          >
            {isPending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : quest.isCompletedToday ? (
              <>
                <span>✓</span> Completed
              </>
            ) : (
              <>
                <span>⚔️</span> Complete Quest
              </>
            )}
          </button>
        </div>
      </section>

      {/* Lifetime Performance Statistics */}
      <section className="mt-4">
        <h2 className="text-sm font-black text-qd-ink">Lifetime Stats</h2>
        <div className="mt-2 grid grid-cols-3 gap-2.5">
          <div className="qd-glass rounded-2xl p-3.5 text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-qd-muted">
              Completions
            </p>
            <p className="mt-1 text-xl font-black text-qd-ink">
              {quest.totalCompletions}
            </p>
          </div>
          <div className="qd-glass rounded-2xl p-3.5 text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-qd-muted">
              Total XP
            </p>
            <p className="mt-1 text-xl font-black text-qd-lavender">
              +{quest.totalXpEarned}
            </p>
          </div>
          <div className="qd-glass rounded-2xl p-3.5 text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-qd-muted">
              Total Gems
            </p>
            <p className="mt-1 text-xl font-black text-amber-600">
              +{quest.totalDiamondsEarned} 💎
            </p>
          </div>
        </div>
      </section>

      {/* Completion History Log */}
      <section className="mt-5 pb-8 flex-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-qd-ink">Completion Log</h2>
          <span className="text-[11px] font-bold text-qd-muted">
            {quest.completions.length} records
          </span>
        </div>

        <div className="mt-2.5 space-y-2">
          {quest.completions.length === 0 ? (
            <div className="qd-glass rounded-2xl p-6 text-center">
              <span className="text-2xl">🌱</span>
              <p className="mt-1 text-xs font-black text-qd-ink">
                No completions recorded yet
              </p>
              <p className="mt-0.5 text-[11px] text-qd-muted">
                Complete this quest today to record your first milestone!
              </p>
            </div>
          ) : (
            quest.completions.map((comp, idx) => {
              const dateStr = new Date(comp.completedAt).toLocaleDateString(
                "en-US",
                {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
              );
              const timeStr = new Date(comp.completedAt).toLocaleTimeString(
                "en-US",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              );

              return (
                <div
                  key={comp.id || idx}
                  className="qd-glass flex items-center justify-between rounded-2xl p-3.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">
                      ✓
                    </span>
                    <div>
                      <p className="text-xs font-black text-qd-ink">{dateStr}</p>
                      <p className="text-[10px] font-bold text-qd-muted">{timeStr}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-[#ece7ff] px-2 py-0.5 text-[10px] font-black text-qd-lavender">
                      +{comp.xpAwarded} XP
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <BottomNav active="/quests" />
    </>
  );
}
