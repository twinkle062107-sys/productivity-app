"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { bossDraftSchema, type BossDraft } from "@/lib/validations/boss";
import type { ActionResult } from "@/lib/actions/quest";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Non-fatal if invoked outside Next.js request context
  }
}

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return prisma.user.findUnique({
    where: { id: session.user.id },
  });
}

export interface BossData {
  id: string;
  title: string;
  maxHp: number;
  currentHp: number;
  defeatedAt: Date | null;
  createdAt: Date;
}

/**
 * Creates a new Boss encounter for the active user.
 */
export async function createBossAction(
  data: BossDraft
): Promise<ActionResult<BossData>> {
  try {
    const parseResult = bossDraftSchema.safeParse(data);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message ?? "Invalid boss data.",
      };
    }

    const user = await requireUser();
    if (!user) {
      return { success: false, error: "You must be signed in to spawn a boss." };
    }

    const boss = await prisma.boss.create({
      data: {
        userId: user.id,
        title: parseResult.data.title,
        maxHp: parseResult.data.maxHp,
        currentHp: parseResult.data.maxHp,
      },
    });

    await prisma.event.create({
      data: {
        userId: user.id,
        type: "BOSS_SPAWNED",
        payload: JSON.stringify({
          bossId: boss.id,
          title: boss.title,
          maxHp: boss.maxHp,
        }),
      },
    });

    safeRevalidate("/dashboard");
    safeRevalidate("/quests");

    return {
      success: true,
      data: {
        id: boss.id,
        title: boss.title,
        maxHp: boss.maxHp,
        currentHp: boss.currentHp,
        defeatedAt: boss.defeatedAt,
        createdAt: boss.createdAt,
      },
    };
  } catch (error) {
    console.error("Failed to spawn boss:", error);
    return {
      success: false,
      error: "Unable to spawn boss. Please try again.",
    };
  }
}

/**
 * Gets the current active (undefeated) boss for the authenticated user.
 */
export async function getActiveBossAction(): Promise<ActionResult<BossData | null>> {
  try {
    const user = await requireUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const boss = await prisma.boss.findFirst({
      where: {
        userId: user.id,
        defeatedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: boss
        ? {
            id: boss.id,
            title: boss.title,
            maxHp: boss.maxHp,
            currentHp: boss.currentHp,
            defeatedAt: boss.defeatedAt,
            createdAt: boss.createdAt,
          }
        : null,
    };
  } catch (error) {
    console.error("Failed to get active boss:", error);
    return { success: false, error: "Failed to load boss data." };
  }
}

/**
 * Gets all user bosses (active and past defeated bosses).
 */
export async function getUserBossesAction(): Promise<ActionResult<BossData[]>> {
  try {
    const user = await requireUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const bosses = await prisma.boss.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: bosses.map((b) => ({
        id: b.id,
        title: b.title,
        maxHp: b.maxHp,
        currentHp: b.currentHp,
        defeatedAt: b.defeatedAt,
        createdAt: b.createdAt,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch bosses:", error);
    return { success: false, error: "Failed to fetch bosses." };
  }
}
