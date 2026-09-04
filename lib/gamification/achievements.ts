/**
 * Pure gamification achievements catalog and evaluation logic.
 * No Next.js or Prisma imports.
 */

export type AchievementCategory = "MILESTONES" | "STREAKS" | "COMBAT" | "STORY";

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  emoji: string;
  diamondReward: number;
  category: AchievementCategory;
  conditionDescription: string;
  targetValue: number;
}

export const ACHIEVEMENT_CATALOG: AchievementDef[] = [
  {
    key: "FIRST_QUEST",
    title: "First Step",
    description: "Complete your very first quest.",
    emoji: "🌱",
    diamondReward: 10,
    category: "MILESTONES",
    conditionDescription: "Complete 1 quest",
    targetValue: 1,
  },
  {
    key: "QUEST_MASTER_10",
    title: "Habit Builder",
    description: "Complete 10 total quests.",
    emoji: "⭐",
    diamondReward: 20,
    category: "MILESTONES",
    conditionDescription: "Complete 10 quests",
    targetValue: 10,
  },
  {
    key: "QUEST_MASTER_25",
    title: "Century Apprentice",
    description: "Complete 25 total quests.",
    emoji: "⚔️",
    diamondReward: 35,
    category: "MILESTONES",
    conditionDescription: "Complete 25 quests",
    targetValue: 25,
  },
  {
    key: "STREAK_3",
    title: "On a Roll",
    description: "Build a 3-day quest streak.",
    emoji: "🔥",
    diamondReward: 15,
    category: "STREAKS",
    conditionDescription: "Reach a 3-day streak",
    targetValue: 3,
  },
  {
    key: "STREAK_7",
    title: "Unstoppable Force",
    description: "Build a 7-day quest streak.",
    emoji: "⚡",
    diamondReward: 30,
    category: "STREAKS",
    conditionDescription: "Reach a 7-day streak",
    targetValue: 7,
  },
  {
    key: "LEVEL_5",
    title: "Rising Hero",
    description: "Level up your hero to Level 5.",
    emoji: "🛡️",
    diamondReward: 20,
    category: "MILESTONES",
    conditionDescription: "Reach Level 5",
    targetValue: 5,
  },
  {
    key: "LEVEL_10",
    title: "Legendary Champion",
    description: "Level up your hero to Level 10.",
    emoji: "👑",
    diamondReward: 50,
    category: "MILESTONES",
    conditionDescription: "Reach Level 10",
    targetValue: 10,
  },
  {
    key: "BOSS_SLAYER",
    title: "Dragon Slayer",
    description: "Defeat your first Boss encounter.",
    emoji: "🐉",
    diamondReward: 30,
    category: "COMBAT",
    conditionDescription: "Defeat 1 Boss",
    targetValue: 1,
  },
  {
    key: "CHAIN_CHAMPION",
    title: "Story Conqueror",
    description: "Finish all chapters of a Quest Chain.",
    emoji: "🔗",
    diamondReward: 25,
    category: "STORY",
    conditionDescription: "Complete 1 Quest Chain",
    targetValue: 1,
  },
];

export interface UserStatsForAchievements {
  totalCompletions: number;
  streakCount: number;
  level: number;
  bossesDefeated: number;
  chainsCompleted: number;
}

/**
 * Computes current progress value for a specific achievement.
 */
export function getAchievementProgressValue(
  key: string,
  stats: UserStatsForAchievements
): number {
  switch (key) {
    case "FIRST_QUEST":
    case "QUEST_MASTER_10":
    case "QUEST_MASTER_25":
      return stats.totalCompletions;
    case "STREAK_3":
    case "STREAK_7":
      return stats.streakCount;
    case "LEVEL_5":
    case "LEVEL_10":
      return stats.level;
    case "BOSS_SLAYER":
      return stats.bossesDefeated;
    case "CHAIN_CHAMPION":
      return stats.chainsCompleted;
    default:
      return 0;
  }
}

/**
 * Calculates progress percentage (0 to 100) towards unlocking an achievement.
 */
export function calculateAchievementProgress(
  achievement: AchievementDef,
  stats: UserStatsForAchievements
): { currentValue: number; targetValue: number; progressPct: number } {
  const currentValue = getAchievementProgressValue(achievement.key, stats);
  const targetValue = achievement.targetValue;
  const progressPct = Math.min(100, Math.round((currentValue / targetValue) * 100));

  return {
    currentValue,
    targetValue,
    progressPct,
  };
}

/**
 * Evaluates which achievements the user has earned that haven't been unlocked yet.
 */
export function evaluateAchievements(
  stats: UserStatsForAchievements,
  alreadyUnlockedKeys: string[]
): AchievementDef[] {
  const unlockedSet = new Set(alreadyUnlockedKeys);
  const newlyUnlocked: AchievementDef[] = [];

  for (const ach of ACHIEVEMENT_CATALOG) {
    if (unlockedSet.has(ach.key)) {
      continue;
    }

    const currentVal = getAchievementProgressValue(ach.key, stats);
    if (currentVal >= ach.targetValue) {
      newlyUnlocked.push(ach);
    }
  }

  return newlyUnlocked;
}
