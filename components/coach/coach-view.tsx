"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import type {
  CoachPersonaState,
  CoachSuggestion,
  WeeklyCoachInsights,
} from "@/lib/ai-coach/types";

const MOOD_STYLES: Record<
  CoachPersonaState["mood"],
  { tint: string; chip: string; ring: string }
> = {
  CELEBRATORY: {
    tint: "from-amber-50 via-[#fff6e0] to-[#ffe8ef]/50",
    chip: "bg-amber-100 text-amber-700",
    ring: "border-amber-200/70",
  },
  MOTIVATING: {
    tint: "from-white/90 via-[#ece7ff] to-purple-50/50",
    chip: "bg-[#ece7ff] text-qd-lavender",
    ring: "border-purple-200/70",
  },
  COACHING: {
    tint: "from-white/90 via-[#e7fff8] to-teal-50/50",
    chip: "bg-teal-100 text-teal-700",
    ring: "border-teal-200/70",
  },
  ENCOURAGING: {
    tint: "from-white/90 via-[#ffe8ef] to-rose-50/50",
    chip: "bg-rose-100 text-rose-600",
    ring: "border-rose-200/70",
  },
};

const SUGGESTION_TAG_STYLES: Record<
  CoachSuggestion["tag"],
  { chip: string; emoji: string }
> = {
  DIFFICULTY: { chip: "bg-purple-100 text-purple-700", emoji: "⚔️" },
  STREAK: { chip: "bg-amber-100 text-amber-700", emoji: "🔥" },
  CATEGORY: { chip: "bg-teal-100 text-teal-700", emoji: "🎯" },
  HABIT: { chip: "bg-sky-100 text-sky-700", emoji: "✨" },
  CHALLENGE: { chip: "bg-rose-100 text-rose-600", emoji: "🐉" },
};

function formatDelta(value: number) {
  if (value > 0) return `+${value}%`;
  if (value < 0) return `${value}%`;
  return "±0%";
}

