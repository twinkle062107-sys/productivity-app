"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { buyStreakFreezeAction } from "@/lib/actions/freeze";
import { STREAK_FREEZE_COST, MAX_STREAK_FREEZES } from "@/lib/gamification";
import { useHasMounted } from "@/lib/hooks/use-has-mounted";

interface StreakFreezeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  diamonds: number;
  streakFreezes: number;
  onFreezePurchased?: (updated: { diamonds: number; streakFreezes: number }) => void;
}

export function StreakFreezeDialog({
  isOpen,
  onClose,
  diamonds,
  streakFreezes,
  onFreezePurchased,
}: StreakFreezeDialogProps) {
  const mounted = useHasMounted();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!mounted || !isOpen) return null;

  const isFull = streakFreezes >= MAX_STREAK_FREEZES;
  const canAfford = diamonds >= STREAK_FREEZE_COST;

  const handleBuy = async () => {
    if (isFull || !canAfford || isPending) return;

    setIsPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await buyStreakFreezeAction();
      if (!res.success || !res.data) {
        setErrorMessage(res.error ?? "Failed to purchase Streak Freeze.");
      } else {
        setSuccessMessage("Streak Freeze equipped! Your streak is protected. 🛡️");
        if (onFreezePurchased) {
          onFreezePurchased(res.data);
        }
      }
    } catch {
      setErrorMessage("A network error occurred. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="streak-freeze-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] border border-cyan-200/60 bg-white p-6 shadow-2xl">
        {/* Background glow accents */}
        <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-cyan-300/30 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-blue-300/30 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col items-center text-center">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="absolute top-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            aria-label="Close"
          >
            ✕
          </button>

          {/* Icon */}
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-cyan-400 to-blue-500 text-4xl shadow-lg shadow-cyan-500/30">
            ❄️
          </div>

          <p className="mt-3 text-xs font-black uppercase tracking-widest text-cyan-600">
            Streak Protection
          </p>
          <h2 id="streak-freeze-title" className="mt-1 text-2xl font-black text-qd-ink">
            Streak Freeze
          </h2>
          <p className="mt-1 text-xs text-qd-muted">
            Missed a day? An equipped freeze auto-melts to preserve your hard-earned streak!
          </p>

          {/* Freeze Slots Grid */}
          <div className="mt-5 w-full rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4">
            <p className="text-xs font-extrabold text-cyan-900">
              Inventory ({streakFreezes} / {MAX_STREAK_FREEZES})
            </p>
            <div className="mt-3 flex justify-center gap-3">
              {Array.from({ length: MAX_STREAK_FREEZES }).map((_, idx) => {
                const isHeld = idx < streakFreezes;
                return (
                  <div
                    key={idx}
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition-all ${
                      isHeld
                        ? "border-cyan-400 bg-cyan-100 text-2xl shadow-sm animate-in zoom-in-50 duration-200"
                        : "border-dashed border-slate-300 bg-white/70 text-base text-slate-300"
                    }`}
                  >
                    {isHeld ? "❄️" : idx + 1}
                  </div>
                );
              })}
            </div>
            <p className="mt-2.5 text-[11px] text-cyan-700">
              {isFull
                ? "Maximum protection active! You can hold up to 3 freezes."
                : `You can equip ${MAX_STREAK_FREEZES - streakFreezes} more freeze${
                    MAX_STREAK_FREEZES - streakFreezes === 1 ? "" : "s"
                  }.`}
            </p>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="mt-3 w-full rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-bold text-rose-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mt-3 w-full rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-bold text-emerald-700">
              {successMessage}
            </div>
          )}

          {/* Balance & Buy Button */}
          <div className="mt-5 w-full space-y-2">
            <div className="flex items-center justify-between text-xs font-bold px-1">
              <span className="text-qd-muted">Your Balance:</span>
              <span className="text-amber-700">{diamonds} 💎</span>
            </div>

            <button
              type="button"
              onClick={handleBuy}
              disabled={isFull || !canAfford || isPending}
              className={`w-full rounded-2xl py-3 text-sm font-black transition shadow-lg ${
                isFull
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : !canAfford
                  ? "bg-amber-100 text-amber-800 border border-amber-300 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/30 hover:brightness-105 active:scale-95"
              }`}
            >
              {isPending ? (
                "Equipping Shield..."
              ) : isFull ? (
                "Inventory Full (3/3) 🛡️"
              ) : !canAfford ? (
                `Need ${STREAK_FREEZE_COST} 💎 (You have ${diamonds} 💎)`
              ) : (
                `Buy Streak Freeze (${STREAK_FREEZE_COST} 💎) ❄️`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
