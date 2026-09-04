"use client";

import { useState } from "react";
import { AchievementCard } from "@/components/achievements/achievement-card";
import { BottomNav } from "@/components/layout/bottom-nav";
import type {
  AchievementsGalleryData,
  AchievementItemData,
} from "@/lib/actions/achievements";
import type { AchievementCategory } from "@/lib/gamification/achievements";

export function AchievementsGallery({
  initialData,
}: {
  initialData: AchievementsGalleryData;
}) {
  const [filter, setFilter] = useState<"ALL" | AchievementCategory>("ALL");
  const { totalUnlocked, totalAchievements, overallProgressPct, achievements } =
    initialData;

  const filteredAchievements = achievements.filter((a) => {
    if (filter === "ALL") return true;
    return a.category === filter;
  });

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-qd-ink">Trophy Room</h1>
          <p className="text-xs text-qd-muted">Collect badges & earn diamond bonuses</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff4d6] text-2xl shadow-sm">
          🏆
        </div>
      </header>

      {/* Overview Progress Banner */}
      <section className="qd-glass mt-4 rounded-[2rem] p-5 border border-amber-200/50 bg-gradient-to-br from-white/90 via-amber-50/25 to-purple-50/20 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">
              Badge Collection
            </span>
            <h2 className="mt-0.5 text-lg font-black text-qd-ink">
              {totalUnlocked} of {totalAchievements} Unlocked
            </h2>
            <p className="text-xs text-qd-muted">
              {overallProgressPct === 100
                ? "Incredible! You have unlocked all trophies!"
                : `${totalAchievements - totalUnlocked} more badges waiting to be conquered.`}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-black text-amber-600">
              {overallProgressPct}%
            </span>
            <span className="text-[9px] font-black uppercase text-qd-muted">
              Complete
            </span>
          </div>
        </div>

        <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-amber-100/60 p-0.5 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 transition-all duration-700 ease-out"
            style={{ width: `${overallProgressPct}%` }}
          />
        </div>
      </section>

      {/* Category Tabs */}
      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
        {[
          { key: "ALL", label: "All Badges" },
          { key: "MILESTONES", label: "Milestones" },
          { key: "STREAKS", label: "Streaks" },
          { key: "COMBAT", label: "Bosses" },
          { key: "STORY", label: "Chains" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-black transition ${
              filter === tab.key
                ? "bg-qd-lavender text-white shadow-sm"
                : "bg-white/80 text-qd-muted hover:bg-white hover:text-qd-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pb-6 flex-1">
        {filteredAchievements.map((achievement) => (
          <AchievementCard
            key={achievement.key}
            achievement={achievement}
          />
        ))}
      </div>

      <BottomNav active="/achievements" />
    </>
  );
}
