import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { User, Quest, QuestCompletion } from "@prisma/client";

export { ensureOnboardingQuests } from "@/lib/onboarding";

export type QuestWithCompletions = Quest & {
  completions: QuestCompletion[];
};

export type CurrentUser = User;

export type CurrentUserWithQuests = User & {
  quests: QuestWithCompletions[];
};

/**
 * Returns the currently authenticated user, or redirects to /sign-in.
 * Must only be called within a request context (Server Component / Server Action).
 *
 * NOTE: The legacy demo user (hero@questdaily.app) and its data are intentionally
 * left untouched. It is no longer referenced by this code path and its data is
 * preserved for reference.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

/**
 * Returns the currently authenticated user together with their active quests
 * (including completions), or redirects to /sign-in.
 */
export async function getCurrentUserWithQuests(): Promise<CurrentUserWithQuests> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      quests: {
        where: { archivedAt: null },
        include: {
          completions: {
            orderBy: { completedAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}
