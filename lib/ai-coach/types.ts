import type { Difficulty, Frequency } from "@/lib/gamification";

export type StreakMomentum = "ON_FIRE" | "STEADY" | "RECOVERING" | "FRESH_START";

export interface DailyActivity {
  dayKey: string; // YYYY-MM-DD
  dayLabel: string; // Mon, Tue, etc.
  dateFormatted: string; // Sep 4
  questsCompleted: number;
  xpEarned: number;
  diamondsEarned: number;
  isToday: boolean;
  isActive: boolean;
}

export interface CategoryPerformance {
  category: string;
  completedCount: number;
  totalXp: number;
  percentage: number;
  badgeEmoji: string;
  colorClass: string;
  barColorClass: string;
}

export interface DifficultyBreakdownItem {
  difficulty: Difficulty;
  completedCount: number;
  xpEarned: number;
  percentage: number;
  label: string;
  badgeColor: string;
}

export interface StreakAnalysis {
  currentStreak: number;
  longestStreak: number;
  freezesRemaining: number;
  freezesUsedInPeriod: number;
  momentum: StreakMomentum;
  momentumMessage: string;
}

export interface CoachSuggestion {
  id: string;
  title: string;
  description: string;
  tag: "DIFFICULTY" | "STREAK" | "CATEGORY" | "HABIT" | "CHALLENGE";
  tagLabel: string;
  emoji: string;
  actionableStep: string;
}

export interface WeeklyProductivitySummary {
  totalQuestsCompleted: number;
  previousWeekCompleted: number;
  completedDeltaPct: number; // e.g. +25 or -10
  totalXpEarned: number;
  previousWeekXp: number;
  xpDeltaPct: number;
  totalDiamondsEarned: number;
  activeDaysCount: number; // 0..7
  totalScheduledExpected: number;
  missedQuestsCount: number;
  completionRatePct: number; // 0..100
  bestDay: {
    dayLabel: string;
    questsCompleted: number;
    xpEarned: number;
  } | null;
  topCategory: {
    name: string;
    completedCount: number;
    percentage: number;
  } | null;
}

export interface CoachPersonaState {
  greeting: string;
  headline: string;
  motivationalQuote: string;
  mood: "CELEBRATORY" | "MOTIVATING" | "COACHING" | "ENCOURAGING";
  mascotEmoji: string;
}

export interface WeeklyCoachInsights {
  summary: WeeklyProductivitySummary;
  dailyActivities: DailyActivity[];
  categoryBreakdown: CategoryPerformance[];
  difficultyBreakdown: DifficultyBreakdownItem[];
  streakAnalysis: StreakAnalysis;
  suggestions: CoachSuggestion[];
  coachPersona: CoachPersonaState;
  periodStart: string; // ISO string
  periodEnd: string; // ISO string
}

export interface AnalyzerQuestInput {
  id: string;
  title: string;
  category?: string | null;
  difficulty: Difficulty;
  frequency: Frequency;
  createdAt: Date;
  scheduledAt?: Date | null;
  archivedAt?: Date | null;
}

export interface AnalyzerCompletionInput {
  id: string;
  questId: string;
  completedAt: Date;
  xpAwarded: number;
  diamondsAwarded: number;
  quest?: AnalyzerQuestInput | null;
}

export interface AnalyzerEventInput {
  id: string;
  type: string;
  payload: string;
  createdAt: Date;
}

export interface AnalyzerUserInput {
  name?: string | null;
  level: number;
  currentXp: number;
  diamonds: number;
  streakCount: number;
  longestStreak: number;
  streakFreezes: number;
}
