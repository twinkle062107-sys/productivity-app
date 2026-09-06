import { prisma } from "@/lib/prisma";
import { createApiToken } from "@/lib/api-auth";
import { handleApiError, ok } from "@/lib/api-response";
import { ensureOnboardingQuests } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

const DEMO_EMAIL = "hero@questdaily.app";
const DEMO_NAME = "Hero";

/**
 * POST /api/auth/demo
 * Signs the client into the shared demo account and mints a fresh bearer
 * token. Mirrors the web demo sign-in: creates the demo user on first run and
 * seeds onboarding quests.
 */
export async function POST(): Promise<Response> {
  try {
    let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: DEMO_EMAIL, name: DEMO_NAME },
      });
      await ensureOnboardingQuests(user.id);
    }

    const accessToken = await createApiToken(user.id);

    return ok({
      accessToken,
      id: user.id,
      name: user.name,
      email: user.email,
      level: user.level,
      currentXp: user.currentXp,
      points: user.points,
      diamonds: user.diamonds,
      streakCount: user.streakCount,
      streakFreezes: user.streakFreezes,
      longestStreak: user.longestStreak,
    });
  } catch (error) {
    return handleApiError(error);
  }
}