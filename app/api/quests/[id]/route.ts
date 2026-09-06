import { getApiUser } from "@/lib/api-auth";
import { ApiError, handleApiError, ok } from "@/lib/api-response";
import { archiveQuestForUser, updateQuestForUser } from "@/lib/api/quest-server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PUT /api/quests/[id]
 * Updates a quest owned by the authenticated user.
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  try {
    const user = await getApiUser(request);
    if (!user) throw new ApiError("Unauthorized", 401);

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    if (body == null) throw new ApiError("Request body is required.", 400);

    const quest = await updateQuestForUser(user.id, id, body);
    return ok(quest);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/quests/[id]
 * Archives (soft-deletes) a quest owned by the authenticated user.
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  try {
    const user = await getApiUser(request);
    if (!user) throw new ApiError("Unauthorized", 401);

    const { id } = await context.params;
    const result = await archiveQuestForUser(user.id, id);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}