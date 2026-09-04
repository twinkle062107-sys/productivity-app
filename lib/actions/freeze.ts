"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { STREAK_FREEZE_COST, MAX_STREAK_FREEZES } from "@/lib/gamification";
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

export interface BuyStreakFreezeResult {
  diamonds: number;
  streakFreezes: number;
}

/**
 * Purchases 1 Streak Freeze shield using 20 Diamonds (max capacity: 3).
 */
export async function buyStreakFreezeAction(): Promise<
  ActionResult<BuyStreakFreezeResult>
> {
  try {
    const user = await requireUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    if (user.streakFreezes >= MAX_STREAK_FREEZES) {
      return {
        success: false,
        error: `You already hold the maximum of ${MAX_STREAK_FREEZES} Streak Freezes.`,
      };
    }

    if (user.diamonds < STREAK_FREEZE_COST) {
      return {
        success: false,
        error: `Insufficient Diamonds. You need ${STREAK_FREEZE_COST} 💎 (you have ${user.diamonds} 💎).`,
      };
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          diamonds: { decrement: STREAK_FREEZE_COST },
          streakFreezes: { increment: 1 },
        },
      });

      await tx.event.create({
        data: {
          userId: user.id,
          type: "STREAK_FREEZE_PURCHASED",
          payload: JSON.stringify({
            cost: STREAK_FREEZE_COST,
            remainingDiamonds: updated.diamonds,
            totalFreezes: updated.streakFreezes,
          }),
        },
      });

      return updated;
    });

    safeRevalidate("/dashboard");
    safeRevalidate("/profile");

    return {
      success: true,
      data: {
        diamonds: updatedUser.diamonds,
        streakFreezes: updatedUser.streakFreezes,
      },
    };
  } catch (error) {
    console.error("Failed to buy streak freeze:", error);
    return {
      success: false,
      error: "Unable to purchase Streak Freeze. Please try again.",
    };
  }
}
