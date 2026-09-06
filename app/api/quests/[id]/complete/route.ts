import { getApiUser } from "@/lib/api-auth";
import { ApiError, handleApiError, ok } from "@/lib/api-response";
import { completeQuestForUser } from "@/lib/api/quest-server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/quests/[id]/complete
 * Runs the full gamification completion transaction for the authenticated
 * user's quest, returning the flat shape consumed by the Flutter
 * QuestCompleteResultModel.fromJson parser.
 */
export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  try {
    const user = await getApiUser(request);
    if (!user) throw new ApiError("Unauthorized", 401);

    const { id } = await context.params;
    const result = await completeQuestForUser(user.id, id);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}