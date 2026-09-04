/**
 * Pure gamification math and logic.
 * No Next.js, Prisma, or React imports.
 *
 * All date comparisons use UTC day boundaries to ensure timezone consistency.
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
 * Converts a Date or ISO string to a UTC day key (YYYY-MM-DD).
 * This ensures all day-level comparisons are timezone-safe.
 */
export function toUtcDayKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns the number of UTC days between two dates.
 * Positive means `later` is after `earlier`.
 */
function utcDayDiff(earlier: Date, later: Date): number {
  const a = Date.UTC(
    earlier.getUTCFullYear(),
    earlier.getUTCMonth(),
    earlier.getUTCDate()
  );
  const b = Date.UTC(
    later.getUTCFullYear(),
    later.getUTCMonth(),
    later.getUTCDate()
  );
  return Math.round((b - a) / (86400000));
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
 * Uses UTC day boundaries to avoid timezone issues around midnight.
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

  const lastDate = typeof lastActiveDay === "string" ? new Date(lastActiveDay) : lastActiveDay;
  const dayDiff = utcDayDiff(lastDate, now);

  if (dayDiff === 0) {
    return {
      newStreak: Math.max(1, currentStreak),
      streakIncreased: false,
      isFirstToday: false,
    };
  }

  if (dayDiff === 1) {
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
 * Uses UTC day boundaries. Week starts on Monday.
 */
export function isQuestCompletedForOccurrence(
  frequency: Frequency,
  completions: Array<{ completedAt: Date | string }>,
  now: Date = new Date()
): boolean {
  if (!completions || completions.length === 0) {
    return false;
  }

  if (frequency === "ONCE") {
    return completions.length > 0;
  }

  const nowUtcDay = toUtcDayKey(now);

  if (frequency === "DAILY" || frequency === "CUSTOM") {
    return completions.some((c) => {
      return toUtcDayKey(c.completedAt) === nowUtcDay;
    });
  }

  if (frequency === "WEEKLY") {
    // Compute the Monday-start week boundary in UTC using Date.UTC directly
    // to avoid any local-timezone drift from the Date constructor.
    const utcDay = now.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const mondayOffset = (utcDay + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
    const weekStartMs =
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
      mondayOffset * 86400000;
    const weekEndMs = weekStartMs + 7 * 86400000 - 1;

    return completions.some((c) => {
      const compTime = new Date(c.completedAt).getTime();
      return compTime >= weekStartMs && compTime <= weekEndMs;
    });
  }

  return false;
}

/**
 * Calculates boss damage dealt when completing a quest of a given difficulty.
 */
export function calculateBossDamage(difficulty: Difficulty): number {
  return XP_BY_DIFFICULTY[difficulty] ?? XP_BY_DIFFICULTY.MEDIUM;
}

/**
 * Applies damage to a Boss and determines if the Boss is defeated.
 */
export function applyBossDamage(
  currentHp: number,
  damage: number
): { remainingHp: number; isDefeated: boolean } {
  const safeDamage = Math.max(0, damage);
  const remainingHp = Math.max(0, currentHp - safeDamage);
  return {
    remainingHp,
    isDefeated: remainingHp === 0,
  };
}

/**
 * Calculates bonus victory loot when a Boss is defeated based on its max HP.
 */
export function calculateBossRewards(maxHp: number): RewardResult {
  const safeHp = Math.max(10, maxHp);
  const xp = safeHp;
  const diamonds = Math.max(5, Math.floor(safeHp / 20));
  return { xp, diamonds };
}

export interface ChainProgressResult {
  totalSteps: number;
  completedSteps: number;
  currentChapterIndex: number;
  progressPct: number;
  isCompleted: boolean;
}

/**
 * Calculates the progress of a multi-chapter Quest Chain.
 * Quests in the chain are ordered by chapterIndex (1-indexed or 0-indexed).
 */
export function calculateChainProgress(
  quests: Array<{ completions?: Array<{ completedAt: Date | string }> }>
): ChainProgressResult {
  const totalSteps = quests.length;
  if (totalSteps === 0) {
    return {
      totalSteps: 0,
      completedSteps: 0,
      currentChapterIndex: 0,
      progressPct: 0,
      isCompleted: false,
    };
  }

  const completedSteps = quests.filter(
    (q) => q.completions && q.completions.length > 0
  ).length;

  const progressPct = Math.min(100, Math.round((completedSteps / totalSteps) * 100));
  const isCompleted = completedSteps >= totalSteps;
  const currentChapterIndex = Math.min(completedSteps, totalSteps - 1);

  return {
    totalSteps,
    completedSteps,
    currentChapterIndex,
    progressPct,
    isCompleted,
  };
}

