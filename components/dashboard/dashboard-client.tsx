"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BlobMascot } from "@/components/brand/mascots";
import { ProgressRing } from "@/components/brand/progress-ring";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CreateQuestDialog } from "@/components/quests/create-quest-dialog";
import { QuestItem, type QuestData } from "@/components/quests/quest-item";
import { type QuestCompletionResponse } from "@/lib/actions/quest";
import { calculateLevel } from "@/lib/gamification";

export interface DashboardUserProps {
  name?: string | null;
  level: number;
  currentXp: number;
  diamonds: number;
  streakCount: number;
  longestStreak: number;
}

export interface DashboardClientProps {
  initialUser: DashboardUserProps;
  initialQuests: QuestData[];
}

const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function DashboardClient({
  initialUser,
  initialQuests,
}: DashboardClientProps) {
  const router = useRouter();
  const [user, setUser] = useState<DashboardUserProps>(initialUser);
  const [quests, setQuests] = useState<QuestData[]>(initialQuests);
  const [rewardToast, setRewardToast] = useState<QuestCompletionResponse | null>(null);

  useEffect(() => {
    setQuests(initialQuests);
  }, [initialQuests]);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const completedCount = quests.filter((q) => q.isCompletedToday).length;
  const totalCount = quests.length;
  const focusPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const levelInfo = calculateLevel(user.currentXp);

  // Focus quest is the first uncompleted quest, or the first quest
  const focusQuest = quests.find((q) => !q.isCompletedToday) ?? quests[0];

  // Category statistics calculation
  const categoryStats = quests.reduce((acc, q) => {
    const cat = q.category || "Focus";
    if (!acc[cat]) {
      acc[cat] = { total: 0, completed: 0 };
    }
    acc[cat].total += 1;
    if (q.isCompletedToday) acc[cat].completed += 1;
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  const categoryCards = Object.entries(categoryStats).map(([name, stats]) => {
    const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    let color = "bg-[#ece7ff]";
    let bar = "bg-qd-lavender";
    if (name === "Health") {
      color = "bg-[#ffe8ef]";
      bar = "bg-qd-pink";
    } else if (name === "Craft") {
      color = "bg-[#fff4d6]";
      bar = "bg-qd-sun";
    } else if (name === "Code") {
      color = "bg-[#e7fff8]";
      bar = "bg-emerald-400";
    }
    return { name, color, bar, pct };
  });

  const handleQuestCompleted = (res: QuestCompletionResponse) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === res.questId ? { ...q, isCompletedToday: true } : q))
    );

    setUser((prev) => ({
      ...prev,
      level: res.newLevel,
      currentXp: res.newTotalXp,
      diamonds: prev.diamonds + res.diamondsAwarded,
      streakCount: res.newStreak,
      longestStreak: Math.max(prev.longestStreak, res.newStreak),
    }));

    setRewardToast(res);
    setTimeout(() => {
      setRewardToast((current) => (current?.questId === res.questId ? null : current));
    }, 4000);
  };

  const handleQuestCreated = (newQuest: QuestData) => {
    setQuests((prev) => [newQuest, ...prev.filter((q) => q.id !== newQuest.id)]);
    router.refresh();
  };

  const handleQuestDeleted = (questId: string) => {
    setQuests((prev) => prev.filter((q) => q.id !== questId));
    router.refresh();
  };

  // Day of week index for streak display (0 is Sunday, map to Monday-first 0..6)
  const todayIndex = (new Date().getDay() + 6) % 7;

  return (
    <>
      {/* Reward Celebration Notification */}
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

      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-qd-muted">
              QuestDaily
            </p>
            <span className="rounded-full bg-[#e7fff8] px-2 py-0.5 text-[10px] font-extrabold text-teal-800">
              Lv. {levelInfo.level}
            </span>
            <span className="rounded-full bg-[#fff4d6] px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
              {user.diamonds} 💎
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-qd-ink">Good day, {user.name || "Hero"}!</h1>
        </div>
        <div className="flex items-center gap-2">
          <BlobMascot className="h-14 w-14" />
        </div>
      </header>

      {/* Today's Focus Card */}
      <section className="qd-glass mt-6 rounded-[2rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-qd-muted">
              Today&apos;s Focus
            </p>
            <h2 className="mt-1 truncate text-lg font-extrabold text-qd-ink">
              {focusQuest ? focusQuest.title : "All Quests Complete!"}
            </h2>
            <p className="text-sm text-qd-muted">
              {focusQuest
                ? focusQuest.isCompletedToday
                  ? "Great job! Completed for today"
                  : `Earn +${focusQuest.difficulty} rewards`
                : "Add a new quest below to start playing"}
            </p>
            <p className="mt-3 text-xs font-bold text-qd-lavender">
              {completedCount} / {totalCount} complete ({focusPct}%)
            </p>
          </div>
          <ProgressRing value={focusPct} />
        </div>
      </section>

      {/* Streak Tracker */}
      <section className="qd-glass mt-4 rounded-[2rem] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-extrabold text-qd-ink">Quest streak</p>
            <p className="text-sm text-qd-muted">
              {user.streakCount > 0
                ? `${user.streakCount} day streak active! Keep going.`
                : "Complete a quest today to start your streak!"}
            </p>
          </div>
          <span className="rounded-full bg-[#fff4d6] px-3 py-1 text-sm font-extrabold text-amber-900 shadow-sm">
            {user.streakCount} 🔥
          </span>
        </div>
        <div className="mt-4 flex justify-between">
          {WEEK_DAYS.map((day, i) => {
            const isToday = i === todayIndex;
            const isPastActive = i < todayIndex && user.streakCount > (todayIndex - i);
            const isDone = (isToday && completedCount > 0) || isPastActive;

            return (
              <div key={`${day}-${i}`} className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                    isDone
                      ? "bg-qd-lavender text-white shadow-md"
                      : isToday
                      ? "border-2 border-qd-lavender bg-white/90 text-qd-lavender"
                      : "bg-white/80 text-qd-muted"
                  }`}
                >
                  {isDone ? "✓" : day}
                </span>
                {isToday && (
                  <span className="h-1 w-1 rounded-full bg-qd-lavender" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Active Quests List */}
      <section className="mt-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-qd-ink">Active Quests</h3>
            <p className="text-xs text-qd-muted">Tap checkmark to earn XP & gems</p>
          </div>
          <CreateQuestDialog onQuestCreated={handleQuestCreated} />
        </div>

        {quests.length === 0 ? (
          <div className="qd-glass flex flex-col items-center rounded-[2rem] p-6 text-center">
            <span className="text-3xl">✨</span>
            <p className="mt-2 text-sm font-extrabold text-qd-ink">No quests created yet</p>
            <p className="mt-1 text-xs text-qd-muted">Create your first quest to start earning XP and diamonds!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {quests.map((quest) => (
              <QuestItem
                key={quest.id}
                quest={quest}
                onCompleted={handleQuestCompleted}
                onDeleted={handleQuestDeleted}
              />
            ))}
          </div>
        )}
      </section>

      {/* Categories Progress */}
      {categoryCards.length > 0 && (
        <section className="mt-5">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-qd-ink">Categories</h3>
            <span className="text-xs font-bold text-qd-muted">Live Progress</span>
          </div>
          <div className="-mx-1 mt-3 flex gap-3 overflow-x-auto pb-2">
            {categoryCards.map((cat) => (
              <div
                key={cat.name}
                className={`min-w-[7.5rem] flex-shrink-0 rounded-[1.4rem] p-4 shadow-sm ${cat.color}`}
              >
                <p className="font-extrabold text-qd-ink">{cat.name}</p>
                <p className="mt-1 text-[11px] font-bold text-qd-muted">{cat.pct}% complete</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/70">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${cat.bar}`}
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Action Tiles */}
      <section className="mt-4 grid grid-cols-4 gap-3">
        {[
          { name: "Chains", tint: "bg-[#ece7ff]", emoji: "🔗" },
          { name: "Bosses", tint: "bg-[#ffe8ef]", emoji: "🐉" },
          { name: "Freeze", tint: "bg-[#e7fff8]", emoji: "❄" },
          { name: "Season", tint: "bg-[#fff4d6]", emoji: "✦" },
        ].map((action) => (
          <div key={action.name} className="flex flex-col items-center gap-1.5 opacity-80 transition hover:opacity-100">
            <div
              className={`flex h-13 w-13 items-center justify-center rounded-2xl text-xl shadow-sm ${action.tint}`}
            >
              {action.emoji}
            </div>
            <p className="text-[10px] font-bold text-qd-muted">{action.name}</p>
          </div>
        ))}
      </section>

      <BottomNav active="/dashboard" />
    </>
  );
}
