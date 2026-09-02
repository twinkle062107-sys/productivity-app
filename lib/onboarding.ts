import { prisma } from "@/lib/prisma";

const ONBOARDING_QUESTS: Array<{
  title: string;
  category: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "EPIC";
  frequency: "ONCE" | "DAILY" | "WEEKLY" | "CUSTOM";
  reminderOn: boolean;
}> = [
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
];

/**
 * Seeds the initial starter quests for a brand-new user on their first sign-in.
 * No-op if the user already has any quests.
 */
export async function ensureOnboardingQuests(userId: string): Promise<void> {
  const existingCount = await prisma.quest.count({
    where: { userId },
  });

  if (existingCount > 0) {
    return;
  }

  await prisma.quest.createMany({
    data: ONBOARDING_QUESTS.map((q) => ({
      ...q,
      userId,
    })),
  });
}
