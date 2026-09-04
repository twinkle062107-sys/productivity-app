"use client";

import { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  updateQuestAction,
  deleteQuestAction,
  type QuestDetailData,
} from "@/lib/actions/quest";
import {
  XP_BY_DIFFICULTY,
  DIAMONDS_BY_DIFFICULTY,
  type Difficulty,
  type Frequency,
} from "@/lib/gamification";

const PRESET_CATEGORIES = ["Study", "Health", "Craft", "Code", "Daily", "Story", "Focus"];

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

export function EditQuestDialog({
  quest,
  onQuestUpdated,
}: {
  quest: QuestDetailData;
  onQuestUpdated?: (updated: QuestDetailData) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState(quest.title);
  const [description, setDescription] = useState(quest.description || "");
  const [category, setCategory] = useState(quest.category || "Focus");
  const [customCategory, setCustomCategory] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>(quest.difficulty);
  const [frequency, setFrequency] = useState<Frequency>(quest.frequency);
  const [reminderOn, setReminderOn] = useState(quest.reminderOn);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpen = () => {
    setTitle(quest.title);
    setDescription(quest.description || "");
    setCategory(quest.category || "Focus");
    setCustomCategory("");
    setDifficulty(quest.difficulty);
    setFrequency(quest.frequency);
    setReminderOn(quest.reminderOn);
    setError(null);
    setOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a quest title.");
      return;
    }
    setError(null);

    const finalCategory =
      category === "Custom" ? customCategory.trim() || "Focus" : category;

    startTransition(async () => {
      const res = await updateQuestAction(quest.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        category: finalCategory,
        difficulty,
        frequency,
        reminderOn,
      });

      if (res.success && res.data) {
        onQuestUpdated?.({
          ...quest,
          title: res.data.title,
          description: res.data.description,
          category: res.data.category,
          difficulty: res.data.difficulty,
          frequency: res.data.frequency,
          reminderOn,
        });
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error ?? "Failed to update quest.");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to remove this quest?")) return;

    setIsDeleting(true);
    startTransition(async () => {
      const res = await deleteQuestAction(quest.id);
      if (res.success) {
        setOpen(false);
        router.push("/quests");
        router.refresh();
      } else {
        setError(res.error ?? "Failed to delete quest.");
        setIsDeleting(false);
      }
    });
  };

  const modalContent = open && mounted ? (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-quest-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-[2rem] border-2 border-white bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✏️</span>
            <h2 id="edit-quest-title" className="text-lg font-black text-qd-ink">
              Edit Quest
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

        <form onSubmit={handleSave} className="mt-4 space-y-3.5">
          {error && (
            <div className="rounded-xl bg-rose-100 p-2 text-xs font-bold text-rose-700">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-qd-muted">Quest Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-bold text-qd-ink shadow-sm focus:border-qd-lavender focus:bg-white focus:outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-qd-muted">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              rows={2}
              className="mt-1 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-qd-ink shadow-sm focus:border-qd-lavender focus:bg-white focus:outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-qd-muted">Category</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {PRESET_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-black transition ${
                    category === cat
                      ? "bg-qd-lavender text-white shadow-sm"
                      : "bg-slate-100 text-qd-ink hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCategory("Custom")}
                className={`rounded-full px-3 py-1 text-xs font-black transition ${
                  category === "Custom"
                    ? "bg-qd-lavender text-white shadow-sm"
                    : "bg-slate-100 text-qd-muted hover:bg-slate-200"
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
                maxLength={30}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-qd-ink focus:border-qd-lavender focus:outline-none"
              />
            )}
          </div>

          {/* Difficulty */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-qd-muted">
              <span>Difficulty</span>
              <span className="text-qd-lavender">
                +{XP_BY_DIFFICULTY[difficulty]} XP · +{DIAMONDS_BY_DIFFICULTY[difficulty]} 💎
              </span>
            </div>
            <div className="mt-1.5 grid grid-cols-4 gap-1.5">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff.key}
                  type="button"
                  onClick={() => setDifficulty(diff.key)}
                  className={`flex flex-col items-center rounded-xl p-2 transition ${
                    difficulty === diff.key
                      ? "border-2 border-qd-lavender bg-white shadow-sm ring-1 ring-qd-lavender/30"
                      : `${diff.bg} opacity-75 hover:opacity-100`
                  }`}
                >
                  <span className={`text-xs font-black ${diff.text}`}>{diff.label}</span>
                  <span className="text-[9px] font-bold text-qd-muted">
                    +{XP_BY_DIFFICULTY[diff.key]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-xs font-bold text-qd-muted">Frequency</label>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {FREQUENCIES.map((freq) => (
                <button
                  key={freq.key}
                  type="button"
                  onClick={() => setFrequency(freq.key)}
                  className={`rounded-xl py-1.5 text-center text-xs font-black transition ${
                    frequency === freq.key
                      ? "bg-qd-ink text-white shadow-sm"
                      : "bg-slate-100 text-qd-ink hover:bg-slate-200"
                  }`}
                >
                  {freq.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isPending || isDeleting}
              className="w-full rounded-2xl bg-gradient-to-r from-qd-lavender to-purple-600 py-2.5 text-xs font-black text-white shadow-md shadow-qd-lavender/25 transition active:scale-95 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Changes ✓"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending || isDeleting}
              className="w-full rounded-2xl bg-rose-50 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-100 disabled:opacity-40"
            >
              {isDeleting ? "Archiving..." : "Archive / Delete Quest 🗑️"}
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
        onClick={handleOpen}
        className="rounded-full bg-white/80 border border-white/90 px-3.5 py-1.5 text-xs font-extrabold text-qd-ink shadow-sm transition hover:bg-white active:scale-95"
      >
        ✏️ Edit Quest
      </button>

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
