import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";
import type { User } from "@prisma/client";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a fresh API token for [userId]. Returns the raw token to hand to the
 * client; only its SHA-256 hash is persisted in the ApiToken table.
 */
export async function createApiToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await prisma.apiToken.create({
    data: { userId, tokenHash: hashToken(token) },
  });
  return token;
}

/**
 * Resolves the authenticated user from a `Authorization: Bearer <token>`
 * header, or returns null. All downstream lookups must remain scoped to the
 * returned user's id.
 */
export async function getApiUser(request: NextRequest): Promise<User | null> {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;

  const record = await prisma.apiToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!record) return null;

  await prisma.apiToken.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });

  return record.user;
}