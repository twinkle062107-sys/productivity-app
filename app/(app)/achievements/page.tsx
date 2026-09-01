import { BottomNav } from "@/components/layout/bottom-nav";

export default function AchievementsPage() {
  return (
    <>
      <h1 className="text-2xl font-extrabold">Achievements</h1>
      <p className="mt-2 text-qd-muted">Locked silhouettes vs unlocked badges will render here.</p>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="qd-glass aspect-square rounded-[1.4rem] opacity-50" />
        ))}
      </div>
      <BottomNav active="/achievements" />
    </>
  );
}
