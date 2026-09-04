"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  calculateRewards,
  calculateLevel,
  calculateStreak,
  calculateStreakWithFreeze,
  isQuestCompletedForOccurrence,
  calculateBossDamage,
  applyBossDamage,
  calculateBossRewards,
  type Difficulty,
  type Frequency,
} from "@/lib/gamification";
import {
  questDraftSchema,
  completeQuestSchema,
  type QuestDraft,
  type CompleteQuestInput,
} from "@/lib/validations/quest";
import { evaluateAndGrantAchievementsInTx } from "@/lib/actions/achievements";
import type { AchievementDef } from "@/lib/gamification/achievements";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BossDamageInfo {
  damage: number;
  remainingHp: number;
  maxHp: number;
  bossTitle: string;
}

export interface BossDefeatedInfo {
  bossTitle: string;
  bonusXp: number;
  bonusDiamonds: number;
}

export interface ChainCompletedInfo {
  chainTitle: string;
  bonusXp: number;
  bonusDiamonds: number;
}

export interface UnlockedAchievementInfo {
  key: string;
  title: string;
  description: string;
  emoji: string;
  diamondReward: number;
}

export interface QuestCompletionResponse {
  questId: string;
  xpAwarded: number;
  diamondsAwarded: number;
  newStreak: number;
  newLevel: number;
  newTotalXp: number;
  leveledUp: boolean;
  streakFreezeUsed?: boolean;
  bossDamage?: BossDamageInfo;
  bossDefeated?: BossDefeatedInfo;
  chainCompleted?: ChainCompletedInfo;
  newAchievements?: UnlockedAchievementInfo[];
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

export interface CreatedQuestResponse {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: Difficulty;
  frequency: Frequency;
  isCompletedToday: boolean;
  completionsCount: number;
}

/**
 * Creates a new productivity quest for the active user.
 */
export async function createQuestAction(
  data: QuestDraft
): Promise<ActionResult<CreatedQuestResponse>> {
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
      data: {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        category: quest.category,
        difficulty: quest.difficulty as Difficulty,
        frequency: quest.frequency as Frequency,
        isCompletedToday: false,
        completionsCount: 0,
      },
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
 * Marks an active quest as completed, awarding XP, diamonds, updating streaks, damaging active bosses, and logging events.
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
        chain: true,
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

    // Calculate base gamification changes (with streak freeze protection)
    const rewards = calculateRewards(quest.difficulty as Difficulty);
    const streakResult = calculateStreakWithFreeze(
      user.lastActiveDay,
      user.streakCount,
      user.streakFreezes,
      now
    );

    let totalXpGained = rewards.xp;
    let totalDiamondsGained = rewards.diamonds;

    // Boss damage calculation
    const activeBoss = await prisma.boss.findFirst({
      where: {
        userId: user.id,
        defeatedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    let bossDamage: BossDamageInfo | undefined;
    let bossDefeated: BossDefeatedInfo | undefined;
    let bossUpdateOp = null;
    let bossDefeatEventOp = null;

    if (activeBoss) {
      const dmg = calculateBossDamage(quest.difficulty as Difficulty);
      const bossResult = applyBossDamage(activeBoss.currentHp, dmg);

      if (bossResult.isDefeated) {
        const bossLoot = calculateBossRewards(activeBoss.maxHp);
        totalXpGained += bossLoot.xp;
        totalDiamondsGained += bossLoot.diamonds;

        bossDefeated = {
          bossTitle: activeBoss.title,
          bonusXp: bossLoot.xp,
          bonusDiamonds: bossLoot.diamonds,
        };

        bossUpdateOp = prisma.boss.update({
          where: { id: activeBoss.id },
          data: {
            currentHp: 0,
            defeatedAt: now,
          },
        });

        bossDefeatEventOp = prisma.event.create({
          data: {
            userId: user.id,
            type: "BOSS_DEFEATED",
            payload: JSON.stringify({
              bossId: activeBoss.id,
              title: activeBoss.title,
              maxHp: activeBoss.maxHp,
              bonusXp: bossLoot.xp,
              bonusDiamonds: bossLoot.diamonds,
            }),
          },
        });
      } else {
        bossDamage = {
          damage: dmg,
          remainingHp: bossResult.remainingHp,
          maxHp: activeBoss.maxHp,
          bossTitle: activeBoss.title,
        };

        bossUpdateOp = prisma.boss.update({
          where: { id: activeBoss.id },
          data: {
            currentHp: bossResult.remainingHp,
          },
        });
      }
    }

    // Quest Chain progression calculation
    let chainCompleted: ChainCompletedInfo | undefined;
    let chainUpdateOp = null;
    let chainEventOp = null;

    if (quest.chainId && quest.chain && !quest.chain.completedAt) {
      const siblingQuests = await prisma.quest.findMany({
        where: {
          chainId: quest.chainId,
          archivedAt: null,
        },
        include: { completions: true },
      });

      const otherUncompleted = siblingQuests.filter(
        (q) => q.id !== quest.id && q.completions.length === 0
      );

      if (otherUncompleted.length === 0) {
        const chainBonusXp = 100;
        const chainBonusDiamonds = 10;
        totalXpGained += chainBonusXp;
        totalDiamondsGained += chainBonusDiamonds;

        chainCompleted = {
          chainTitle: quest.chain.title,
          bonusXp: chainBonusXp,
          bonusDiamonds: chainBonusDiamonds,
        };

        chainUpdateOp = prisma.questChain.update({
          where: { id: quest.chainId },
          data: { completedAt: now },
        });

        chainEventOp = prisma.event.create({
          data: {
            userId: user.id,
            type: "CHAIN_COMPLETED",
            payload: JSON.stringify({
              chainId: quest.chainId,
              title: quest.chain.title,
              bonusXp: chainBonusXp,
              bonusDiamonds: chainBonusDiamonds,
            }),
          },
        });
      }
    }

    const newTotalXp = user.currentXp + totalXpGained;
    const levelResult = calculateLevel(newTotalXp);
    const leveledUp = levelResult.level > user.level;
    const newDiamonds = user.diamonds + totalDiamondsGained;
    const newLongestStreak = Math.max(user.longestStreak, streakResult.newStreak);

    let newlyUnlockedAchievements: AchievementDef[] = [];

    await prisma.$transaction(async (tx) => {
      await tx.questCompletion.create({
        data: {
          questId: quest.id,
          xpAwarded: rewards.xp,
          pointsAwarded: rewards.xp,
          diamondsAwarded: rewards.diamonds,
          completedAt: now,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          currentXp: newTotalXp,
          points: { increment: totalXpGained },
          diamonds: newDiamonds,
          level: levelResult.level,
          streakCount: streakResult.newStreak,
          longestStreak: newLongestStreak,
          streakFreezes: streakResult.remainingFreezes,
          lastActiveDay: now,
        },
      });

      if (streakResult.freezeUsed) {
        await tx.event.create({
          data: {
            userId: user.id,
            type: "STREAK_FREEZE_USED",
            payload: JSON.stringify({
              savedStreak: streakResult.newStreak,
              remainingFreezes: streakResult.remainingFreezes,
              timestamp: now.toISOString(),
            }),
          },
        });
      }

      await tx.event.create({
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
            streakFreezeUsed: streakResult.freezeUsed,
          }),
        },
      });

      if (leveledUp) {
        await tx.event.create({
          data: {
            userId: user.id,
            type: "LEVEL_UP",
            payload: JSON.stringify({
              previousLevel: user.level,
              newLevel: levelResult.level,
              totalXp: newTotalXp,
            }),
          },
        });
      }

      if (activeBoss) {
        if (bossDefeated) {
          await tx.boss.update({
            where: { id: activeBoss.id },
            data: {
              currentHp: 0,
              defeatedAt: now,
            },
          });
          await tx.event.create({
            data: {
              userId: user.id,
              type: "BOSS_DEFEATED",
              payload: JSON.stringify({
                bossId: activeBoss.id,
                title: activeBoss.title,
                maxHp: activeBoss.maxHp,
                bonusXp: bossDefeated.bonusXp,
                bonusDiamonds: bossDefeated.bonusDiamonds,
              }),
            },
          });
        } else if (bossDamage) {
          await tx.boss.update({
            where: { id: activeBoss.id },
            data: {
              currentHp: bossDamage.remainingHp,
            },
          });
        }
      }

      if (chainCompleted && quest.chainId) {
        await tx.questChain.update({
          where: { id: quest.chainId },
          data: { completedAt: now },
        });
        await tx.event.create({
          data: {
            userId: user.id,
            type: "CHAIN_COMPLETED",
            payload: JSON.stringify({
              chainId: quest.chainId,
              title: chainCompleted.chainTitle,
              bonusXp: chainCompleted.bonusXp,
              bonusDiamonds: chainCompleted.bonusDiamonds,
            }),
          },
        });
      }

      // Check stats for achievement milestones
      const totalCompletions = await tx.questCompletion.count({
        where: { quest: { userId: user.id } },
      });
      const bossesDefeatedCount = await tx.boss.count({
        where: { userId: user.id, defeatedAt: { not: null } },
      });
      const chainsCompletedCount = await tx.questChain.count({
        where: { userId: user.id, completedAt: { not: null } },
      });

      newlyUnlockedAchievements = await evaluateAndGrantAchievementsInTx(
        user.id,
        {
          totalCompletions,
          streakCount: streakResult.newStreak,
          level: levelResult.level,
          bossesDefeated: bossesDefeatedCount,
          chainsCompleted: chainsCompletedCount,
        },
        tx
      );
    });

    safeRevalidate("/dashboard");
    safeRevalidate("/quests");
    safeRevalidate("/achievements");
    safeRevalidate("/profile");

    const bonusDiamondsFromAchievements = newlyUnlockedAchievements.reduce(
      (acc, a) => acc + a.diamondReward,
      0
    );

    return {
      success: true,
      data: {
        questId: quest.id,
        xpAwarded: totalXpGained,
        diamondsAwarded: totalDiamondsGained + bonusDiamondsFromAchievements,
        newStreak: streakResult.newStreak,
        newLevel: levelResult.level,
        newTotalXp,
        leveledUp,
        streakFreezeUsed: streakResult.freezeUsed,
        bossDamage,
        bossDefeated,
        chainCompleted,
        newAchievements: newlyUnlockedAchievements.map((a) => ({
          key: a.key,
          title: a.title,
          description: a.description,
          emoji: a.emoji,
          diamondReward: a.diamondReward,
        })),
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
    safeRevalidate(`/quests/${questId}`);

    return { success: true, data: { id: questId } };
  } catch (error) {
    console.error("Failed to delete quest:", error);
    return {
      success: false,
      error: "Unable to remove quest. Please try again.",
    };
  }
}

/**
 * Updates an existing quest's details.
 */
export async function updateQuestAction(
  questId: string,
  data: QuestDraft
): Promise<ActionResult<CreatedQuestResponse>> {
  try {
    const parseResult = questDraftSchema.safeParse(data);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message ?? "Invalid quest data.",
      };
    }

    const validated = parseResult.data;
    const user = await requireUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
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
      return { success: false, error: "Quest not found." };
    }

