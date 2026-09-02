"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  calculateRewards,
  calculateLevel,
  calculateStreak,
  isQuestCompletedForOccurrence,
  type Difficulty,
  type Frequency,
} from "@/lib/gamification";
import {
  questDraftSchema,
  completeQuestSchema,
  type QuestDraft,
  type CompleteQuestInput,
} from "@/lib/validations/quest";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface QuestCompletionResponse {
  questId: string;
  xpAwarded: number;
  diamondsAwarded: number;
  newStreak: number;
  newLevel: number;
  newTotalXp: number;
  leveledUp: boolean;
}

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Non-fatal if invoked outside Next.js request context (e.g. testing)
  }
}

/**
 * Verifies the request is authenticated (defense-in-depth in addition to
 * proxy.ts route protection). Returns the authenticated user or null.
 */
async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  return user;
}

/**
 * Creates a new productivity quest for the active user.
 */
export async function createQuestAction(
  data: QuestDraft
): Promise<ActionResult<{ id: string; title: string }>> {
  try {
    const parseResult = questDraftSchema.safeParse(data);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message ?? "Invalid quest data",
      };
    }

    const validated = parseResult.data;
    const user = await requireUser();
    if (!user) {
      return { success: false, error: "You must be signed in to create a quest." };
    }

    const quest = await prisma.quest.create({
      data: {
        userId: user.id,
        title: validated.title,
        description: validated.description || null,
        category: validated.category || "Focus",
        difficulty: validated.difficulty as Difficulty,
        frequency: validated.frequency as Frequency,
        reminderOn: validated.reminderOn,
      },
    });

    safeRevalidate("/dashboard");
    safeRevalidate("/quests");

    return {
      success: true,
      data: { id: quest.id, title: quest.title },
    };
  } catch (error) {
    console.error("Failed to create quest:", error);
    return {
      success: false,
      error: "Unable to create quest. Please try again.",
    };
  }
}

/**
 * Marks an active quest as completed, awarding XP, diamonds, updating streaks, and logging events.
 */
export async function completeQuestAction(
  input: CompleteQuestInput
): Promise<ActionResult<QuestCompletionResponse>> {
  try {
    const parseResult = completeQuestSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: "Invalid completion payload.",
      };
    }

    const { questId } = parseResult.data;
    const user = await requireUser();
    if (!user) {
      return { success: false, error: "You must be signed in to complete a quest." };
    }

    const quest = await prisma.quest.findFirst({
      where: {
        id: questId,
        userId: user.id,
        archivedAt: null,
      },
      include: {
        completions: {
          orderBy: { completedAt: "desc" },
        },
      },
    });

    if (!quest) {
      return {
        success: false,
        error: "Quest not found or has been removed.",
      };
    }

    // Use a single Date instance for all calculations and DB writes
    const now = new Date();

    // Check if already completed for the designated recurrence period
    const alreadyCompleted = isQuestCompletedForOccurrence(
      quest.frequency as Frequency,
      quest.completions,
      now
    );

    if (alreadyCompleted) {
      return {
        success: false,
        error: "This quest has already been completed for the current period.",
      };
    }

    // Calculate gamification changes
    const rewards = calculateRewards(quest.difficulty as Difficulty);
    const streakResult = calculateStreak(user.lastActiveDay, user.streakCount, now);
    const newTotalXp = user.currentXp + rewards.xp;
    const levelResult = calculateLevel(newTotalXp);
    const leveledUp = levelResult.level > user.level;
    const newDiamonds = user.diamonds + rewards.diamonds;
    const newLongestStreak = Math.max(user.longestStreak, streakResult.newStreak);

    // Execute atomic transaction for state integrity.
    // The completion record creation + user update happen together,
    // so a duplicate request hitting between the check and write will
    // either see the old state (and re-check) or the new state.
    await prisma.$transaction([
      prisma.questCompletion.create({
        data: {
          questId: quest.id,
          xpAwarded: rewards.xp,
          pointsAwarded: rewards.xp,
          diamondsAwarded: rewards.diamonds,
          completedAt: now,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          currentXp: newTotalXp,
          points: { increment: rewards.xp },
          diamonds: newDiamonds,
          level: levelResult.level,
          streakCount: streakResult.newStreak,
          longestStreak: newLongestStreak,
          lastActiveDay: now,
        },
      }),
      prisma.event.create({
        data: {
          userId: user.id,
          type: "QUEST_COMPLETED",
          payload: JSON.stringify({
            questId: quest.id,
            questTitle: quest.title,
            difficulty: quest.difficulty,
            xpEarned: rewards.xp,
            diamondsEarned: rewards.diamonds,
            streak: streakResult.newStreak,
            newLevel: levelResult.level,
          }),
        },
      }),
      ...(leveledUp
        ? [
            prisma.event.create({
              data: {
                userId: user.id,
                type: "LEVEL_UP",
                payload: JSON.stringify({
                  previousLevel: user.level,
                  newLevel: levelResult.level,
                  totalXp: newTotalXp,
                }),
              },
            }),
          ]
        : []),
    ]);

    safeRevalidate("/dashboard");
    safeRevalidate("/quests");
    safeRevalidate("/profile");

    return {
      success: true,
      data: {
        questId: quest.id,
        xpAwarded: rewards.xp,
        diamondsAwarded: rewards.diamonds,
        newStreak: streakResult.newStreak,
        newLevel: levelResult.level,
        newTotalXp,
        leveledUp,
      },
    };
  } catch (error) {
    console.error("Failed to complete quest:", error);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}

/**
 * Archives (soft-deletes) a quest. Returns an error if the quest was not found.
 */
export async function deleteQuestAction(
  questId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!questId || questId.trim().length === 0) {
      return { success: false, error: "Invalid quest ID." };
    }

    const user = await requireUser();
    if (!user) {
      return { success: false, error: "You must be signed in to remove a quest." };
    }

    const result = await prisma.quest.updateMany({
      where: {
        id: questId,
        userId: user.id,
        archivedAt: null,
      },
      data: {
        archivedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return {
        success: false,
        error: "Quest not found or already removed.",
      };
    }

    safeRevalidate("/dashboard");
    safeRevalidate("/quests");

    return { success: true, data: { id: questId } };
  } catch (error) {
    console.error("Failed to delete quest:", error);
    return {
      success: false,
      error: "Unable to remove quest. Please try again.",
    };
  }
}
