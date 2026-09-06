import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-response";
import {
  applyBossDamage,
  calculateBossDamage,
  calculateBossRewards,
  calculateLevel,
  calculateRewards,
  calculateStreakWithFreeze,
  isQuestCompletedForOccurrence,
  type Difficulty,
  type Frequency,
} from "@/lib/gamification";
import { questDraftSchema } from "@/lib/validations/quest";
import { evaluateAndGrantAchievementsInTx } from "@/lib/actions/achievements";
import type {
  BossDamageInfo,
  BossDefeatedInfo,
  ChainCompletedInfo,
  UnlockedAchievementInfo,
} from "@/lib/actions/quest";
import type { AchievementDef } from "@/lib/gamification/achievements";
import type { Prisma } from "@prisma/client";

type QuestWithCompletions = Prisma.QuestGetPayload<{
  include: { completions: true };
}>;

const CHAIN_BONUS_XP = 100;
const CHAIN_BONUS_DIAMONDS = 10;

/**
 * Serializes a quest into the shape consumed by the Flutter `Quest.fromJson`
 * parser (matching the wire names used across the existing web app).
 */
export function serializeQuest(
  quest: QuestWithCompletions,
  now: Date = new Date(),
): {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: string;
  frequency: string;
  reminderOn: boolean;
  archivedAt: Date | null;
  chainId: string | null;
  chapterIndex: number | null;
  isCompletedToday: boolean;
  completionsCount: number;
} {
  return {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    category: quest.category,
    difficulty: quest.difficulty,
    frequency: quest.frequency,
    reminderOn: quest.reminderOn,
    archivedAt: quest.archivedAt,
    chainId: quest.chainId,
    chapterIndex: quest.chapterIndex,
    isCompletedToday: isQuestCompletedForOccurrence(
      (quest.frequency ?? "DAILY") as Frequency,
      quest.completions,
      now,
    ),
    completionsCount: quest.completions.length,
  };
}