    const updated = await prisma.quest.update({
      where: { id: questId },
      data: {
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
    safeRevalidate(`/quests/${questId}`);

    const now = new Date();
    const isCompletedToday = isQuestCompletedForOccurrence(
      updated.frequency as Frequency,
      quest.completions,
      now
    );

    return {
      success: true,
      data: {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        category: updated.category,
        difficulty: updated.difficulty as Difficulty,
        frequency: updated.frequency as Frequency,
        isCompletedToday,
        completionsCount: quest.completions.length,
      },
    };
  } catch (error) {
    console.error("Failed to update quest:", error);
    return { success: false, error: "Failed to update quest." };
  }
}

export interface QuestCompletionHistoryItem {
  id: string;
  completedAt: Date;
  xpAwarded: number;
  diamondsAwarded: number;
}

export interface QuestDetailData {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: Difficulty;
  frequency: Frequency;
  reminderOn: boolean;
  chainId: string | null;
  chainTitle: string | null;
  bossId: string | null;
  bossTitle: string | null;
  createdAt: Date;
  isCompletedToday: boolean;
  totalCompletions: number;
  totalXpEarned: number;
  totalDiamondsEarned: number;
  completions: QuestCompletionHistoryItem[];
}

/**
 * Fetches full details, lifetime statistics, and completion history for a single quest.
 */
export async function getQuestDetailAction(
  questId: string
): Promise<ActionResult<QuestDetailData>> {
  try {
    const user = await requireUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
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
        chain: true,
        boss: true,
      },
    });

