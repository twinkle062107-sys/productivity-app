"use client";

import { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { createBossAction, type BossData } from "@/lib/actions/boss";

const PRESET_BOSSES = [
  { title: "Sloth Slime", maxHp: 50, emoji: "🟢", desc: "Easy warmup encounter" },
  { title: "Procrastination Dragon", maxHp: 100, emoji: "🐉", desc: "Standard daily foe" },
  { title: "Distraction Golem", maxHp: 200, emoji: "🗿", desc: "Requires persistent focus" },
  { title: "Deadline Overlord", maxHp: 400, emoji: "⚡", desc: "Epic marathon battle" },
];

export function CreateBossDialog({
  onBossCreated,
}: {
  onBossCreated: (boss: BossData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [maxHp, setMaxHp] = useState<number>(100);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelectPreset = (preset: (typeof PRESET_BOSSES)[0]) => {
    setTitle(preset.title);
    setMaxHp(preset.maxHp);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a Boss name.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const res = await createBossAction({
        title: title.trim(),
        maxHp,
      });

      if (res.success && res.data) {
        onBossCreated(res.data);
        setOpen(false);
        setTitle("");
        setMaxHp(100);
      } else {
        setError(res.error ?? "Failed to spawn boss.");
      }
    });
  };

  const modalContent = open && mounted ? (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="spawn-boss-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-[2rem] border-2 border-white bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐉</span>
            <h2 id="spawn-boss-title" className="text-lg font-black text-qd-ink">
              Spawn Boss
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
          Quests deal damage to your active boss. Defeat them for bonus XP and Diamonds!
        </p>

        {/* Presets */}
        <div className="mt-4">
          <p className="text-[11px] font-black uppercase tracking-wide text-qd-muted">
            Choose a Challenger
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {PRESET_BOSSES.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`flex flex-col items-start rounded-2xl border p-2.5 text-left transition ${
                  title === preset.title
                    ? "border-rose-400 bg-rose-50 shadow-sm"
                    : "border-slate-100 bg-slate-50/80 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>{preset.emoji}</span>
                  <span className="text-xs font-black text-qd-ink truncate">
                    {preset.title}
                  </span>
                </div>
                <span className="mt-1 text-[10px] font-extrabold text-qd-rose">
                  {preset.maxHp} HP
                </span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-qd-muted">Boss Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Procrastination Drake"
              maxLength={60}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-bold text-qd-ink shadow-sm placeholder:text-qd-muted/50 focus:border-rose-400 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-qd-muted">
              <span>Boss Health (HP)</span>
              <span className="font-black text-qd-rose">{maxHp} HP</span>
            </div>
            <input
              type="range"
              min={30}
              max={500}
              step={10}
              value={maxHp}
              onChange={(e) => setMaxHp(Number(e.target.value))}
              className="mt-2 w-full accent-rose-500"
            />
            <div className="flex justify-between text-[10px] text-qd-muted">
              <span>30 HP (Quick)</span>
              <span>500 HP (Boss Raid)</span>
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
              className="flex-1 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 py-2.5 text-xs font-black text-white shadow-md shadow-rose-500/25 transition active:scale-95 disabled:opacity-50"
            >
              {isPending ? "Summoning..." : "Summon Boss ⚔️"}
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
        className="rounded-full bg-[#ffe8ef] px-3 py-1 text-xs font-extrabold text-qd-rose shadow-sm transition hover:bg-[#ffd6e3] active:scale-95"
      >
        + Spawn Boss
      </button>

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