/** Lists the authenticated user's active (non-archived) quests. */
export async function listActiveQuests(userId: string) {
  const quests = await prisma.quest.findMany({
    where: { userId, archivedAt: null },
    include: { completions: { orderBy: { completedAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
  return quests.map((quest) => serializeQuest(quest));
}

/**
 * Creates a quest for the authenticated user. Mirrors `createQuestAction`
 * (same validation + defaults), scoped to [userId].
 */
export async function createQuestForUser(userId: string, data: unknown) {
  const parsed = questDraftSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(
      parsed.error.issues[0]?.message ?? "Invalid quest data.",
      400,
    );
  }
  const validated = parsed.data;

  const quest = await prisma.quest.create({
    data: {
      userId,
      title: validated.title,
      description: validated.description || null,
      category: validated.category || "Focus",
      difficulty: validated.difficulty as Difficulty,
      frequency: validated.frequency as Frequency,
      reminderOn: validated.reminderOn,
    },
  });

  return serializeQuest({ ...quest, completions: [] });
}

/**
 * Updates an existing quest owned by [userId]. Mirrors `updateQuestAction`.
 */
export async function updateQuestForUser(
  userId: string,
  questId: string,
  data: unknown,
) {
  const parsed = questDraftSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(
      parsed.error.issues[0]?.message ?? "Invalid quest data.",
      400,
    );
  }
  const validated = parsed.data;

  const existing = await prisma.quest.findFirst({
    where: { id: questId, userId, archivedAt: null },
  });
  if (!existing) {
    throw new ApiError("Quest not found.", 404);
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
    include: { completions: { orderBy: { completedAt: "desc" } } },
  });

  return serializeQuest(updated);
}

/** Soft-deletes (archives) a quest owned by [userId]. */
export async function archiveQuestForUser(userId: string, questId: string) {
  const result = await prisma.quest.updateMany({
    where: { id: questId, userId, archivedAt: null },
    data: { archivedAt: new Date() },
  });
  if (result.count === 0) {
    throw new ApiError("Quest not found or already removed.", 404);
  }
  return { id: questId };
}

/** Lists the completion history for a single quest (scoped to the user). */
export async function listQuestCompletions(userId: string, questId: string) {
  const quest = await prisma.quest.findFirst({
    where: { id: questId, userId },
    select: { id: true },
  });
  if (!quest) {
    throw new ApiError("Quest not found.", 404);
  }

  const completions = await prisma.questCompletion.findMany({
    where: { questId, quest: { userId } },
    orderBy: { completedAt: "desc" },
  });

  return completions.map((c) => ({
    id: c.id,
    questId: c.questId,
    completedAt: c.completedAt,
    xpAwarded: c.xpAwarded,
    pointsAwarded: c.pointsAwarded,
    diamondsAwarded: c.diamondsAwarded,
  }));
}

export interface CompleteQuestApiResult {
  questId: string;
  xpGained: number;
  diamondsGained: number;
  levelUp: boolean;
  bossDefeated: boolean;
  chainCompleted: boolean;
  newStreak: number;
  newLevel: number;
  newTotalXp: number;
  streakFreezeUsed: boolean;
  bossDamage: BossDamageInfo | null;
  bossDefeatedInfo: BossDefeatedInfo | null;
  chainCompletedInfo: ChainCompletedInfo | null;
  newAchievements: UnlockedAchievementInfo[];
}

/**
 * Runs the full gamification completion transaction for a quest owned by
 * [userId]. This is a bearer-token mirror of `completeQuestAction`, reusing
 * the same pure gamification math, validations, and achievement evaluation —
 * every write is scoped to the authenticated user.
 */
export async function completeQuestForUser(
  userId: string,
  questId: string,
): Promise<CompleteQuestApiResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError("Unauthorized", 401);

  const quest = await prisma.quest.findFirst({
    where: { id: questId, userId, archivedAt: null },
    include: {
      completions: { orderBy: { completedAt: "desc" } },
      chain: true,
    },
  });
  if (!quest) {
    throw new ApiError("Quest not found or has been removed.", 404);
  }

  const now = new Date();

  const alreadyCompleted = isQuestCompletedForOccurrence(
    (quest.frequency ?? "DAILY") as Frequency,
    quest.completions,
    now,
  );
  if (alreadyCompleted) {
    throw new ApiError(
      "This quest has already been completed for the current period.",
      409,
    );
  }

  const rewards = calculateRewards((quest.difficulty ?? "MEDIUM") as Difficulty);
  const streakResult = calculateStreakWithFreeze(
    user.lastActiveDay,
    user.streakCount,
    user.streakFreezes,
    now,
  );

  let totalXpGained = rewards.xp;
  let totalDiamondsGained = rewards.diamonds;

  // Boss damage / defeat (mirrors completeQuestAction).
  const activeBoss = await prisma.boss.findFirst({
    where: { userId, defeatedAt: null },
    orderBy: { createdAt: "desc" },
  });

  let bossDamage: BossDamageInfo | undefined;
  let bossDefeated: BossDefeatedInfo | undefined;

  if (activeBoss) {
    const dmg = calculateBossDamage((quest.difficulty ?? "MEDIUM") as Difficulty);
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
    } else {
      bossDamage = {
        damage: dmg,
        remainingHp: bossResult.remainingHp,
        maxHp: activeBoss.maxHp,
        bossTitle: activeBoss.title,
      };
    }
  }

  // Quest chain progression (mirrors completeQuestAction).
  let chainCompleted: ChainCompletedInfo | undefined;

  if (quest.chainId && quest.chain && !quest.chain.completedAt) {
    const siblingQuests = await prisma.quest.findMany({
      where: { chainId: quest.chainId, archivedAt: null },
      include: { completions: true },
    });

    const otherUncompleted = siblingQuests.filter(
      (q) => q.id !== quest.id && q.completions.length === 0,
    );

    if (otherUncompleted.length === 0) {
      totalXpGained += CHAIN_BONUS_XP;
      totalDiamondsGained += CHAIN_BONUS_DIAMONDS;
      chainCompleted = {
        chainTitle: quest.chain.title,
        bonusXp: CHAIN_BONUS_XP,
        bonusDiamonds: CHAIN_BONUS_DIAMONDS,
      };
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
      where: { id: userId },
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
          userId,
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
        userId,
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
          userId,
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
          data: { currentHp: 0, defeatedAt: now },
        });
        await tx.event.create({
          data: {
            userId,
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
          data: { currentHp: bossDamage.remainingHp },
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
          userId,
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

    const totalCompletions = await tx.questCompletion.count({
      where: { quest: { userId } },
    });
    const bossesDefeatedCount = await tx.boss.count({
      where: { userId, defeatedAt: { not: null } },
    });
    const chainsCompletedCount = await tx.questChain.count({
      where: { userId, completedAt: { not: null } },
    });

    newlyUnlockedAchievements = await evaluateAndGrantAchievementsInTx(
      userId,
      {
        totalCompletions,
        streakCount: streakResult.newStreak,
        level: levelResult.level,
        bossesDefeated: bossesDefeatedCount,
        chainsCompleted: chainsCompletedCount,
      },
      tx,
    );
  });

  const bonusDiamondsFromAchievements = newlyUnlockedAchievements.reduce(
    (acc, a) => acc + a.diamondReward,
    0,
  );

  return {
    questId: quest.id,
    xpGained: totalXpGained,
    diamondsGained: totalDiamondsGained + bonusDiamondsFromAchievements,
    levelUp: leveledUp,
    bossDefeated: bossDefeated != null,
    chainCompleted: chainCompleted != null,
    newStreak: streakResult.newStreak,
    newLevel: levelResult.level,
    newTotalXp,
    streakFreezeUsed: streakResult.freezeUsed,
    bossDamage: bossDamage ?? null,
    bossDefeatedInfo: bossDefeated ?? null,
    chainCompletedInfo: chainCompleted ?? null,
    newAchievements: newlyUnlockedAchievements.map((a) => ({
      key: a.key,
      title: a.title,
      description: a.description,
      emoji: a.emoji,
      diamondReward: a.diamondReward,
    })),
  };
}