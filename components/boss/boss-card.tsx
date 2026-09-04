"use client";

import { type BossData } from "@/lib/actions/boss";
import { CreateBossDialog } from "@/components/boss/create-boss-dialog";
import { calculateBossRewards } from "@/lib/gamification";

export function BossCard({
  boss,
  onBossCreated,
}: {
  boss: BossData | null;
  onBossCreated: (newBoss: BossData) => void;
}) {
  if (!boss || boss.defeatedAt) {
    return (
      <div className="qd-glass rounded-[2rem] p-5 border border-rose-200/40 bg-gradient-to-br from-white/80 to-rose-50/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffe8ef] text-2xl shadow-sm">
              🐉
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-qd-muted">
                Boss Encounter
              </p>
              <h3 className="text-base font-extrabold text-qd-ink">No Active Boss</h3>
              <p className="text-xs text-qd-muted">Spawn a boss to battle while doing quests!</p>
            </div>
          </div>
          <CreateBossDialog onBossCreated={onBossCreated} />
        </div>
      </div>
    );
  }

  const hpPct = Math.max(0, Math.min(100, Math.round((boss.currentHp / boss.maxHp) * 100)));
  const loot = calculateBossRewards(boss.maxHp);

  // Determine health bar gradient
  let hpColor = "from-emerald-400 to-teal-500";
  if (hpPct < 30) {
    hpColor = "from-rose-500 to-red-600";
  } else if (hpPct < 60) {
    hpColor = "from-amber-400 to-orange-500";
  }

  return (
    <div className="qd-glass relative overflow-hidden rounded-[2rem] p-5 border border-rose-200/50 bg-gradient-to-br from-white/90 via-rose-50/30 to-purple-50/20 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffe8ef] text-3xl shadow-inner animate-pulse">
            🐉
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-rose-800">
                Boss Battle
              </span>
              <span className="text-[11px] font-bold text-qd-muted">
                +{loot.xp} XP · +{loot.diamonds} 💎
              </span>
            </div>
            <h3 className="mt-1 text-base font-extrabold text-qd-ink truncate max-w-[160px] sm:max-w-none">
              {boss.title}
            </h3>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <div className="text-right">
            <p className="text-xs font-black text-qd-ink">
              {boss.currentHp} <span className="text-qd-muted font-bold">/ {boss.maxHp} HP</span>
            </p>
            <p className="text-[10px] font-bold text-qd-rose">{hpPct}% remaining</p>
          </div>
          <CreateBossDialog onBossCreated={onBossCreated} />
        </div>
      </div>

      {/* HP Bar */}
      <div className="mt-3.5">
        <div className="h-3.5 w-full overflow-hidden rounded-full bg-rose-100/60 p-0.5 shadow-inner">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${hpColor} transition-all duration-700 ease-out`}
            style={{ width: `${hpPct}%` }}
          />
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px] font-bold text-qd-muted">
        <span>⚔️ Complete any quest to strike!</span>
        <span>Damage = Quest XP</span>
      </div>
    </div>
  );
}
