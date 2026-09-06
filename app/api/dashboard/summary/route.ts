import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";
import { ApiError, handleApiError, ok } from "@/lib/api-response";
import {
  calculateLevel,
  isQuestCompletedForOccurrence,
  type Frequency,
} from "@/lib/gamification";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/summary
 * Aggregates the authenticated user's player state plus today's standalone
 * quest progress, mirroring the web dashboard's "Today's Focus" card and the
 * Flutter DashboardSummary.fromJson model.
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await getApiUser(request);
    if (!user) throw new ApiError("Unauthorized", 401);

    const now = new Date();

    const [quests, activeBoss] = await Promise.all([
      prisma.quest.findMany({
        where: { userId: user.id, archivedAt: null },
        include: { completions: { orderBy: { completedAt: "desc" } } },
      }),
      prisma.boss.findFirst({
        where: { userId: user.id, defeatedAt: null },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // The web dashboard counts standalone quests (those not in a chain) for its
    // "Today" progress ring — mirror that here.
    const standaloneQuests = quests.filter((q) => !q.chainId);
    const todayCompletedCount = standaloneQuests.filter((q) =>
      isQuestCompletedForOccurrence(
        (q.frequency ?? "DAILY") as Frequency,
        q.completions,
        now,
      ),
    ).length;

    const levelInfo = calculateLevel(user.currentXp);

    return ok({
      level: user.level,
      currentXp: user.currentXp,
      xpIntoLevel: levelInfo.currentLevelXp,
      streak: user.streakCount,
      diamonds: user.diamonds,
      streakFreezes: user.streakFreezes,
      longestStreak: user.longestStreak,
      todayQuestCount: standaloneQuests.length,
      todayCompletedCount,
      activeBossDefeated: activeBoss == null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}