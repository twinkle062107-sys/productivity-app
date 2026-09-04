"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createQuestAction } from "@/lib/actions/quest";
import { XP_BY_DIFFICULTY, DIAMONDS_BY_DIFFICULTY, type Difficulty, type Frequency } from "@/lib/gamification";

const PRESET_CATEGORIES = ["Study", "Health", "Craft", "Code", "Daily"];

const DIFFICULTIES: Array<{ key: Difficulty; label: string; bg: string; text: string }> = [
  { key: "EASY", label: "Easy", bg: "bg-[#e7fff8]", text: "text-emerald-700" },
  { key: "MEDIUM", label: "Medium", bg: "bg-[#ece7ff]", text: "text-qd-lavender" },
  { key: "HARD", label: "Hard", bg: "bg-[#fff4d6]", text: "text-amber-700" },
  { key: "EPIC", label: "Epic", bg: "bg-[#ffe8ef]", text: "text-qd-rose" },
];

const FREQUENCIES: Array<{ key: Frequency; label: string }> = [
  { key: "DAILY", label: "Daily" },
  { key: "WEEKLY", label: "Weekly" },
  { key: "ONCE", label: "Once" },
];

import { QuestData } from "@/components/quests/quest-item";

export function CreateQuestDialog({
  onQuestCreated,
}: {
  onQuestCreated?: (quest: QuestData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Study");
  const [customCategory, setCustomCategory] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [frequency, setFrequency] = useState<Frequency>("DAILY");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a quest title");
      return;
    }
    setError(null);

    const finalCategory = category === "Custom" ? customCategory.trim() || "Focus" : category;

    startTransition(async () => {
      const res = await createQuestAction({
        title: title.trim(),
        description: description.trim() || undefined,
        category: finalCategory,
        difficulty,
        frequency,
        reminderOn: true,
      });

      if (!res.success || !res.data) {
        setError(res.error ?? "Failed to create quest");
      } else {
        const createdQuest: QuestData = {
          id: res.data.id,
          title: res.data.title,
          description: res.data.description,
          category: res.data.category,
          difficulty: res.data.difficulty,
          frequency: res.data.frequency,
          isCompletedToday: res.data.isCompletedToday,
          completionsCount: res.data.completionsCount,
        };

        setTitle("");
        setDescription("");
        setCategory("Study");
        setCustomCategory("");
        setDifficulty("MEDIUM");
        setFrequency("DAILY");
        setOpen(false);
        onQuestCreated?.(createdQuest);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full bg-qd-lavender px-4 py-2 text-xs font-extrabold text-white shadow-md transition hover:opacity-90 active:scale-95"
          />
        }
      >
        <span className="text-base font-black leading-none">+</span>
        <span>New Quest</span>
      </DialogTrigger>

      <DialogContent className="qd-glass max-w-sm rounded-[2rem] border-white/80 p-6 text-qd-ink shadow-2xl backdrop-blur-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-qd-lavender/20 text-lg">
              ✨
            </span>
            <DialogTitle className="text-xl font-black text-qd-ink">
              Create New Quest
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-100 p-2.5 text-xs font-bold text-rose-700">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-qd-muted">
              Quest Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Study algorithms for 40 mins"
              maxLength={80}
              className="mt-1.5 w-full rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm font-bold text-qd-ink placeholder:font-medium placeholder:text-qd-muted/60 focus:border-qd-lavender focus:bg-white focus:outline-none"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-qd-muted">
              Category
            </label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {PRESET_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
                    category === cat
                      ? "bg-qd-lavender text-white shadow-sm"
                      : "bg-white/80 text-qd-ink hover:bg-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCategory("Custom")}
                className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
                  category === "Custom"
                    ? "bg-qd-lavender text-white shadow-sm"
                    : "bg-white/80 text-qd-muted hover:bg-white"
                }`}
              >
                + Custom
              </button>
            </div>
            {category === "Custom" && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category"
                maxLength={40}
                className="mt-2 w-full rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-xs font-bold text-qd-ink focus:border-qd-lavender focus:outline-none"
              />
            )}
          </div>

          {/* Difficulty & Rewards */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-qd-muted">
                Difficulty
              </label>
              <span className="text-xs font-bold text-qd-lavender">
                +{XP_BY_DIFFICULTY[difficulty]} XP · +{DIAMONDS_BY_DIFFICULTY[difficulty]} 💎
              </span>
            </div>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff.key}
                  type="button"
                  onClick={() => setDifficulty(diff.key)}
                  className={`flex flex-col items-center rounded-2xl p-2.5 transition ${
                    difficulty === diff.key
                      ? "border-2 border-qd-lavender bg-white shadow-md ring-2 ring-qd-lavender/30"
                      : `${diff.bg} opacity-75 hover:opacity-100`
                  }`}
                >
                  <span className={`text-xs font-extrabold ${diff.text}`}>{diff.label}</span>
                  <span className="mt-0.5 text-[10px] font-bold text-qd-muted">
                    +{XP_BY_DIFFICULTY[diff.key]} XP
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-qd-muted">
              Frequency
            </label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {FREQUENCIES.map((freq) => (
                <button
                  key={freq.key}
                  type="button"
                  onClick={() => setFrequency(freq.key)}
                  className={`rounded-xl py-2 text-center text-xs font-extrabold transition ${
                    frequency === freq.key
                      ? "bg-qd-ink text-white shadow-sm"
                      : "bg-white/80 text-qd-ink hover:bg-white"
                  }`}
                >
                  {freq.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="qd-cta flex w-full items-center justify-center rounded-full py-3 text-sm font-extrabold text-white shadow-lg transition active:scale-[0.98] disabled:opacity-50"
            >
              {isPending ? "Creating Quest..." : "Start Quest ✨"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
