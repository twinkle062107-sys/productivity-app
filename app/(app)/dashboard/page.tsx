import { getOrCreateCurrentUser, type CurrentUserWithQuests, type QuestWithCompletions } from "@/lib/user";
import { isQuestCompletedForOccurrence, type Difficulty, type Frequency } from "@/lib/gamification";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import type { QuestData } from "@/components/quests/quest-item";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user: CurrentUserWithQuests = await getOrCreateCurrentUser();
  const now = new Date();

  const formattedQuests: QuestData[] = user.quests.map((q: QuestWithCompletions) => {
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

  const userData = {
    name: user.name,
    level: user.level,
    currentXp: user.currentXp,
    diamonds: user.diamonds,
    streakCount: user.streakCount,
    longestStreak: user.longestStreak,
  };

  return (
    <DashboardClient
      initialUser={userData}
      initialQuests={formattedQuests}
    />
  );
}
