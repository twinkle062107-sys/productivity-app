import { describe, it, expect } from "vitest";
import { analyzeWeeklyProductivity } from "./analyzer";
import type { AnalyzerQuestInput, AnalyzerUserInput } from "./types";
import type { Difficulty, Frequency } from "@/lib/gamification";

const NOW = new Date("2026-09-13T12:00:00Z"); // Sunday

const REWARDS: Record<Difficulty, { xp: number; diamonds: number }> = {
  EASY: { xp: 10, diamonds: 1 },
  MEDIUM: { xp: 25, diamonds: 2 },
  HARD: { xp: 50, diamonds: 5 },
  EPIC: { xp: 100, diamonds: 10 },
};

function baseUser(overrides: Partial<AnalyzerUserInput> = {}): AnalyzerUserInput {
  return {
    name: "Hero",
    level: 5,
    currentXp: 420,
    diamonds: 60,
    streakCount: 3,
    longestStreak: 7,
    streakFreezes: 2,
    ...overrides,
  };
}

function makeQuest(
  id: string,
  overrides: Partial<{
    title: string;
    category: string;
    difficulty: Difficulty;
    frequency: Frequency;
  }> = {}
): AnalyzerQuestInput {
  return {
    id,
    title: overrides.title ?? `Quest ${id}`,
    category: overrides.category ?? "Focus",
    difficulty: overrides.difficulty ?? "MEDIUM",
    frequency: overrides.frequency ?? "DAILY",
    createdAt: new Date("2026-09-01T00:00:00Z"),
    scheduledAt: null,
    archivedAt: null,
  };
}

function completionFor(
  quest: AnalyzerQuestInput,
  completedAt: Date,
  overrides: Partial<{ xpAwarded: number; diamondsAwarded: number }> = {}
) {
  const reward = REWARDS[quest.difficulty];
  return {
    id: `c-${quest.id}-${completedAt.toISOString()}`,
    questId: quest.id,
    completedAt,
    xpAwarded: overrides.xpAwarded ?? reward.xp,
    diamondsAwarded: overrides.diamondsAwarded ?? reward.diamonds,
    quest,
  };
}

function weekCompletions(quests: AnalyzerQuestInput[], startDay: number, total: number) {
  return Array.from({ length: total }, (_, i) =>
    completionFor(quests[i % quests.length], utcDay(2026, 9, startDay + (i % 7)))
  );
}

function utcDay(y: number, m: number, d: number, hour = 10): Date {
  return new Date(Date.UTC(y, m - 1, d, hour));
}

