"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  ACHIEVEMENT_CATALOG,
  calculateAchievementProgress,
  evaluateAchievements,
  type AchievementDef,
  type AchievementCategory,
  type UserStatsForAchievements,
} from "@/lib/gamification/achievements";
import type { ActionResult } from "@/lib/actions/quest";
import type { Prisma } from "@prisma/client";

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
 * Ensures all standard achievements in ACHIEVEMENT_CATALOG exist in the database.
 */
export async function ensureAchievementsSeeded(
  tx: Prisma.TransactionClient | typeof prisma = prisma
): Promise<void> {
  for (const ach of ACHIEVEMENT_CATALOG) {
    await tx.achievement.upsert({
      where: { key: ach.key },
      update: {
        title: ach.title,
        description: ach.description,
        iconUrl: ach.emoji,
      },
      create: {
        key: ach.key,
        title: ach.title,
        description: ach.description,
        iconUrl: ach.emoji,
      },
    });
  }
}

export interface AchievementItemData {
  key: string;
  title: string;
  description: string;
  emoji: string;
  diamondReward: number;
  category: AchievementCategory;
  conditionDescription: string;
  isUnlocked: boolean;
  unlockedAt: Date | null;
  currentValue: number;
  targetValue: number;
  progressPct: number;
}

export interface AchievementsGalleryData {
  totalUnlocked: number;
  totalAchievements: number;
  overallProgressPct: number;
  achievements: AchievementItemData[];
}

/**
 * Fetches all achievements with the current user's progress and unlock states.
 */
export async function getUserAchievementsAction(): Promise<
  ActionResult<AchievementsGalleryData>
> {
  try {
    const user = await requireUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Ensure catalog is seeded in database
    await ensureAchievementsSeeded();

    // Query user achievements
    const userUnlocked = await prisma.userAchievement.findMany({
      where: { userId: user.id },
      include: { achievement: true },
    });

    const unlockedMap = new Map<string, Date>();
    for (const ua of userUnlocked) {
      unlockedMap.set(ua.achievement.key, ua.unlockedAt);
    }

    // Query user stats
    const totalCompletions = await prisma.questCompletion.count({
      where: { quest: { userId: user.id } },
    });

    const bossesDefeated = await prisma.boss.count({
      where: { userId: user.id, defeatedAt: { not: null } },
    });

    const chainsCompleted = await prisma.questChain.count({
      where: { userId: user.id, completedAt: { not: null } },
    });

    const stats: UserStatsForAchievements = {
      totalCompletions,
      streakCount: user.streakCount,
      level: user.level,
      bossesDefeated,
      chainsCompleted,
    };

    // Check if any pending achievements should be unlocked now
    const newlyUnlockedDefs = evaluateAchievements(
      stats,
      Array.from(unlockedMap.keys())
    );

    if (newlyUnlockedDefs.length > 0) {
      const now = new Date();
      await prisma.$transaction(async (tx) => {
        let totalBonusDiamonds = 0;

        for (const def of newlyUnlockedDefs) {
          const dbAch = await tx.achievement.findUnique({
            where: { key: def.key },
          });
          if (dbAch) {
            await tx.userAchievement.create({
              data: {
                userId: user.id,
                achievementId: dbAch.id,
                unlockedAt: now,
              },
            });

            totalBonusDiamonds += def.diamondReward;
            unlockedMap.set(def.key, now);

            await tx.event.create({
              data: {
                userId: user.id,
                type: "ACHIEVEMENT_UNLOCKED",
                payload: JSON.stringify({
                  achievementKey: def.key,
                  title: def.title,
                  diamondReward: def.diamondReward,
                }),
              },
            });
          }
        }

        if (totalBonusDiamonds > 0) {
          await tx.user.update({
            where: { id: user.id },
            data: { diamonds: { increment: totalBonusDiamonds } },
          });
        }
      });
    }

    // Format all achievements
    const achievements: AchievementItemData[] = ACHIEVEMENT_CATALOG.map((ach) => {
      const isUnlocked = unlockedMap.has(ach.key);
      const unlockedAt = unlockedMap.get(ach.key) ?? null;
      const progress = calculateAchievementProgress(ach, stats);

      return {
        key: ach.key,
        title: ach.title,
        description: ach.description,
        emoji: ach.emoji,
        diamondReward: ach.diamondReward,
        category: ach.category,
        conditionDescription: ach.conditionDescription,
        isUnlocked,
        unlockedAt,
        currentValue: progress.currentValue,
        targetValue: progress.targetValue,
        progressPct: isUnlocked ? 100 : progress.progressPct,
      };
    });

    const totalUnlocked = achievements.filter((a) => a.isUnlocked).length;
    const totalAchievements = achievements.length;
    const overallProgressPct =
      totalAchievements > 0
        ? Math.round((totalUnlocked / totalAchievements) * 100)
        : 0;

    return {
      success: true,
      data: {
        totalUnlocked,
        totalAchievements,
        overallProgressPct,
        achievements,
      },
    };
  } catch (error) {
    console.error("Failed to load achievements:", error);
    return { success: false, error: "Failed to load achievements." };
  }
}

/**
 * Evaluates and unlocks any newly earned achievements inside an existing transaction.
 */
export async function evaluateAndGrantAchievementsInTx(
  userId: string,
  stats: UserStatsForAchievements,
  tx: Prisma.TransactionClient
): Promise<AchievementDef[]> {
  await ensureAchievementsSeeded(tx);

  const existingUnlocked = await tx.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
  });

  const alreadyUnlockedKeys = existingUnlocked.map((ua) => ua.achievement.key);
  const newlyUnlocked = evaluateAchievements(stats, alreadyUnlockedKeys);

  if (newlyUnlocked.length === 0) {
    return [];
  }

  const now = new Date();
  let totalBonusDiamonds = 0;

  for (const def of newlyUnlocked) {
    const dbAch = await tx.achievement.findUnique({
      where: { key: def.key },
    });

    if (dbAch) {
      await tx.userAchievement.create({
        data: {
          userId,
          achievementId: dbAch.id,
          unlockedAt: now,
        },
      });

      totalBonusDiamonds += def.diamondReward;

      await tx.event.create({
        data: {
          userId,
          type: "ACHIEVEMENT_UNLOCKED",
          payload: JSON.stringify({
            achievementKey: def.key,
            title: def.title,
            diamondReward: def.diamondReward,
          }),
        },
      });
    }
  }

  if (totalBonusDiamonds > 0) {
    await tx.user.update({
      where: { id: userId },
      data: { diamonds: { increment: totalBonusDiamonds } },
    });
  }

  return newlyUnlocked;
}
