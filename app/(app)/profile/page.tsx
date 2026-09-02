import { BlobMascot } from "@/components/brand/mascots";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getCurrentUser } from "@/lib/user";
import { calculateLevel } from "@/lib/gamification";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const levelInfo = calculateLevel(user.currentXp);

  return (
    <>
      <h1 className="text-2xl font-extrabold text-qd-ink">Hero Profile</h1>
      <div className="qd-glass mt-6 flex flex-col items-center rounded-[2rem] p-8 text-center">
        <BlobMascot className="h-28 w-28" />
        <p className="mt-4 text-xl font-extrabold text-qd-ink">
          {user.name || "Hero"} · Level {levelInfo.level}
        </p>
        <p className="mt-1 text-sm font-bold text-qd-lavender">
          {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP to Level {levelInfo.level + 1}
        </p>
        {user.email && (
          <p className="mt-1 text-xs font-bold text-qd-muted">{user.email}</p>
        )}

        <div className="mt-6 grid w-full grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/70 p-3 shadow-sm">
            <p className="text-xs font-bold text-qd-muted">Total XP</p>
            <p className="mt-1 text-lg font-black text-qd-ink">{user.currentXp}</p>
          </div>
          <div className="rounded-2xl bg-white/70 p-3 shadow-sm">
            <p className="text-xs font-bold text-qd-muted">Diamonds</p>
            <p className="mt-1 text-lg font-black text-amber-600">{user.diamonds} 💎</p>
          </div>
          <div className="rounded-2xl bg-white/70 p-3 shadow-sm">
            <p className="text-xs font-bold text-qd-muted">Streak</p>
            <p className="mt-1 text-lg font-black text-rose-500">{user.streakCount} 🔥</p>
          </div>
        </div>

        <SignOutButton className="mt-5" />
      </div>
      <BottomNav active="/profile" />
    </>
  );
}