describe("AI Coach analyzer", () => {
  it("computes weekly totals, deltas, and active days", () => {
    const quest = makeQuest("q1", { category: "Health", difficulty: "MEDIUM" });
    const completions = [
      // 14 in the current week (days 07..13)
      ...Array.from({ length: 14 }, (_, i) =>
        completionFor(quest, utcDay(2026, 9, 7 + (i % 7)))
      ),
      // 7 in the previous week (days 31..06)
      ...Array.from({ length: 7 }, (_, i) =>
        completionFor(quest, utcDay(2026, 8, 31 + i))
      ),
    ];

    const result = analyzeWeeklyProductivity(baseUser({ streakCount: 5 }), [quest], completions, [], {
      now: NOW,
    });

    expect(result.summary.totalQuestsCompleted).toBe(14);
    expect(result.summary.previousWeekCompleted).toBe(7);
    expect(result.summary.completedDeltaPct).toBe(100); // (14-7)/7
    expect(result.summary.totalXpEarned).toBe(14 * 25);
    expect(result.summary.previousWeekXp).toBe(7 * 25);
    expect(result.summary.xpDeltaPct).toBe(100);
    expect(result.summary.totalDiamondsEarned).toBe(28);
    expect(result.dailyActivities).toHaveLength(7);
    expect(result.summary.activeDaysCount).toBe(7);
  });

  it("estimates missed quests and completion rate from active DAILY quests", () => {
    const quests = [
      makeQuest("q1", { category: "Fitness" }),
      makeQuest("q2", { category: "Study" }),
      makeQuest("q3", { category: "Craft" }),
    ];
    const completions = weekCompletions(quests, 7, 14);

    const result = analyzeWeeklyProductivity(baseUser(), quests, completions, [], {
      now: NOW,
    });

    // 3 DAILY quests * 7 days = 21 expected, 14 completed -> 7 missed
    expect(result.summary.totalScheduledExpected).toBe(21);
    expect(result.summary.missedQuestsCount).toBe(7);
    expect(result.summary.completionRatePct).toBe(Math.round((14 / 21) * 100));
  });

  it("never reports negative missed quests when completions exceed the estimate", () => {
    // 1 DAILY quest = 7 expected but user completed 10 in the window
    const quest = makeQuest("q1");
    const completions = Array.from({ length: 10 }, (_, i) =>
      completionFor(quest, utcDay(2026, 9, 7 + (i % 7)))
    );

    const result = analyzeWeeklyProductivity(baseUser(), [quest], completions, [], {
      now: NOW,
    });

    expect(result.summary.totalScheduledExpected).toBe(10);
    expect(result.summary.missedQuestsCount).toBe(0);
    expect(result.summary.completionRatePct).toBe(100);
  });

  it("produces category breakdown sorted by completion count with top category", () => {
    const health = makeQuest("q1", { category: "Health", difficulty: "EASY" });
    const study = makeQuest("q2", { category: "Study", difficulty: "MEDIUM" });
    const completions = [
      ...Array.from({ length: 5 }, (_, i) => completionFor(health, utcDay(2026, 9, 7 + i))),
      ...Array.from({ length: 3 }, (_, i) => completionFor(study, utcDay(2026, 9, 9 + i))),
    ];

    const result = analyzeWeeklyProductivity(baseUser(), [health, study], completions, [], {
      now: NOW,
    });

    expect(result.categoryBreakdown).toHaveLength(2);
    expect(result.categoryBreakdown[0].category).toBe("Health");
    expect(result.categoryBreakdown[0].completedCount).toBe(5);
    expect(result.categoryBreakdown[0].percentage).toBe(Math.round((5 / 8) * 100));
    expect(result.summary.topCategory?.name).toBe("Health");
  });

  it("reflects difficulty distribution and rewards", () => {
    const easy = makeQuest("q1", { difficulty: "EASY" });
    const epic = makeQuest("q2", { difficulty: "EPIC" });
    const completions = [
      completionFor(easy, utcDay(2026, 9, 7)),
      completionFor(epic, utcDay(2026, 9, 8)),
    ];

    const result = analyzeWeeklyProductivity(baseUser(), [easy, epic], completions, [], {
      now: NOW,
    });

    const easyRow = result.difficultyBreakdown.find((d) => d.difficulty === "EASY");
    const epicRow = result.difficultyBreakdown.find((d) => d.difficulty === "EPIC");
    expect(easyRow?.completedCount).toBe(1);
    expect(easyRow?.xpEarned).toBe(10);
    expect(epicRow?.completedCount).toBe(1);
    expect(epicRow?.xpEarned).toBe(100);
  });

  it("returns streak momentum tiers", () => {
    const quest = makeQuest("q1");
    const completions = [completionFor(quest, utcDay(2026, 9, 7))];

    const onFire = analyzeWeeklyProductivity(
      baseUser({ streakCount: 6 }),
      [quest],
      completions,
      [],
      { now: NOW }
    );
    expect(onFire.streakAnalysis.momentum).toBe("ON_FIRE");

    const steady = analyzeWeeklyProductivity(
      baseUser({ streakCount: 2 }),
      [quest],
      completions,
      [],
      { now: NOW }
    );
    expect(steady.streakAnalysis.momentum).toBe("STEADY");

    const fresh = analyzeWeeklyProductivity(baseUser({ streakCount: 0 }), [quest], [], [], {
      now: NOW,
    });
    expect(fresh.streakAnalysis.momentum).toBe("FRESH_START");
  });

  it("flags RECOVERING momentum when a freeze shield was used in the period", () => {
    const quest = makeQuest("q1");
    const completions = [completionFor(quest, utcDay(2026, 9, 7))];
    const events = [
      {
        id: "e1",
        type: "STREAK_FREEZE_USED",
        payload: "{}",
        createdAt: utcDay(2026, 9, 8),
      },
    ];

    const result = analyzeWeeklyProductivity(
      baseUser({ streakCount: 0, streakFreezes: 1 }),
      [quest],
      completions,
      events,
      { now: NOW }
    );

    expect(result.streakAnalysis.momentum).toBe("RECOVERING");
    expect(result.streakAnalysis.freezesUsedInPeriod).toBe(1);
  });

  it("generates difficulty-challenge suggestions when only easy/medium quests were done", () => {
    const quests = [
      makeQuest("q1", { difficulty: "EASY", category: "Fitness" }),
      makeQuest("q2", { difficulty: "MEDIUM", category: "Study" }),
      makeQuest("q3", { difficulty: "EASY", category: "Craft" }),
    ];
    const completions = weekCompletions(quests, 7, 4);

    const result = analyzeWeeklyProductivity(
      baseUser({ streakCount: 2 }),
      quests,
      completions,
      [],
      { now: NOW }
    );

    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0].id).toBe("sug-difficulty-step-up");
    expect(result.suggestions).toHaveLength(3);
  });

  it("sets CELEBRATORY persona for an epic week", () => {
    const quests = Array.from({ length: 4 }, (_, i) => makeQuest(`q${i + 1}`));
    const completions = weekCompletions(quests, 7, 12);

    const result = analyzeWeeklyProductivity(
      baseUser({ streakCount: 7 }),
      quests,
      completions,
      [],
      { now: NOW }
    );

    expect(result.coachPersona.mood).toBe("CELEBRATORY");
    expect(result.coachPersona.headline).toContain("12 Quests");
  });

  it("uses ENCOURAGING persona and fresh-start advice when there is no activity", () => {
    const result = analyzeWeeklyProductivity(baseUser({ streakCount: 0 }), [], [], [], {
      now: NOW,
    });

    expect(result.coachPersona.mood).toBe("ENCOURAGING");
    expect(result.summary.totalQuestsCompleted).toBe(0);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});