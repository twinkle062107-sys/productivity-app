/**
 * Pure gamification math and logic.
 * No Next.js, Prisma, or React imports.
 */

export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "EPIC";
export type Frequency = "ONCE" | "DAILY" | "WEEKLY" | "CUSTOM";

export const XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  EASY: 10,
  MEDIUM: 25,
  HARD: 50,
  EPIC: 100,
} as const;

export const DIAMONDS_BY_DIFFICULTY: Record<Difficulty, number> = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 5,
  EPIC: 10,
} as const;

export const XP_PER_LEVEL = 100;

export interface RewardResult {
  xp: number;
  diamonds: number;
}

export interface LevelInfo {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPct: number;
  totalXp: number;
}

export interface StreakResult {
  newStreak: number;
  streakIncreased: boolean;
  isFirstToday: boolean;
}

/**
 * Calculates XP and diamond rewards for a given quest difficulty.
 */
export function calculateRewards(difficulty: Difficulty): RewardResult {
  return {
    xp: XP_BY_DIFFICULTY[difficulty] ?? XP_BY_DIFFICULTY.MEDIUM,
    diamonds: DIAMONDS_BY_DIFFICULTY[difficulty] ?? DIAMONDS_BY_DIFFICULTY.MEDIUM,
  };
}

/**
 * Calculates current level and progress towards the next level from total XP.
 */
export function calculateLevel(totalXp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(totalXp || 0));
  const level = Math.floor(safeXp / XP_PER_LEVEL) + 1;
  const currentLevelXp = safeXp % XP_PER_LEVEL;
  const nextLevelXp = XP_PER_LEVEL;
  const progressPct = Math.min(100, Math.round((currentLevelXp / nextLevelXp) * 100));

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    progressPct,
    totalXp: safeXp,
  };
}

/**
 * Calculates streak updates based on the user's last active date and current date.
 */
export function calculateStreak(
  lastActiveDay: Date | string | null,
  currentStreak: number,
  now: Date = new Date()
): StreakResult {
  if (!lastActiveDay) {
    return {
      newStreak: 1,
      streakIncreased: true,
      isFirstToday: true,
    };
  }

  const lastDate = new Date(lastActiveDay);
  const nowDate = new Date(now);

  const startOfLast = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
  const startOfNow = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();

  const dayDiff = Math.round((startOfNow - startOfLast) / (1000 * 60 * 60 * 24));

  if (dayDiff === 0) {
    // Already completed something today
    return {
      newStreak: Math.max(1, currentStreak),
      streakIncreased: false,
      isFirstToday: false,
    };
  }

  if (dayDiff === 1) {
    // Consecutive day
    return {
      newStreak: Math.max(0, currentStreak) + 1,
      streakIncreased: true,
      isFirstToday: true,
    };
  }

  // Broken streak (more than 1 day missed)
  return {
    newStreak: 1,
    streakIncreased: true,
    isFirstToday: true,
  };
}

/**
 * Checks if a quest is already completed for its designated frequency period.
 */
export function isQuestCompletedForOccurrence(
  frequency: Frequency,
  completions: Array<{ completedAt: Date | string }>,
  now: Date = new Date()
): boolean {
  if (!completions || completions.length === 0) {
    return false;
  }

  const nowDate = new Date(now);
  const startOfToday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;

  if (frequency === "ONCE") {
    return completions.length > 0;
  }

  if (frequency === "DAILY" || frequency === "CUSTOM") {
    return completions.some((c) => {
      const compTime = new Date(c.completedAt).getTime();
      return compTime >= startOfToday && compTime <= endOfToday;
    });
  }

  if (frequency === "WEEKLY") {
    // Start of the week (Sunday or Monday, standard week range)
    const dayOfWeek = nowDate.getDay();
    const startOfWeek = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() - dayOfWeek).getTime();
    const endOfWeek = startOfWeek + 7 * 24 * 60 * 60 * 1000 - 1;

    return completions.some((c) => {
      const compTime = new Date(c.completedAt).getTime();
      return compTime >= startOfWeek && compTime <= endOfWeek;
    });
  }

  return false;
}
