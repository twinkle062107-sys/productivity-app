"use client";

import { createPortal } from "react-dom";
import { type BossDefeatedInfo } from "@/lib/actions/quest";
import { useHasMounted } from "@/lib/hooks/use-has-mounted";

export function BossDefeatModal({
  info,
  onClose,
}: {
  info: BossDefeatedInfo;
  onClose: () => void;
}) {
  const mounted = useHasMounted();

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="boss-defeat-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] border-2 border-amber-300 bg-white p-6 text-center shadow-2xl">
        {/* Animated background starbursts */}
        <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-amber-300/30 blur-2xl" />
        <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-rose-300/30 blur-2xl" />

        <div className="relative">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-4xl shadow-lg animate-bounce">
            🏆
          </div>

          <p className="mt-3 text-xs font-black uppercase tracking-widest text-amber-600">
            Boss Vanquished!
          </p>
          <h2 id="boss-defeat-title" className="mt-1 text-2xl font-black text-qd-ink">
            {info.bossTitle}
          </h2>
          <p className="mt-1 text-xs text-qd-muted">
            You persevered and conquered your challenge!
          </p>

          {/* Loot cards */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 shadow-sm">
              <p className="text-[10px] font-bold text-amber-700">Bonus XP</p>
              <p className="mt-0.5 text-xl font-black text-amber-900">+{info.bonusXp}</p>
            </div>
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-3 shadow-sm">
              <p className="text-[10px] font-bold text-cyan-700">Bonus Diamonds</p>
              <p className="mt-0.5 text-xl font-black text-cyan-900">+{info.bonusDiamonds} 💎</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/30 transition active:scale-95"
          >
            Claim Spoils & Continue ⚔️
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
