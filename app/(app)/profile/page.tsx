import { BottomNav } from "@/components/layout/bottom-nav";
import { ProfileView } from "@/components/profile/profile-view";
import { getCurrentUser } from "@/lib/user";
import { calculateLevel } from "@/lib/gamification";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const levelInfo = calculateLevel(user.currentXp);

  return (
    <>
      <ProfileView
        user={{
          name: user.name,
          email: user.email,
          currentXp: user.currentXp,
          diamonds: user.diamonds,
          streakCount: user.streakCount,
          streakFreezes: user.streakFreezes,
        }}
        levelInfo={levelInfo}
      />
      <BottomNav active="/profile" />
    </>
  );
}

