import { getCurrentUserFullData, type QuestWithCompletions } from "@/lib/user";
import {
  isQuestCompletedForOccurrence,
  calculateChainProgress,
  type Difficulty,
  type Frequency,
} from "@/lib/gamification";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import type { QuestData } from "@/components/quests/quest-item";
import type { BossData } from "@/lib/actions/boss";
import type { QuestChainData } from "@/lib/actions/chain";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUserFullData();
  const now = new Date();

  // Standalone quests (not part of a chain)
  const standaloneQuests = user.quests.filter((q) => !q.chainId);

  const formattedQuests: QuestData[] = standaloneQuests.map((q: QuestWithCompletions) => {
    const isCompletedToday = isQuestCompletedForOccurrence(
      q.frequency as Frequency,
      q.completions,
      now
    );

    return {
      id: q.id,
      title: q.title,
      description: q.description,
      category: q.category,
      difficulty: q.difficulty as Difficulty,
      frequency: q.frequency as Frequency,
      isCompletedToday,
      completionsCount: q.completions.length,
    };
  });

  // Active Boss
  const activeBossRecord = user.bosses.find((b) => !b.defeatedAt) ?? null;
  const initialBoss: BossData | null = activeBossRecord
    ? {
        id: activeBossRecord.id,
        title: activeBossRecord.title,
        maxHp: activeBossRecord.maxHp,
        currentHp: activeBossRecord.currentHp,
        defeatedAt: activeBossRecord.defeatedAt,
        createdAt: activeBossRecord.createdAt,
      }
    : null;

  // Quest Chains
  const initialChains: QuestChainData[] = user.chains.map((chain) => {
    const progress = calculateChainProgress(chain.quests);
    return {
      id: chain.id,
      title: chain.title,
      narrative: chain.narrative,
      completedAt: chain.completedAt,
      createdAt: chain.createdAt,
      totalSteps: progress.totalSteps,
      completedSteps: progress.completedSteps,
      progressPct: progress.progressPct,
      isCompleted: progress.isCompleted,
      currentChapterIndex: progress.currentChapterIndex,
      chapters: chain.quests.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        category: q.category,
        difficulty: q.difficulty as Difficulty,
        chapterIndex: q.chapterIndex ?? 1,
        isCompleted: q.completions.length > 0,
      })),
    };
  });

  const userData = {
    name: user.name,
    level: user.level,
    currentXp: user.currentXp,
    diamonds: user.diamonds,
    streakCount: user.streakCount,
    longestStreak: user.longestStreak,
    streakFreezes: user.streakFreezes,
  };

  return (
    <DashboardClient
      initialUser={userData}
      initialQuests={formattedQuests}
      initialBoss={initialBoss}
      initialChains={initialChains}
    />
  );
}

