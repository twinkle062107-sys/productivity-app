import { prisma } from "@/lib/prisma";
import type { User, Quest, QuestCompletion } from "@prisma/client";

const DEMO_EMAIL = "hero@questdaily.app";

export type QuestWithCompletions = Quest & {
  completions: QuestCompletion[];
};

export type CurrentUserWithQuests = User & {
  quests: QuestWithCompletions[];
};

/**
 * Retrieves the current active user, or provisions a local demo user with initial starter quests.
 * When Auth is integrated in a later slice, this can seamlessly map to the authenticated session user.
 */
export async function getOrCreateCurrentUser(): Promise<CurrentUserWithQuests> {
  let user = await prisma.user.findFirst({
    where: {
      email: DEMO_EMAIL,
    },
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
    user = await prisma.user.create({
      data: {
        email: DEMO_EMAIL,
        name: "Hero",
        level: 1,
        currentXp: 0,
        diamonds: 0,
        streakCount: 0,
        longestStreak: 0,
        quests: {
          create: [
            {
              title: "Morning Routine & Planning",
              category: "Health",
              difficulty: "EASY",
              frequency: "DAILY",
              reminderOn: true,
            },
            {
              title: "Deep Work Sprint (45m)",
              category: "Study",
              difficulty: "MEDIUM",
              frequency: "DAILY",
              reminderOn: true,
            },
            {
              title: "Read 10 pages of a book",
              category: "Craft",
              difficulty: "EASY",
              frequency: "DAILY",
              reminderOn: true,
            },
          ],
        },
      },
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
  }

  return user;
}
