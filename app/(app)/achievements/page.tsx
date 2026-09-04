import { getUserAchievementsAction } from "@/lib/actions/achievements";
import { AchievementsGallery } from "@/components/achievements/achievements-gallery";
import { BottomNav } from "@/components/layout/bottom-nav";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const res = await getUserAchievementsAction();

  if (!res.success || !res.data) {
    return (
      <>
        <h1 className="text-2xl font-extrabold text-qd-ink">Trophy Room</h1>
        <div className="qd-glass mt-6 rounded-[2rem] p-8 text-center">
          <p className="text-sm font-bold text-rose-500">
            {res.error ?? "Unable to load achievements."}
          </p>
        </div>
        <BottomNav active="/achievements" />
      </>
    );
  }

  return <AchievementsGallery initialData={res.data} />;
}
