"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { analyzeWeeklyProductivity } from "@/lib/ai-coach/analyzer";
import type {
  AnalyzerCompletionInput,
  AnalyzerEventInput,
  AnalyzerQuestInput,
  AnalyzerUserInput,
  WeeklyCoachInsights,
} from "@/lib/ai-coach/types";
import type { ActionResult } from "@/lib/actions/quest";
import type { Difficulty, Frequency } from "@/lib/gamification";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return prisma.user.findUnique({
    where: { id: session.user.id },
  });
}

/**
 * Loads the authenticated user's own quest history and gamification data and
 * produces personalized weekly coaching insights. All queries are scoped to
 * the current user's id so no other user's data is ever exposed.
 */
export async function getWeeklyCoachInsightsAction(): Promise<
  ActionResult<WeeklyCoachInsights>
> {
  try {
    const user = await requireUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const now = new Date();

    // Fetch the current user's active quests (needed for expected/missed math).
    const quests = await prisma.quest.findMany({
      where: {
        userId: user.id,
        archivedAt: null,
      },
      select: {
        id: true,
        title: true,
        category: true,
        difficulty: true,
        frequency: true,
        createdAt: true,
        scheduledAt: true,
        archivedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Window covering the current 7-day period plus the previous one for deltas.
    const periodStart = new Date(now);
    periodStart.setUTCDate(periodStart.getUTCDate() - 13);
    periodStart.setUTCHours(0, 0, 0, 0);

    const completions = await prisma.questCompletion.findMany({
      where: {
        quest: { userId: user.id },
        completedAt: { gte: periodStart },
      },
      include: {
        quest: {
          select: {
            id: true,
            title: true,
            category: true,
            difficulty: true,
            frequency: true,
            createdAt: true,
            scheduledAt: true,
            archivedAt: true,
          },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    // Streak Freeze usage events within the same window.
    const events = await prisma.event.findMany({
      where: {
        userId: user.id,
        type: "STREAK_FREEZE_USED",
        createdAt: { gte: periodStart },
      },
      select: {
        id: true,
        type: true,
        payload: true,
        createdAt: true,
      },
    });

    const analyzerUser: AnalyzerUserInput = {
      name: user.name,
      level: user.level,
      currentXp: user.currentXp,
      diamonds: user.diamonds,
      streakCount: user.streakCount,
      longestStreak: user.longestStreak,
      streakFreezes: user.streakFreezes,
    };

    const analyzerQuests: AnalyzerQuestInput[] = quests.map((q) => ({
      id: q.id,
      title: q.title,
      category: q.category,
      difficulty: (q.difficulty ?? "MEDIUM") as Difficulty,
      frequency: (q.frequency ?? "DAILY") as Frequency,
      createdAt: q.createdAt,
      scheduledAt: q.scheduledAt,
      archivedAt: q.archivedAt,
    }));

    const analyzerCompletions: AnalyzerCompletionInput[] = completions.map(
      (c) => ({
        id: c.id,
        questId: c.questId,
        completedAt: c.completedAt,
        xpAwarded: c.xpAwarded,
        diamondsAwarded: c.diamondsAwarded,
        quest: c.quest
          ? {
              id: c.quest.id,
              title: c.quest.title,
              category: c.quest.category,
              difficulty: (c.quest.difficulty ?? "MEDIUM") as Difficulty,
              frequency: (c.quest.frequency ?? "DAILY") as Frequency,
              createdAt: c.quest.createdAt,
              scheduledAt: c.quest.scheduledAt,
              archivedAt: c.quest.archivedAt,
            }
          : null,
      })
    );

    const analyzerEvents: AnalyzerEventInput[] = events.map((e) => ({
      id: e.id,
      type: e.type,
      payload: e.payload,
      createdAt: e.createdAt,
    }));

    const insights = analyzeWeeklyProductivity(
      analyzerUser,
      analyzerQuests,
      analyzerCompletions,
      analyzerEvents,
      { now }
    );

    return { success: true, data: insights };
  } catch (error) {
    console.error("Failed to generate weekly coach insights:", error);
    return { success: false, error: "Unable to generate your weekly insights." };
  }
}