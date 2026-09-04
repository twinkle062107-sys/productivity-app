import { describe, it, expect } from "vitest";
import {
  calculateRewards,
  calculateLevel,
  calculateStreak,
  isQuestCompletedForOccurrence,
  toUtcDayKey,
  XP_BY_DIFFICULTY,
  DIAMONDS_BY_DIFFICULTY,
  calculateBossDamage,
  applyBossDamage,
  calculateBossRewards,
  calculateChainProgress,
} from "./index";

describe("Gamification Engine", () => {
  describe("toUtcDayKey", () => {
    it("returns YYYY-MM-DD in UTC", () => {
      const d = new Date("2026-09-01T23:30:00Z");
      expect(toUtcDayKey(d)).toBe("2026-09-01");
    });

    it("handles ISO string input", () => {
      expect(toUtcDayKey("2026-12-31T10:00:00Z")).toBe("2026-12-31");
    });

    it("handles date near midnight UTC", () => {
      // 23:59:59 UTC is still the same day
      expect(toUtcDayKey(new Date("2026-06-15T23:59:59.999Z"))).toBe("2026-06-15");
    });
  });

  describe("calculateRewards", () => {
    it("returns correct XP and diamonds for EASY difficulty", () => {
      const reward = calculateRewards("EASY");
      expect(reward.xp).toBe(10);
      expect(reward.diamonds).toBe(1);
    });

    it("returns correct XP and diamonds for MEDIUM difficulty", () => {
      const reward = calculateRewards("MEDIUM");
      expect(reward.xp).toBe(25);
      expect(reward.diamonds).toBe(2);
    });

    it("returns correct XP and diamonds for HARD difficulty", () => {
      const reward = calculateRewards("HARD");
      expect(reward.xp).toBe(50);
      expect(reward.diamonds).toBe(5);
    });

    it("returns correct XP and diamonds for EPIC difficulty", () => {
      const reward = calculateRewards("EPIC");
      expect(reward.xp).toBe(100);
      expect(reward.diamonds).toBe(10);
    });
  });

  describe("calculateLevel", () => {
    it("calculates level 1 for 0 XP", () => {
      const result = calculateLevel(0);
      expect(result.level).toBe(1);
      expect(result.currentLevelXp).toBe(0);
      expect(result.nextLevelXp).toBe(100);
      expect(result.progressPct).toBe(0);
    });

    it("calculates level 1 for 75 XP with 75% progress", () => {
      const result = calculateLevel(75);
      expect(result.level).toBe(1);
      expect(result.currentLevelXp).toBe(75);
      expect(result.progressPct).toBe(75);
    });

    it("calculates level 2 for 100 XP with 0% progress into level 2", () => {
      const result = calculateLevel(100);
      expect(result.level).toBe(2);
      expect(result.currentLevelXp).toBe(0);
      expect(result.progressPct).toBe(0);
    });

    it("calculates level 4 for 350 XP", () => {
      const result = calculateLevel(350);
      expect(result.level).toBe(4);
      expect(result.currentLevelXp).toBe(50);
      expect(result.progressPct).toBe(50);
    });
  });

  describe("calculateStreak", () => {
    it("starts streak at 1 if user had no previous active day", () => {
      const now = new Date("2026-09-01T12:00:00Z");
      const result = calculateStreak(null, 0, now);
      expect(result.newStreak).toBe(1);
      expect(result.streakIncreased).toBe(true);
      expect(result.isFirstToday).toBe(true);
    });

    it("maintains streak if user already completed an activity today", () => {
      const now = new Date("2026-09-01T12:00:00Z");
      const earlierToday = new Date("2026-09-01T08:00:00Z");
      const result = calculateStreak(earlierToday, 5, now);
      expect(result.newStreak).toBe(5);
      expect(result.streakIncreased).toBe(false);
      expect(result.isFirstToday).toBe(false);
    });

    it("increments streak if active day was yesterday", () => {
      const now = new Date("2026-09-01T12:00:00Z");
      const yesterday = new Date("2026-08-31T18:00:00Z");
      const result = calculateStreak(yesterday, 3, now);
      expect(result.newStreak).toBe(4);
      expect(result.streakIncreased).toBe(true);
      expect(result.isFirstToday).toBe(true);
    });

    it("resets streak to 1 if user missed a day", () => {
      const now = new Date("2026-09-01T12:00:00Z");
      const twoDaysAgo = new Date("2026-08-29T12:00:00Z");
      const result = calculateStreak(twoDaysAgo, 10, now);
      expect(result.newStreak).toBe(1);
      expect(result.streakIncreased).toBe(true);
      expect(result.isFirstToday).toBe(true);
    });

    it("handles midnight boundary: completing at 23:59 vs 00:01 next day", () => {
      const late = new Date("2026-09-01T23:59:00Z");
      const earlyNext = new Date("2026-09-02T00:01:00Z");

      // Late at night - same day, no streak change
      const r1 = calculateStreak(late, 5, new Date("2026-09-01T23:59:30Z"));
      expect(r1.newStreak).toBe(5);
      expect(r1.isFirstToday).toBe(false);

      // Just past midnight - next day, streak increments
      const r2 = calculateStreak(late, 5, earlyNext);
      expect(r2.newStreak).toBe(6);
      expect(r2.streakIncreased).toBe(true);
      expect(r2.isFirstToday).toBe(true);
    });

    it("handles string lastActiveDay input", () => {
      const now = new Date("2026-09-01T12:00:00Z");
      const result = calculateStreak("2026-08-31T18:00:00Z", 3, now);
      expect(result.newStreak).toBe(4);
      expect(result.streakIncreased).toBe(true);
    });
  });

  describe("isQuestCompletedForOccurrence", () => {
    it("returns false if there are no completions", () => {
      const now = new Date("2026-09-01T14:00:00Z");
      expect(isQuestCompletedForOccurrence("DAILY", [], now)).toBe(false);
    });

    it("handles ONCE frequency", () => {
      const now = new Date("2026-09-01T14:00:00Z");
      expect(
        isQuestCompletedForOccurrence(
          "ONCE",
          [{ completedAt: new Date("2026-08-01T10:00:00Z") }],
          now
        )
      ).toBe(true);
    });

    it("handles DAILY frequency - completed today vs past day", () => {
      const now = new Date("2026-09-01T14:00:00Z");

      // Completed yesterday
      expect(
        isQuestCompletedForOccurrence(
          "DAILY",
          [{ completedAt: new Date("2026-08-31T10:00:00Z") }],
          now
        )
      ).toBe(false);

      // Completed today
      expect(
        isQuestCompletedForOccurrence(
          "DAILY",
          [{ completedAt: new Date("2026-09-01T09:00:00Z") }],
          now
        )
      ).toBe(true);
    });

    it("DAILY: not fooled by timezone differences within same UTC day", () => {
      const now = new Date("2026-09-01T01:00:00Z"); // 1 AM UTC
      // Completed late the "previous day" in a western timezone, but same UTC day
      expect(
        isQuestCompletedForOccurrence(
          "DAILY",
          [{ completedAt: "2026-09-01T00:30:00Z" }],
          now
        )
      ).toBe(true);
    });

    it("WEEKLY: uses Monday as week start", () => {
      // 2026-09-07 is a Monday
      const wednesday = new Date("2026-09-09T12:00:00Z");

      // Completed on Monday of this week - should be within the week
      expect(
        isQuestCompletedForOccurrence(
          "WEEKLY",
          [{ completedAt: new Date("2026-09-07T10:00:00Z") }],
          wednesday
        )
      ).toBe(true);

      // Completed on Sunday before this Monday - should NOT be in this week
      expect(
        isQuestCompletedForOccurrence(
          "WEEKLY",
          [{ completedAt: new Date("2026-09-06T10:00:00Z") }],
          wednesday
        )
      ).toBe(false);
    });

    it("WEEKLY: Sunday to Monday boundary", () => {
      // 2026-09-13 is a Sunday
      const sunday = new Date("2026-09-13T20:00:00Z");

      // Completed on Monday 2026-09-07 (same Mon-Sun week)
      expect(
        isQuestCompletedForOccurrence(
          "WEEKLY",
          [{ completedAt: new Date("2026-09-07T08:00:00Z") }],
          sunday
        )
      ).toBe(true);

      // Completed on Sunday 2026-09-06 (previous Mon-Sun week)
      expect(
        isQuestCompletedForOccurrence(
          "WEEKLY",
          [{ completedAt: new Date("2026-09-06T23:59:00Z") }],
          sunday
        )
      ).toBe(false);
    });

    it("WEEKLY: start of week on Monday itself", () => {
      // 2026-09-07 is a Monday
      const monday = new Date("2026-09-07T15:00:00Z");

      // Completed earlier that same Monday
      expect(
        isQuestCompletedForOccurrence(
          "WEEKLY",
          [{ completedAt: new Date("2026-09-07T08:00:00Z") }],
          monday
        )
      ).toBe(true);
    });

    it("WEEKLY: last day of week (Sunday) includes completions from that Monday", () => {
      // 2026-09-13 is a Sunday (last day of Mon-Sun week)
      const sundayNight = new Date("2026-09-13T23:00:00Z");

      expect(
        isQuestCompletedForOccurrence(
          "WEEKLY",
          [{ completedAt: new Date("2026-09-07T06:00:00Z") }],
          sundayNight
        )
      ).toBe(true);
    });

    it("WEEKLY: next Monday starts a new week", () => {
      // 2026-09-14 is a Monday (new week)
      const nextMonday = new Date("2026-09-14T10:00:00Z");

      // Completed on Sunday 2026-09-13 (previous week)
      expect(
        isQuestCompletedForOccurrence(
          "WEEKLY",
          [{ completedAt: new Date("2026-09-13T20:00:00Z") }],
          nextMonday
        )
      ).toBe(false);
    });
  });

  describe("Boss Battles Engine", () => {
    it("calculates boss damage from quest difficulty", () => {
      expect(calculateBossDamage("EASY")).toBe(10);
      expect(calculateBossDamage("MEDIUM")).toBe(25);
      expect(calculateBossDamage("HARD")).toBe(50);
      expect(calculateBossDamage("EPIC")).toBe(100);
    });

    it("applies damage without defeating boss when HP > damage", () => {
      const result = applyBossDamage(100, 25);
      expect(result.remainingHp).toBe(75);
      expect(result.isDefeated).toBe(false);
    });

    it("defeats boss when damage equals remaining HP", () => {
      const result = applyBossDamage(25, 25);
      expect(result.remainingHp).toBe(0);
      expect(result.isDefeated).toBe(true);
    });

    it("clamps HP at 0 on overkill and marks as defeated", () => {
      const result = applyBossDamage(30, 50);
      expect(result.remainingHp).toBe(0);
      expect(result.isDefeated).toBe(true);
    });

    it("calculates boss victory bonus rewards based on max HP", () => {
      const reward50 = calculateBossRewards(50);
      expect(reward50.xp).toBe(50);
      expect(reward50.diamonds).toBe(5);

      const reward200 = calculateBossRewards(200);
      expect(reward200.xp).toBe(200);
      expect(reward200.diamonds).toBe(10);
    });
  });

  describe("Quest Chains Engine", () => {
    it("returns zero progress for empty chain", () => {
      const result = calculateChainProgress([]);
      expect(result.totalSteps).toBe(0);
      expect(result.completedSteps).toBe(0);
      expect(result.progressPct).toBe(0);
      expect(result.isCompleted).toBe(false);
    });

    it("calculates step progress and completion percentage", () => {
      const quests = [
        { completions: [{ completedAt: new Date() }] },
        { completions: [] },
        { completions: [] },
        { completions: [] },
      ];
      const result = calculateChainProgress(quests);
      expect(result.totalSteps).toBe(4);
      expect(result.completedSteps).toBe(1);
      expect(result.progressPct).toBe(25);
      expect(result.currentChapterIndex).toBe(1);
      expect(result.isCompleted).toBe(false);
    });

    it("detects fully completed chain", () => {
      const quests = [
        { completions: [{ completedAt: new Date() }] },
        { completions: [{ completedAt: new Date() }] },
      ];
      const result = calculateChainProgress(quests);
      expect(result.totalSteps).toBe(2);
      expect(result.completedSteps).toBe(2);
      expect(result.progressPct).toBe(100);
      expect(result.isCompleted).toBe(true);
    });
  });
});

