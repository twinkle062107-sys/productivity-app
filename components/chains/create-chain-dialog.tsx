"use client";

import { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { createChainAction, type QuestChainData } from "@/lib/actions/chain";
import type { Difficulty } from "@/lib/gamification";

const PRESET_CHAINS = [
  {
    title: "Morning Mastery Sprint",
    narrative: "Build an unstoppable morning routine in 3 progressive steps.",
    chapters: [
      { title: "Hydrate & Sunlight (500ml water + 10m sun)", difficulty: "EASY" as Difficulty, category: "Health" },
      { title: "Focus Deep Work (45-min pomodoro session)", difficulty: "MEDIUM" as Difficulty, category: "Study" },
      { title: "Plan Tomorrow's Top 3 Priorities", difficulty: "EASY" as Difficulty, category: "Focus" },
    ],
  },
  {
    title: "Ship Web Feature Quest",
    narrative: "From idea to production deployment in 4 tactical milestones.",
    chapters: [
      { title: "Write specification & schema draft", difficulty: "MEDIUM" as Difficulty, category: "Code" },
      { title: "Implement core Server Actions & logic", difficulty: "HARD" as Difficulty, category: "Code" },
      { title: "Build responsive UI components", difficulty: "MEDIUM" as Difficulty, category: "Code" },
      { title: "Run test suite & deploy live", difficulty: "HARD" as Difficulty, category: "Code" },
    ],
  },
  {
    title: "7-Day Mind & Body Reset",
    narrative: "A gentle journey to recharge your physical and mental energy.",
    chapters: [
      { title: "20-minute nature walk without phone", difficulty: "EASY" as Difficulty, category: "Health" },
      { title: "15-minute guided meditation & journaling", difficulty: "EASY" as Difficulty, category: "Health" },
      { title: "Full body stretch & digital sunset at 9 PM", difficulty: "MEDIUM" as Difficulty, category: "Health" },
    ],
  },
];

export function CreateChainDialog({
  onChainCreated,
}: {
  onChainCreated: (chain: QuestChainData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [narrative, setNarrative] = useState("");
  const [chapters, setChapters] = useState<
    Array<{ title: string; difficulty: Difficulty; category: string }>
  >([
    { title: "Chapter 1: The Beginning", difficulty: "EASY", category: "Focus" },
    { title: "Chapter 2: The Breakthrough", difficulty: "MEDIUM", category: "Focus" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelectPreset = (preset: (typeof PRESET_CHAINS)[0]) => {
    setTitle(preset.title);
    setNarrative(preset.narrative);
    setChapters(preset.chapters);
  };

  const handleAddChapter = () => {
    if (chapters.length >= 10) return;
    setChapters([
      ...chapters,
      {
        title: `Chapter ${chapters.length + 1}`,
        difficulty: "MEDIUM",
        category: "Focus",
      },
    ]);
  };

  const handleRemoveChapter = (index: number) => {
    if (chapters.length <= 2) return;
    setChapters(chapters.filter((_, i) => i !== index));
  };

  const handleUpdateChapter = (
    index: number,
    field: "title" | "difficulty" | "category",
    val: string
  ) => {
    setChapters(
      chapters.map((c, i) => (i === index ? { ...c, [field]: val } : c))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a Quest Chain title.");
      return;
    }
    if (chapters.some((c) => !c.title.trim())) {
      setError("All chapters must have a title.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const res = await createChainAction({
        title: title.trim(),
        narrative: narrative.trim() || undefined,
        chapters,
      });

      if (res.success && res.data) {
        onChainCreated(res.data);
        setOpen(false);
        setTitle("");
        setNarrative("");
        setChapters([
          { title: "Chapter 1: The Beginning", difficulty: "EASY", category: "Focus" },
          { title: "Chapter 2: The Breakthrough", difficulty: "MEDIUM", category: "Focus" },
        ]);
      } else {
        setError(res.error ?? "Failed to create quest chain.");
      }
    });
  };

  const modalContent = open && mounted ? (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-chain-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[2rem] border-2 border-white bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔗</span>
            <h2 id="create-chain-title" className="text-lg font-black text-qd-ink">
              Create Quest Chain
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-qd-muted transition hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <p className="mt-1.5 text-xs text-qd-muted">
          Embark on a multi-chapter storyline. Completing a chapter unlocks the next step!
        </p>

        {/* Presets */}
        <div className="mt-4">
          <p className="text-[11px] font-black uppercase tracking-wide text-qd-muted">
            Quick Story Templates
          </p>
          <div className="mt-2 space-y-2">
            {PRESET_CHAINS.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`w-full rounded-2xl border p-2.5 text-left transition ${
                  title === preset.title
                    ? "border-purple-400 bg-purple-50 shadow-sm"
                    : "border-slate-100 bg-slate-50/80 hover:bg-slate-100"
                }`}
              >
                <p className="text-xs font-black text-qd-ink">{preset.title}</p>
                <p className="text-[11px] text-qd-muted line-clamp-1">{preset.narrative}</p>
                <span className="mt-1 inline-block text-[10px] font-extrabold text-qd-lavender">
                  {preset.chapters.length} Chapters · +100 XP Completion Bonus
                </span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-qd-muted">Chain Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master React in 5 Days"
              maxLength={80}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-bold text-qd-ink shadow-sm placeholder:text-qd-muted/50 focus:border-qd-lavender focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-qd-muted">Story Narrative / Goal (Optional)</label>
            <textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="Describe the ultimate goal or storyline behind this quest..."
              rows={2}
              maxLength={500}
              className="mt-1 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-qd-ink shadow-sm placeholder:text-qd-muted/50 focus:border-qd-lavender focus:bg-white focus:outline-none"
            />
          </div>

          {/* Chapters list */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-qd-muted">
                Chapters ({chapters.length}/10)
              </label>
              {chapters.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddChapter}
                  className="text-xs font-black text-qd-lavender hover:underline"
                >
                  + Add Chapter
                </button>
              )}
            </div>

            <div className="mt-2 space-y-2">
              {chapters.map((ch, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm"
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-qd-lavender/10 text-[10px] font-black text-qd-lavender">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={ch.title}
                    onChange={(e) =>
                      handleUpdateChapter(idx, "title", e.target.value)
                    }
                    placeholder={`Chapter ${idx + 1} title`}
                    className="flex-1 min-w-0 bg-transparent text-xs font-bold text-qd-ink focus:outline-none"
                  />
                  <select
                    value={ch.difficulty}
                    onChange={(e) =>
                      handleUpdateChapter(idx, "difficulty", e.target.value)
                    }
                    className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-[10px] font-extrabold text-qd-ink focus:outline-none"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Med</option>
                    <option value="HARD">Hard</option>
                    <option value="EPIC">Epic</option>
                  </select>
                  {chapters.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChapter(idx)}
                      className="text-qd-muted hover:text-rose-500 text-xs px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-xs font-bold text-rose-500">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-2xl bg-slate-100 py-2.5 text-xs font-extrabold text-qd-muted transition hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-2xl bg-gradient-to-r from-qd-lavender to-purple-600 py-2.5 text-xs font-black text-white shadow-md shadow-qd-lavender/25 transition active:scale-95 disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Start Journey 🚀"}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-[#ece7ff] px-3 py-1 text-xs font-extrabold text-qd-lavender shadow-sm transition hover:bg-[#ded6ff] active:scale-95"
      >
        + New Chain
      </button>

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
