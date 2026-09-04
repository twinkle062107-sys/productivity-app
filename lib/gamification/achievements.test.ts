import { describe, it, expect } from "vitest";
import {
  ACHIEVEMENT_CATALOG,
  evaluateAchievements,
  calculateAchievementProgress,
  type UserStatsForAchievements,
} from "./achievements";

describe("Achievements Gamification Engine", () => {
  it("contains unique keys for all achievements", () => {
    const keys = ACHIEVEMENT_CATALOG.map((a) => a.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  describe("evaluateAchievements", () => {
    it("unlocks FIRST_QUEST when user has completed 1 quest", () => {
      const stats: UserStatsForAchievements = {
        totalCompletions: 1,
        streakCount: 1,
        level: 1,
        bossesDefeated: 0,
        chainsCompleted: 0,
      };

      const newlyUnlocked = evaluateAchievements(stats, []);
      expect(newlyUnlocked.map((a) => a.key)).toContain("FIRST_QUEST");
    });

    it("does not re-unlock already unlocked achievements", () => {
      const stats: UserStatsForAchievements = {
        totalCompletions: 1,
        streakCount: 1,
        level: 1,
        bossesDefeated: 0,
        chainsCompleted: 0,
      };

      const newlyUnlocked = evaluateAchievements(stats, ["FIRST_QUEST"]);
      expect(newlyUnlocked.map((a) => a.key)).not.toContain("FIRST_QUEST");
    });

    it("unlocks STREAK_3 and STREAK_7 correctly based on streak count", () => {
      const stats3: UserStatsForAchievements = {
        totalCompletions: 3,
        streakCount: 3,
        level: 2,
        bossesDefeated: 0,
        chainsCompleted: 0,
      };
      const result3 = evaluateAchievements(stats3, ["FIRST_QUEST"]);
      expect(result3.map((a) => a.key)).toContain("STREAK_3");
      expect(result3.map((a) => a.key)).not.toContain("STREAK_7");

      const stats7: UserStatsForAchievements = {
        totalCompletions: 7,
        streakCount: 7,
        level: 3,
        bossesDefeated: 0,
        chainsCompleted: 0,
      };
      const result7 = evaluateAchievements(stats7, ["FIRST_QUEST", "STREAK_3"]);
      expect(result7.map((a) => a.key)).toContain("STREAK_7");
    });

    it("unlocks BOSS_SLAYER and CHAIN_CHAMPION on combat/story milestones", () => {
      const stats: UserStatsForAchievements = {
        totalCompletions: 5,
        streakCount: 2,
        level: 2,
        bossesDefeated: 1,
        chainsCompleted: 1,
      };
      const result = evaluateAchievements(stats, ["FIRST_QUEST"]);
      expect(result.map((a) => a.key)).toContain("BOSS_SLAYER");
      expect(result.map((a) => a.key)).toContain("CHAIN_CHAMPION");
    });
  });

  describe("calculateAchievementProgress", () => {
    it("calculates progress percentage correctly for fractional goals", () => {
      const stats: UserStatsForAchievements = {
        totalCompletions: 5,
        streakCount: 2,
        level: 1,
        bossesDefeated: 0,
        chainsCompleted: 0,
      };

      const quest10 = ACHIEVEMENT_CATALOG.find((a) => a.key === "QUEST_MASTER_10")!;
      const progress = calculateAchievementProgress(quest10, stats);
      expect(progress.currentValue).toBe(5);
      expect(progress.targetValue).toBe(10);
      expect(progress.progressPct).toBe(50);
    });

    it("clamps progress percentage at 100%", () => {
      const stats: UserStatsForAchievements = {
        totalCompletions: 30,
        streakCount: 10,
        level: 12,
        bossesDefeated: 3,
        chainsCompleted: 2,
      };

      const level10 = ACHIEVEMENT_CATALOG.find((a) => a.key === "LEVEL_10")!;
      const progress = calculateAchievementProgress(level10, stats);
      expect(progress.progressPct).toBe(100);
    });
  });
});
