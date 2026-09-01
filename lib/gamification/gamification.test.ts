import { describe, it, expect } from "vitest";
import {
  calculateRewards,
  calculateLevel,
  calculateStreak,
  isQuestCompletedForOccurrence,
  XP_BY_DIFFICULTY,
  DIAMONDS_BY_DIFFICULTY,
} from "./index";

describe("Gamification Engine", () => {
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
    const today = new Date("2026-09-01T12:00:00Z");

    it("starts streak at 1 if user had no previous active day", () => {
      const result = calculateStreak(null, 0, today);
      expect(result.newStreak).toBe(1);
      expect(result.streakIncreased).toBe(true);
      expect(result.isFirstToday).toBe(true);
    });

    it("maintains streak if user already completed an activity today", () => {
      const earlierToday = new Date("2026-09-01T08:00:00Z");
      const result = calculateStreak(earlierToday, 5, today);
      expect(result.newStreak).toBe(5);
      expect(result.streakIncreased).toBe(false);
      expect(result.isFirstToday).toBe(false);
    });

    it("increments streak if active day was yesterday", () => {
      const yesterday = new Date("2026-08-31T18:00:00Z");
      const result = calculateStreak(yesterday, 3, today);
      expect(result.newStreak).toBe(4);
      expect(result.streakIncreased).toBe(true);
      expect(result.isFirstToday).toBe(true);
    });

    it("resets streak to 1 if user missed a day", () => {
      const twoDaysAgo = new Date("2026-08-29T12:00:00Z");
      const result = calculateStreak(twoDaysAgo, 10, today);
      expect(result.newStreak).toBe(1);
      expect(result.streakIncreased).toBe(true);
      expect(result.isFirstToday).toBe(true);
    });
  });

  describe("isQuestCompletedForOccurrence", () => {
    const now = new Date("2026-09-01T14:00:00Z");

    it("returns false if there are no completions", () => {
      expect(isQuestCompletedForOccurrence("DAILY", [], now)).toBe(false);
    });

    it("handles ONCE frequency", () => {
      expect(
        isQuestCompletedForOccurrence(
          "ONCE",
          [{ completedAt: new Date("2026-08-01T10:00:00Z") }],
          now
        )
      ).toBe(true);
    });

    it("handles DAILY frequency - completed today vs past day", () => {
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
  });
});
