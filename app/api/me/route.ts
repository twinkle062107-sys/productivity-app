import { getApiUser } from "@/lib/api-auth";
import { ApiError, handleApiError, ok } from "@/lib/api-response";
import { calculateLevel } from "@/lib/gamification";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/me
 * Returns the authenticated user's profile and level progress.
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await getApiUser(request);
    if (!user) throw new ApiError("Unauthorized", 401);

    const levelInfo = calculateLevel(user.currentXp);

    return ok({
      id: user.id,
      name: user.name,
      email: user.email,
      level: user.level,
      currentXp: user.currentXp,
      xpIntoLevel: levelInfo.currentLevelXp,
      nextLevelXp: levelInfo.nextLevelXp,
      xpProgressPct: levelInfo.progressPct,
      points: user.points,
      diamonds: user.diamonds,
      streakCount: user.streakCount,
      streakFreezes: user.streakFreezes,
      longestStreak: user.longestStreak,
      lastActiveDay: user.lastActiveDay,
    });
  } catch (error) {
    return handleApiError(error);
  }
}