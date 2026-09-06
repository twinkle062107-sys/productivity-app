import { getApiUser } from "@/lib/api-auth";
import { ApiError, handleApiError, ok } from "@/lib/api-response";
import { listQuestCompletions } from "@/lib/api/quest-server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/quests/[id]/completions
 * Returns the completion history for a single quest (Flutter
 * QuestCompletion.fromJson shape, scoped to the authenticated user).
 */
export async function GET(
  request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  try {
    const user = await getApiUser(request);
    if (!user) throw new ApiError("Unauthorized", 401);

    const { id } = await context.params;
    const completions = await listQuestCompletions(user.id, id);
    return ok(completions);
  } catch (error) {
    return handleApiError(error);
  }
}