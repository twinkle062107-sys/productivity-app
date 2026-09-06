import { getApiUser } from "@/lib/api-auth";
import { ApiError, created, handleApiError, ok } from "@/lib/api-response";
import { createQuestForUser, listActiveQuests } from "@/lib/api/quest-server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/quests
 * Returns the authenticated user's active quests (Flutter Quest.fromJson shape).
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await getApiUser(request);
    if (!user) throw new ApiError("Unauthorized", 401);

    const quests = await listActiveQuests(user.id);
    return ok(quests);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/quests
 * Creates a quest for the authenticated user.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const user = await getApiUser(request);
    if (!user) throw new ApiError("Unauthorized", 401);

    const body = await request.json().catch(() => null);
    if (body == null) throw new ApiError("Request body is required.", 400);

    const quest = await createQuestForUser(user.id, body);
    return created(quest);
  } catch (error) {
    return handleApiError(error);
  }
}