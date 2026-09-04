import { getCurrentUserWithQuests, type CurrentUserWithQuests, type QuestWithCompletions } from "@/lib/user";
import { isQuestCompletedForOccurrence, type Difficulty, type Frequency } from "@/lib/gamification";
import { QuestsBoard } from "@/components/quests/quests-board";
import type { QuestData } from "@/components/quests/quest-item";

export const dynamic = "force-dynamic";

export default async function QuestsPage() {
  const user: CurrentUserWithQuests = await getCurrentUserWithQuests();
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
      reminderOn: q.reminderOn,
      isCompletedToday,
      completionsCount: q.completions.length,
    };
  });

  return <QuestsBoard initialQuests={formattedQuests} />;
}
