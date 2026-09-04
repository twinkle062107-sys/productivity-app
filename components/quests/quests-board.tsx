"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreateQuestDialog } from "@/components/quests/create-quest-dialog";
import { QuestItem, type QuestData } from "@/components/quests/quest-item";
import { BottomNav } from "@/components/layout/bottom-nav";
import { type QuestCompletionResponse } from "@/lib/actions/quest";

export function QuestsBoard({
  initialQuests,
}: {
  initialQuests: QuestData[];
}) {
  const router = useRouter();
  const [quests, setQuests] = useState<QuestData[]>(initialQuests);
  const [filter, setFilter] = useState<"ALL" | "DAILY" | "WEEKLY" | "ONCE">("ALL");
  const [rewardToast, setRewardToast] = useState<QuestCompletionResponse | null>(null);

  useEffect(() => {
    setQuests(initialQuests);
  }, [initialQuests]);

  const handleQuestCompleted = (res: QuestCompletionResponse) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === res.questId ? { ...q, isCompletedToday: true } : q))
    );
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

  const filteredQuests = quests.filter((q) => {
    if (filter === "ALL") return true;
    return q.frequency === filter;
  });

  return (
    <>
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-qd-ink">Quest Board</h1>
          <p className="text-xs text-qd-muted">Track and conquer your daily challenges</p>
        </div>
        <CreateQuestDialog onQuestCreated={handleQuestCreated} />
      </div>

      {/* Filter Tabs */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {(["ALL", "DAILY", "WEEKLY", "ONCE"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold transition ${
              filter === tab
                ? "bg-qd-lavender text-white shadow-sm"
                : "bg-white/80 text-qd-muted hover:bg-white"
            }`}
          >
            {tab === "ALL" ? "All Quests" : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Quests List */}
      <div className="mt-4 space-y-2.5 flex-1">
        {filteredQuests.length === 0 ? (
          <div className="qd-glass mt-4 flex flex-col items-center rounded-[2rem] p-8 text-center">
            <span className="text-3xl">⚔️</span>
            <p className="mt-2 text-sm font-extrabold text-qd-ink">No quests in this category</p>
            <p className="mt-1 text-xs text-qd-muted">Create a new quest to fill your quest log!</p>
          </div>
        ) : (
          filteredQuests.map((quest) => (
            <QuestItem
              key={quest.id}
              quest={quest}
              onCompleted={handleQuestCompleted}
              onDeleted={handleQuestDeleted}
            />
          ))
        )}
      </div>

      <BottomNav active="/quests" />
    </>
  );
}