function DeltaBadge({ value }: { value: number }) {
  const positive = value > 0;
  const neutral = value === 0;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
        neutral
          ? "bg-[#ece9ff] text-qd-muted"
          : positive
            ? "bg-emerald-100 text-emerald-700"
            : "bg-rose-100 text-rose-600"
      }`}
    >
      {positive ? "▲" : neutral ? "•" : "▼"} {formatDelta(value)}
    </span>
  );
}

export function CoachView({ insights }: { insights: WeeklyCoachInsights }) {
  const {
    summary,
    dailyActivities,
    categoryBreakdown,
    difficultyBreakdown,
    streakAnalysis,
    suggestions,
    coachPersona,
  } = insights;
  const mood = MOOD_STYLES[coachPersona.mood];

  const maxDailyQuests = Math.max(
    1,
    ...dailyActivities.map((d) => d.questsCompleted)
  );

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-qd-muted">
              QuestDaily
            </p>
            <span className="rounded-full bg-[#ece7ff] px-2 py-0.5 text-[10px] font-extrabold text-qd-lavender">
              AI
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-qd-ink">Weekly Coach</h1>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ece7ff] text-2xl shadow-sm">
          🧙‍♂️
        </div>
      </header>

      {/* Coach Persona Hero */}
      <section
        className={`mt-4 rounded-[2rem] border bg-gradient-to-br p-6 shadow-sm ${mood.tint} ${mood.ring}`}
      >
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-3xl shadow-sm">
            {coachPersona.mascotEmoji}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-qd-muted">
              {coachPersona.greeting}
            </p>
            <h2 className="mt-0.5 text-lg font-black leading-tight text-qd-ink">
              {coachPersona.headline}
            </h2>
            <span
              className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${mood.chip}`}
            >
              {coachPersona.mood}
            </span>
          </div>
        </div>
        <p className="mt-4 text-sm font-semibold text-qd-ink/80">
          “{coachPersona.motivationalQuote}”
        </p>
      </section>

      {/* Summary Stat Tiles */}
      <section className="mt-4 grid grid-cols-2 gap-3">
        <div className="qd-glass rounded-[1.6rem] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wide text-qd-muted">
              Quests Done
            </p>
            <span className="text-sm">✅</span>
          </div>
          <p className="mt-1 text-xl font-black text-qd-ink">
            {summary.totalQuestsCompleted}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <DeltaBadge value={summary.completedDeltaPct} />
            <span className="text-[10px] font-bold text-qd-muted">vs last week</span>
          </div>
        </div>
        <div className="qd-glass rounded-[1.6rem] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wide text-qd-muted">
              XP Earned
            </p>
            <span className="text-sm">⚡</span>
          </div>
          <p className="mt-1 text-xl font-black text-qd-ink">+{summary.totalXpEarned}</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <DeltaBadge value={summary.xpDeltaPct} />
            <span className="text-[10px] font-bold text-qd-muted">vs last week</span>
          </div>
        </div>
        <div className="qd-glass rounded-[1.6rem] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wide text-qd-muted">
              Diamonds
            </p>
            <span className="text-sm">💎</span>
          </div>
          <p className="mt-1 text-xl font-black text-amber-600">
            +{summary.totalDiamondsEarned}
          </p>
          <p className="mt-1.5 text-[10px] font-bold text-qd-muted">this week</p>
        </div>
        <div className="qd-glass rounded-[1.6rem] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wide text-qd-muted">
              Completion
            </p>
            <span className="text-sm">🎯</span>
          </div>
          <p className="mt-1 text-xl font-black text-qd-ink">{summary.completionRatePct}%</p>
          <p className="mt-1.5 text-[10px] font-bold text-qd-muted">
            {summary.missedQuestsCount > 0
              ? `${summary.missedQuestsCount} missed`
              : "on target"}
          </p>
        </div>
      </section>

      {/* 7-Day Activity */}
      <section className="qd-glass mt-4 rounded-[2rem] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-extrabold text-qd-ink">Weekly Activity</p>
            <p className="text-xs text-qd-muted">Quests completed per day</p>
          </div>
          {summary.bestDay && (
            <span className="rounded-full bg-[#fff4d6] px-2.5 py-1 text-[11px] font-black text-amber-800 shadow-sm">
              🏅 Best: {summary.bestDay.dayLabel}
            </span>
          )}
        </div>
        <div className="mt-4 flex items-end justify-between gap-1.5">
          {dailyActivities.map((day) => {
            const height =
              day.questsCompleted > 0
                ? Math.max(20, (day.questsCompleted / maxDailyQuests) * 100)
                : 8;
            return (
              <div
                key={day.dayKey}
                className="flex flex-1 flex-col items-center gap-1.5"
              >
                <span className="text-[10px] font-black text-qd-ink">
                  {day.questsCompleted > 0 ? day.questsCompleted : ""}
                </span>
                <div className="flex h-20 w-full items-end justify-center">
                  <div
                    className={`w-full max-w-[1.4rem] rounded-full transition-all duration-500 ${
                      day.isActive
                        ? day.isToday
                          ? "bg-gradient-to-t from-qd-lavender to-qd-pink shadow-sm"
                          : "bg-qd-lavender/80"
                        : "bg-[#ece9ff]"
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] font-bold ${
                    day.isToday ? "text-qd-lavender" : "text-qd-muted"
                  }`}
                >
                  {day.isToday ? "Today" : day.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Streak Analysis */}
      <section className="qd-glass mt-4 rounded-[2rem] p-5">
        <div className="flex items-center justify-between">
          <p className="font-extrabold text-qd-ink">Streak Report</p>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
              streakAnalysis.momentum === "ON_FIRE"
                ? "bg-amber-100 text-amber-700"
                : streakAnalysis.momentum === "RECOVERING"
                  ? "bg-sky-100 text-sky-700"
                  : "bg-[#ece7ff] text-qd-lavender"
            }`}
          >
            {streakAnalysis.momentum.replace("_", " ")}
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold text-qd-muted">
          {streakAnalysis.momentumMessage}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/70 p-3 text-center shadow-sm">
            <p className="text-lg font-black text-rose-500">
              {streakAnalysis.currentStreak} 🔥
            </p>
            <p className="text-[10px] font-bold text-qd-muted">Current</p>
          </div>
          <div className="rounded-2xl bg-white/70 p-3 text-center shadow-sm">
            <p className="text-lg font-black text-amber-600">
              {streakAnalysis.longestStreak} 🏆
            </p>
            <p className="text-[10px] font-bold text-qd-muted">Longest</p>
          </div>
          <div className="rounded-2xl bg-white/70 p-3 text-center shadow-sm">
            <p className="text-lg font-black text-cyan-600">
              {streakAnalysis.freezesRemaining} ❄️
            </p>
            <p className="text-[10px] font-bold text-qd-muted">Freezes</p>
          </div>
        </div>
        {streakAnalysis.freezesUsedInPeriod > 0 && (
          <p className="mt-3 text-[11px] font-bold text-sky-700">
            🛡️ {streakAnalysis.freezesUsedInPeriod} streak{" "}
            {streakAnalysis.freezesUsedInPeriod === 1 ? "freeze" : "freezes"} used this week
          </p>
        )}
      </section>

      {/* Category Performance */}
      <section className="qd-glass mt-4 rounded-[2rem] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-extrabold text-qd-ink">Strongest Categories</p>
            <p className="text-xs text-qd-muted">Where your energy went</p>
          </div>
          {summary.topCategory && (
            <span className="rounded-full bg-[#e7fff8] px-2.5 py-1 text-[11px] font-black text-teal-800 shadow-sm">
              🎯 {summary.topCategory.name}
            </span>
          )}
        </div>
        <div className="mt-4 space-y-3">
          {categoryBreakdown.length === 0 ? (
            <p className="text-sm font-semibold text-qd-muted">
              No quests completed this week yet — your first victory is a tap away!
            </p>
          ) : (
            categoryBreakdown.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between text-sm">
                  <span
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ${cat.colorClass}`}
                  >
                    <span>{cat.badgeEmoji}</span> {cat.category}
                  </span>
                  <span className="text-xs font-bold text-qd-muted">
                    {cat.completedCount} quests · {cat.percentage}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#ece9ff]">
                  <div
                    className={`h-full rounded-full ${cat.barColorClass}`}
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Difficulty Breakdown */}
      <section className="qd-glass mt-4 rounded-[2rem] p-5">
        <p className="font-extrabold text-qd-ink">Difficulty Mix</p>
        <p className="text-xs text-qd-muted">Performance by quest difficulty</p>
        <div className="mt-4 space-y-3">
          {difficultyBreakdown.map((d) => (
            <div key={d.difficulty}>
              <div className="flex items-center justify-between text-sm">
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-black ${d.badgeColor}`}
                >
                  {d.label}
                </span>
                <span className="text-xs font-bold text-qd-muted">
                  {d.completedCount} quests · +{d.xpEarned} XP
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#ece9ff]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-qd-lavender to-qd-pink"
                  style={{ width: `${d.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Suggestions */}
      <section className="mt-5">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-qd-ink">Next Week Battle Plan</h3>
        </div>
        <p className="mt-0.5 text-xs text-qd-muted">
          Personalized suggestions from your coach
        </p>

        <div className="mt-3 space-y-3 pb-6">
          {suggestions.map((sug, i) => {
            const tagStyle =
              SUGGESTION_TAG_STYLES[sug.tag] ?? SUGGESTION_TAG_STYLES.HABIT;
            return (
              <div
                key={sug.id}
                className="qd-glass relative overflow-hidden rounded-[1.8rem] p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-xl shadow-sm">
                    {sug.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black text-qd-ink">{sug.title}</p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${tagStyle.chip}`}
                      >
                        {sug.tagLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-qd-muted">
                      {sug.description}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/60 px-3.5 py-2.5">
                  <span className="text-sm">{tagStyle.emoji}</span>
                  <p className="text-xs font-black text-qd-ink">{sug.actionableStep}</p>
                </div>
                {i === 0 && (
                  <span className="absolute -right-3 -top-3 rotate-12 rounded-xl bg-gradient-to-br from-amber-200 to-amber-400 px-3 py-1 text-[10px] font-black text-amber-900 shadow-md">
                    TOP PICK
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <BottomNav active="/coach" />
    </>
  );
}