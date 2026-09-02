"use client";

import { useState } from "react";
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

  const handleQuestCompleted = (res: QuestCompletionResponse) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === res.questId ? { ...q, isCompletedToday: true } : q))
    );
  };

  const handleQuestDeleted = (questId: string) => {
    setQuests((prev) => prev.filter((q) => q.id !== questId));
  };

  const filteredQuests = quests.filter((q) => {
    if (filter === "ALL") return true;
    return q.frequency === filter;
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-qd-ink">Quest Board</h1>
          <p className="text-xs text-qd-muted">Track and conquer your daily challenges</p>
        </div>
        <CreateQuestDialog onQuestCreated={() => router.refresh()} />
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
