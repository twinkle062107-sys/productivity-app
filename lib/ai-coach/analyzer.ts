import {
  type Difficulty,
  toUtcDayKey,
} from "@/lib/gamification";
import type {
  AnalyzerCompletionInput,
  AnalyzerEventInput,
  AnalyzerQuestInput,
  AnalyzerUserInput,
  CategoryPerformance,
  CoachPersonaState,
  CoachSuggestion,
  DailyActivity,
  DifficultyBreakdownItem,
  StreakAnalysis,
  StreakMomentum,
  WeeklyCoachInsights,
  WeeklyProductivitySummary,
} from "./types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const CATEGORY_STYLES: Record<
  string,
  { emoji: string; colorClass: string; barColorClass: string }
> = {
  Health: { emoji: "❤️", colorClass: "bg-rose-50 text-rose-700", barColorClass: "bg-rose-400" },
  Wellness: { emoji: "🌿", colorClass: "bg-emerald-50 text-emerald-700", barColorClass: "bg-emerald-400" },
  Fitness: { emoji: "⚡", colorClass: "bg-amber-50 text-amber-700", barColorClass: "bg-amber-400" },
  Work: { emoji: "💼", colorClass: "bg-blue-50 text-blue-700", barColorClass: "bg-blue-400" },
  Code: { emoji: "💻", colorClass: "bg-cyan-50 text-cyan-700", barColorClass: "bg-cyan-400" },
  Study: { emoji: "📚", colorClass: "bg-indigo-50 text-indigo-700", barColorClass: "bg-indigo-400" },
  Craft: { emoji: "🎨", colorClass: "bg-purple-50 text-purple-700", barColorClass: "bg-purple-400" },
  Focus: { emoji: "🎯", colorClass: "bg-violet-50 text-violet-700", barColorClass: "bg-violet-400" },
  General: { emoji: "✨", colorClass: "bg-slate-50 text-slate-700", barColorClass: "bg-slate-400" },
};

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { label: string; badgeColor: string; sortOrder: number }
> = {
  EASY: { label: "Easy", badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200", sortOrder: 1 },
  MEDIUM: { label: "Medium", badgeColor: "bg-blue-100 text-blue-800 border-blue-200", sortOrder: 2 },
  HARD: { label: "Hard", badgeColor: "bg-amber-100 text-amber-800 border-amber-200", sortOrder: 3 },
  EPIC: { label: "Epic", badgeColor: "bg-purple-100 text-purple-800 border-purple-200", sortOrder: 4 },
};

export interface AnalyzeWeeklyOptions {
  now?: Date;
  periodDays?: number;
}

/**
 * Pure analyzer that digests user state, quest history, and events to produce
 * rich weekly insights, stats, and personalized recommendations.
 */
export function analyzeWeeklyProductivity(
  user: AnalyzerUserInput,
  quests: AnalyzerQuestInput[],
  completions: AnalyzerCompletionInput[],
  events: AnalyzerEventInput[] = [],
  options: AnalyzeWeeklyOptions = {}
): WeeklyCoachInsights {
  const now = options.now ?? new Date();
  const periodDays = options.periodDays ?? 7;

  // Compute reference time ranges
  const periodEnd = new Date(now);
  const periodStart = new Date(now);
  periodStart.setUTCDate(periodStart.getUTCDate() - (periodDays - 1));
  periodStart.setUTCHours(0, 0, 0, 0);

  const prevPeriodStart = new Date(periodStart);
  prevPeriodStart.setUTCDate(prevPeriodStart.getUTCDate() - periodDays);
  const prevPeriodEnd = new Date(periodStart);
  prevPeriodEnd.setUTCMilliseconds(prevPeriodEnd.getUTCMilliseconds() - 1);

  const startUtcKey = toUtcDayKey(periodStart);
  const endUtcKey = toUtcDayKey(periodEnd);
  const prevStartUtcKey = toUtcDayKey(prevPeriodStart);
  const prevEndUtcKey = toUtcDayKey(prevPeriodEnd);

  // Group completions by period
  const currentCompletions: AnalyzerCompletionInput[] = [];
  const previousCompletions: AnalyzerCompletionInput[] = [];

  for (const c of completions) {
    const key = toUtcDayKey(c.completedAt);
    if (key >= startUtcKey && key <= endUtcKey) {
      currentCompletions.push(c);
    } else if (key >= prevStartUtcKey && key <= prevEndUtcKey) {
      previousCompletions.push(c);
    }
  }

  // 1. Build 7-Day Activity Sparkline
  const dailyMap = new Map<
    string,
    { quests: number; xp: number; diamonds: number }
  >();

  // Initialize all days in the rolling period
  const dayKeys: string[] = [];
  for (let i = 0; i < periodDays; i++) {
    const d = new Date(periodStart);
    d.setUTCDate(d.getUTCDate() + i);
    const key = toUtcDayKey(d);
    dayKeys.push(key);
    dailyMap.set(key, { quests: 0, xp: 0, diamonds: 0 });
  }

  for (const c of currentCompletions) {
    const key = toUtcDayKey(c.completedAt);
    const item = dailyMap.get(key);
    if (item) {
      item.quests += 1;
      item.xp += c.xpAwarded;
      item.diamonds += c.diamondsAwarded;
    }
  }

  const todayUtcKey = toUtcDayKey(now);
  const dailyActivities: DailyActivity[] = dayKeys.map((key) => {
    // Parse key YYYY-MM-DD
    const [y, m, d] = key.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    const dayLabel = DAY_LABELS[dateObj.getUTCDay()];
    const dateFormatted = `${MONTH_LABELS[dateObj.getUTCMonth()]} ${dateObj.getUTCDate()}`;
    const stats = dailyMap.get(key) ?? { quests: 0, xp: 0, diamonds: 0 };

    return {
      dayKey: key,
      dayLabel,
      dateFormatted,
      questsCompleted: stats.quests,
      xpEarned: stats.xp,
      diamondsEarned: stats.diamonds,
      isToday: key === todayUtcKey,
      isActive: stats.quests > 0,
    };
  });

  // 2. Summary Totals & Deltas
  const totalQuestsCompleted = currentCompletions.length;
  const previousWeekCompleted = previousCompletions.length;
  const completedDeltaPct =
    previousWeekCompleted > 0
      ? Math.round(
          ((totalQuestsCompleted - previousWeekCompleted) /
            previousWeekCompleted) *
            100
        )
      : totalQuestsCompleted > 0
      ? 100
      : 0;

  const totalXpEarned = currentCompletions.reduce((acc, c) => acc + c.xpAwarded, 0);
  const previousWeekXp = previousCompletions.reduce((acc, c) => acc + c.xpAwarded, 0);
  const xpDeltaPct =
    previousWeekXp > 0
      ? Math.round(((totalXpEarned - previousWeekXp) / previousWeekXp) * 100)
      : totalXpEarned > 0
      ? 100
      : 0;

  const totalDiamondsEarned = currentCompletions.reduce(
    (acc, c) => acc + c.diamondsAwarded,
    0
  );

  const activeDaysCount = dailyActivities.filter((d) => d.isActive).length;

  // Best day computation
  let bestDayActivity: DailyActivity | null = null;
  for (const d of dailyActivities) {
    if (
      !bestDayActivity ||
      d.questsCompleted > bestDayActivity.questsCompleted ||
      (d.questsCompleted === bestDayActivity.questsCompleted &&
        d.xpEarned > bestDayActivity.xpEarned)
    ) {
      if (d.questsCompleted > 0) {
        bestDayActivity = d;
      }
    }
  }

  const bestDay = bestDayActivity
    ? {
        dayLabel: bestDayActivity.dayLabel,
        questsCompleted: bestDayActivity.questsCompleted,
        xpEarned: bestDayActivity.xpEarned,
      }
    : null;

  // 3. Expected vs Completed vs Missed Calculations
  // Estimate scheduled recurring quests expectations over the 7-day period
  let totalScheduledExpected = 0;
  const activeQuests = quests.filter((q) => !q.archivedAt);

  for (const q of activeQuests) {
    if (q.frequency === "DAILY") {
      // Daily quests are expected every day
      totalScheduledExpected += periodDays;
    } else if (q.frequency === "WEEKLY") {
      totalScheduledExpected += 1;
    } else {
      // ONCE / CUSTOM: expected at least 1 if scheduled or created during period
      totalScheduledExpected += 1;
    }
  }

  // Ensure minimum baseline matches actual completions if user completed more than expected
  if (totalQuestsCompleted > totalScheduledExpected) {
    totalScheduledExpected = totalQuestsCompleted;
  }

  const missedQuestsCount = Math.max(
    0,
    totalScheduledExpected - totalQuestsCompleted
  );

  const completionRatePct =
    totalScheduledExpected > 0
      ? Math.round((totalQuestsCompleted / totalScheduledExpected) * 100)
      : totalQuestsCompleted > 0
      ? 100
      : 0;

  // 4. Category Performance Breakdown
  const categoryCountMap = new Map<
    string,
    { count: number; xp: number }
  >();

  for (const c of currentCompletions) {
    const cat = (c.quest?.category || "Focus").trim();
    const existing = categoryCountMap.get(cat) || { count: 0, xp: 0 };
    existing.count += 1;
    existing.xp += c.xpAwarded;
    categoryCountMap.set(cat, existing);
  }

  const categoryBreakdown: CategoryPerformance[] = Array.from(
    categoryCountMap.entries()
  )
    .map(([cat, val]) => {
      const style =
        CATEGORY_STYLES[cat] || {
          emoji: "✨",
          colorClass: "bg-purple-50 text-purple-700",
          barColorClass: "bg-purple-400",
        };
      const percentage =
        totalQuestsCompleted > 0
          ? Math.round((val.count / totalQuestsCompleted) * 100)
          : 0;

      return {
        category: cat,
        completedCount: val.count,
        totalXp: val.xp,
        percentage,
        badgeEmoji: style.emoji,
        colorClass: style.colorClass,
        barColorClass: style.barColorClass,
      };
    })
    .sort((a, b) => b.completedCount - a.completedCount);

  const topCategory =
    categoryBreakdown.length > 0
      ? {
          name: categoryBreakdown[0].category,
          completedCount: categoryBreakdown[0].completedCount,
          percentage: categoryBreakdown[0].percentage,
        }
      : null;

  // 5. Difficulty Breakdown
  const diffCountMap: Record<Difficulty, { count: number; xp: number }> = {
    EASY: { count: 0, xp: 0 },
    MEDIUM: { count: 0, xp: 0 },
    HARD: { count: 0, xp: 0 },
    EPIC: { count: 0, xp: 0 },
  };

  for (const c of currentCompletions) {
    const diff = (c.quest?.difficulty || "MEDIUM") as Difficulty;
    if (diffCountMap[diff]) {
      diffCountMap[diff].count += 1;
      diffCountMap[diff].xp += c.xpAwarded;
    }
  }

  const difficultyBreakdown: DifficultyBreakdownItem[] = (
    ["EASY", "MEDIUM", "HARD", "EPIC"] as Difficulty[]
  ).map((d) => {
    const data = diffCountMap[d];
    const percentage =
      totalQuestsCompleted > 0
        ? Math.round((data.count / totalQuestsCompleted) * 100)
        : 0;
    const cfg = DIFFICULTY_CONFIG[d];

    return {
      difficulty: d,
      completedCount: data.count,
      xpEarned: data.xp,
      percentage,
      label: cfg.label,
      badgeColor: cfg.badgeColor,
    };
  });

  // 6. Streak Analysis & Events
  let freezesUsedInPeriod = 0;
  for (const ev of events) {
    if (ev.type === "STREAK_FREEZE_USED") {
      const evKey = toUtcDayKey(ev.createdAt);
      if (evKey >= startUtcKey && evKey <= endUtcKey) {
        freezesUsedInPeriod += 1;
      }
    }
  }

  let momentum: StreakMomentum = "FRESH_START";
  let momentumMessage = "Start your streak today by completing your first quest!";

  if (user.streakCount >= 5) {
    momentum = "ON_FIRE";
    momentumMessage = `Blazing ${user.streakCount}-day streak! You are an unstoppable productivity machine.`;
  } else if (user.streakCount >= 2) {
    momentum = "STEADY";
    momentumMessage = `Solid ${user.streakCount}-day streak! Keep up the daily rhythm.`;
  } else if (freezesUsedInPeriod > 0) {
    momentum = "RECOVERING";
    momentumMessage = `Streak Freeze shielded your streak! Keep the flame alive today.`;
  } else if (user.streakCount === 1) {
    momentum = "STEADY";
    momentumMessage = `Day 1 conquered! Complete another quest tomorrow to build momentum.`;
  }

  const streakAnalysis: StreakAnalysis = {
    currentStreak: user.streakCount,
    longestStreak: user.longestStreak,
    freezesRemaining: user.streakFreezes,
    freezesUsedInPeriod,
    momentum,
    momentumMessage,
  };

  // 7. Dynamic Tailored Suggestions
  const suggestions: CoachSuggestion[] = [];

  // Suggestion A: Difficulty challenge
  const hardEpicCount =
    diffCountMap.HARD.count + diffCountMap.EPIC.count;
  if (hardEpicCount === 0 && totalQuestsCompleted >= 3) {
    suggestions.push({
      id: "sug-difficulty-step-up",
      title: "Step Up the Challenge",
      description:
        "You crushed several Easy/Medium tasks this week! Try introducing 1 HARD or EPIC quest to unlock massive XP bonuses.",
      tag: "DIFFICULTY",
      tagLabel: "XP Boost",
      emoji: "⚔️",
      actionableStep: "Create or tackle a HARD quest (+50 XP) this week.",
    });
  } else if (hardEpicCount >= 3) {
    suggestions.push({
      id: "sug-boss-slayer",
      title: "Boss Slayer Momentum",
      description:
        `Remarkable courage! You cleared ${hardEpicCount} high-tier quests. Channel this power into a Boss Battle encounter!`,
      tag: "CHALLENGE",
      tagLabel: "Boss Battle",
      emoji: "🐉",
      actionableStep: "Summon a Boss or progress a Quest Chain to earn victory diamonds.",
    });
  }

  // Suggestion B: Streak & Consistency
  if (user.streakCount >= 3 && user.streakCount < 7) {
    suggestions.push({
      id: "sug-reach-7day-badge",
      title: "Aim for the 7-Day Badge",
      description:
        `Your streak is currently at ${user.streakCount} days! Reach 7 days to unlock the legendary 'Streak Master' trophy.`,
      tag: "STREAK",
      tagLabel: "Milestone",
      emoji: "🔥",
      actionableStep: "Complete at least one quest daily without breaking momentum.",
    });
  } else if (user.streakCount === 0) {
    suggestions.push({
      id: "sug-ignite-streak",
      title: "Ignite Your Flame",
      description:
        "Daily consistency is the secret sauce. Complete just one small quest every morning to build a 3-day streak.",
      tag: "HABIT",
      tagLabel: "Habit Loop",
      emoji: "✨",
      actionableStep: "Check off your highest-priority quest first thing today.",
    });
  }

  // Suggestion C: Category balance
  if (categoryBreakdown.length === 1 && totalQuestsCompleted >= 2) {
    suggestions.push({
      id: "sug-category-variety",
      title: "Diversify Your Hero Stats",
      description:
        `All your activity was in ${categoryBreakdown[0].category}! Balancing Wellness, Learning, or Health prevents burnout.`,
      tag: "CATEGORY",
      tagLabel: "Balance",
      emoji: "🌿",
      actionableStep: "Add a quick 5-minute Wellness or Fitness quest for balance.",
    });
  } else if (topCategory) {
    suggestions.push({
      id: "sug-mastery-domain",
      title: `${topCategory.name} Specialist`,
      description:
        `You dedicated ${topCategory.percentage}% of your energy to ${topCategory.name}. Keep expanding your domain expertise!`,
      tag: "CATEGORY",
      tagLabel: "Domain Focus",
      emoji: "🎯",
      actionableStep: `Set up a multi-step Quest Chain in ${topCategory.name}.`,
    });
  }

  // Suggestion D: Pacing & Active Days
  if (activeDaysCount < 4 && totalQuestsCompleted > 0) {
    suggestions.push({
      id: "sug-spread-effort",
      title: "Spread the Magic",
      description:
        `You were active on ${activeDaysCount} of 7 days. Micro-habits spread across 5+ days yield stronger long-term retention.`,
      tag: "HABIT",
      tagLabel: "Pacing",
      emoji: "📆",
      actionableStep: "Set up 1 daily micro-quest with reminder notifications turned on.",
    });
  }

  // Fallback suggestion if list has < 3
  if (suggestions.length < 3) {
    suggestions.push({
      id: "sug-rewards-shop",
      title: "Protect Your Gains",
      description:
        "Make sure you have Streak Freezes equipped in your inventory so unexpected busy days don't reset your progress.",
      tag: "CHALLENGE",
      tagLabel: "Protection",
      emoji: "❄️",
      actionableStep: "Check your Freeze inventory and top up in the Quick Actions menu.",
    });
  }

  // Limit suggestions to top 3
  const finalSuggestions = suggestions.slice(0, 3);

  // 8. Coach Persona State
  const userName = user.name || "Hero";
  let greeting = `Greetings, ${userName}!`;
  let headline = "Your Weekly Intelligence Briefing";
  let motivationalQuote = "Every small victory fuels your legendary journey.";
  let mood: CoachPersonaState["mood"] = "COACHING";
  let mascotEmoji = "🧙‍♂️";

  if (totalQuestsCompleted >= 10 || completionRatePct >= 80) {
    mood = "CELEBRATORY";
    greeting = `Magnificent work, ${userName}!`;
    headline = `Epic Week: ${totalQuestsCompleted} Quests Conquered!`;
    motivationalQuote =
      "You operated at peak mastery this week. Carry this formidable momentum into the next realm!";
    mascotEmoji = "🏆";
  } else if (totalQuestsCompleted >= 4) {
    mood = "MOTIVATING";
    greeting = `Great steady pace, ${userName}!`;
    headline = `Solid Progress: +${totalXpEarned} XP Earned`;
    motivationalQuote =
      "Consistency is compounding in your favor. A couple of targeted quest chains will take you even higher.";
    mascotEmoji = "⚡";
  } else if (totalQuestsCompleted > 0) {
    mood = "COACHING";
    greeting = `Good start, ${userName}!`;
    headline = "Building Your Weekly Rhythm";
    motivationalQuote =
      "Every grand adventure starts with small steps. Let's aim for 5 active days this upcoming week!";
    mascotEmoji = "🌱";
  } else {
    mood = "ENCOURAGING";
    greeting = `Welcome to the Arena, ${userName}!`;
    headline = "Your Quest Log Awaits";
    motivationalQuote =
      "Your journey starts with a single tap. Pick your first quest and start gathering XP!";
    mascotEmoji = "✨";
  }

  const coachPersona: CoachPersonaState = {
    greeting,
    headline,
    motivationalQuote,
    mood,
    mascotEmoji,
  };

  const summary: WeeklyProductivitySummary = {
    totalQuestsCompleted,
    previousWeekCompleted,
    completedDeltaPct,
    totalXpEarned,
    previousWeekXp,
    xpDeltaPct,
    totalDiamondsEarned,
    activeDaysCount,
    totalScheduledExpected,
    missedQuestsCount,
    completionRatePct,
    bestDay,
    topCategory,
  };

  return {
    summary,
    dailyActivities,
    categoryBreakdown,
    difficultyBreakdown,
    streakAnalysis,
    suggestions: finalSuggestions,
    coachPersona,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
  };
}
