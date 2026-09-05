"use client";

import { createPortal } from "react-dom";
import type { UnlockedAchievementInfo } from "@/lib/actions/quest";
import { useHasMounted } from "@/lib/hooks/use-has-mounted";

export function AchievementUnlockModal({
  achievement,
  onClose,
}: {
  achievement: UnlockedAchievementInfo;
  onClose: () => void;
}) {
  const mounted = useHasMounted();

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievement-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] border-2 border-amber-300 bg-white p-6 text-center shadow-2xl">
        {/* Animated background starbursts */}
        <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-amber-300/30 blur-2xl" />
        <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-purple-300/30 blur-2xl" />

        <div className="relative">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-300 text-4xl shadow-lg shadow-amber-300/50 animate-bounce">
            {achievement.emoji}
          </div>

          <p className="mt-3 text-xs font-black uppercase tracking-widest text-amber-600">
            Achievement Unlocked!
          </p>
          <h2 id="achievement-modal-title" className="mt-1 text-2xl font-black text-qd-ink">
            {achievement.title}
          </h2>
          <p className="mt-1 text-xs text-qd-muted">
            {achievement.description}
          </p>

          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 shadow-sm">
            <p className="text-[10px] font-bold text-amber-700">Milestone Reward</p>
            <p className="mt-0.5 text-xl font-black text-amber-900">
              +{achievement.diamondReward} 💎 Diamonds
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/30 transition active:scale-95"
          >
            Claim Badge & Continue ✨
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