    if (!quest) {
      return { success: false, error: "Quest not found." };
    }

    const now = new Date();
    const isCompletedToday = isQuestCompletedForOccurrence(
      quest.frequency as Frequency,
      quest.completions,
      now
    );

    const totalCompletions = quest.completions.length;
    const totalXpEarned = quest.completions.reduce(
      (sum, c) => sum + (c.xpAwarded || 0),
      0
    );
    const totalDiamondsEarned = quest.completions.reduce(
      (sum, c) => sum + (c.diamondsAwarded || 0),
      0
    );

    return {
      success: true,
      data: {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        category: quest.category,
        difficulty: quest.difficulty as Difficulty,
        frequency: quest.frequency as Frequency,
        reminderOn: quest.reminderOn,
        chainId: quest.chainId,
        chainTitle: quest.chain?.title ?? null,
        bossId: quest.bossId,
        bossTitle: quest.boss?.title ?? null,
        createdAt: quest.createdAt,
        isCompletedToday,
        totalCompletions,
        totalXpEarned,
        totalDiamondsEarned,
        completions: quest.completions.map((c) => ({
          id: c.id,
          completedAt: c.completedAt,
          xpAwarded: c.xpAwarded,
          diamondsAwarded: c.diamondsAwarded,
        })),
      },
    };
  } catch (error) {
    console.error("Failed to load quest detail:", error);
    return { success: false, error: "Unable to load quest details." };
  }
}

/**
 * Toggles the reminder status of a single quest.
 */
export async function toggleQuestReminderAction(
  questId: string
): Promise<ActionResult<{ reminderOn: boolean }>> {
  try {
    const user = await requireUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const quest = await prisma.quest.findFirst({
      where: {
        id: questId,
        userId: user.id,
        archivedAt: null,
      },
    });

    if (!quest) {
      return { success: false, error: "Quest not found." };
    }

    const updated = await prisma.quest.update({
      where: { id: questId },
      data: { reminderOn: !quest.reminderOn },
    });

    safeRevalidate("/dashboard");
    safeRevalidate("/quests");
    safeRevalidate(`/quests/${questId}`);

    return {
      success: true,
      data: {
        reminderOn: updated.reminderOn,
      },
    };
  } catch (error) {
    console.error("Failed to toggle quest reminder:", error);
    return { success: false, error: "Failed to toggle reminder." };
  }
}

