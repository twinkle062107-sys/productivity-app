import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { User, Quest, QuestCompletion, Boss, QuestChain } from "@prisma/client";

export { ensureOnboardingQuests } from "@/lib/onboarding";

export type QuestWithCompletions = Quest & {
  completions: QuestCompletion[];
};

export type CurrentUser = User;

export type CurrentUserWithQuests = User & {
  quests: QuestWithCompletions[];
};

export type CurrentUserFullData = User & {
  quests: QuestWithCompletions[];
  bosses: Boss[];
  chains: (QuestChain & {
    quests: QuestWithCompletions[];
  })[];
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

/**
 * Returns the authenticated user with quests, active/recent bosses, and chains.
 */
export async function getCurrentUserFullData(): Promise<CurrentUserFullData> {
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
      bosses: {
        orderBy: { createdAt: "desc" },
      },
      chains: {
        orderBy: { createdAt: "desc" },
        include: {
          quests: {
            where: { archivedAt: null },
            orderBy: { chapterIndex: "asc" },
            include: {
              completions: {
                orderBy: { completedAt: "desc" },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

