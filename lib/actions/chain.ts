"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  calculateChainProgress,
  type Difficulty,
  type Frequency,
} from "@/lib/gamification";
import { chainDraftSchema, type ChainDraft } from "@/lib/validations/chain";
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

export interface ChainChapterData {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: Difficulty;
  chapterIndex: number;
  isCompleted: boolean;
}

export interface QuestChainData {
  id: string;
  title: string;
  narrative: string | null;
  completedAt: Date | null;
  createdAt: Date;
  totalSteps: number;
  completedSteps: number;
  progressPct: number;
  isCompleted: boolean;
  currentChapterIndex: number;
  chapters: ChainChapterData[];
}

/**
 * Creates a multi-chapter Quest Chain and its child quests in a single transaction.
 */
export async function createChainAction(
  data: ChainDraft
): Promise<ActionResult<QuestChainData>> {
  try {
    const parseResult = chainDraftSchema.safeParse(data);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message ?? "Invalid chain data.",
      };
    }

    const user = await requireUser();
    if (!user) {
      return { success: false, error: "You must be signed in to create a chain." };
    }

    const validated = parseResult.data;

    const chain = await prisma.$transaction(async (tx) => {
      const createdChain = await tx.questChain.create({
        data: {
          userId: user.id,
          title: validated.title,
          narrative: validated.narrative || null,
        },
      });

      // Create each chapter quest
      for (let i = 0; i < validated.chapters.length; i++) {
        const ch = validated.chapters[i];
        await tx.quest.create({
          data: {
            userId: user.id,
            chainId: createdChain.id,
            chapterIndex: i + 1,
            title: ch.title,
            description: ch.description || null,
            category: ch.category || "Story",
            difficulty: ch.difficulty,
            frequency: "ONCE" as Frequency,
          },
        });
      }

      await tx.event.create({
        data: {
          userId: user.id,
          type: "CHAIN_STARTED",
          payload: JSON.stringify({
            chainId: createdChain.id,
            title: createdChain.title,
            chapterCount: validated.chapters.length,
          }),
        },
      });

      return tx.questChain.findUnique({
        where: { id: createdChain.id },
        include: {
          quests: {
            orderBy: { chapterIndex: "asc" },
            include: { completions: true },
          },
        },
      });
    });

    if (!chain) {
      return { success: false, error: "Failed to create chain." };
    }

    safeRevalidate("/dashboard");
    safeRevalidate("/quests");

    const progress = calculateChainProgress(chain.quests);

    return {
      success: true,
      data: {
        id: chain.id,
        title: chain.title,
        narrative: chain.narrative,
        completedAt: chain.completedAt,
        createdAt: chain.createdAt,
        totalSteps: progress.totalSteps,
        completedSteps: progress.completedSteps,
        progressPct: progress.progressPct,
        isCompleted: progress.isCompleted,
        currentChapterIndex: progress.currentChapterIndex,
        chapters: chain.quests.map((q) => ({
          id: q.id,
          title: q.title,
          description: q.description,
          category: q.category,
          difficulty: q.difficulty as Difficulty,
          chapterIndex: q.chapterIndex ?? 1,
          isCompleted: q.completions.length > 0,
        })),
      },
    };
  } catch (error) {
    console.error("Failed to create chain:", error);
    return {
      success: false,
      error: "Unable to create quest chain. Please try again.",
    };
  }
}

/**
 * Fetches all Quest Chains with their chapters and progress for the current user.
 */
export async function getUserChainsAction(): Promise<ActionResult<QuestChainData[]>> {
  try {
    const user = await requireUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const chains = await prisma.questChain.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        quests: {
          where: { archivedAt: null },
          orderBy: { chapterIndex: "asc" },
          include: { completions: true },
        },
      },
    });

    const result: QuestChainData[] = chains.map((chain) => {
      const progress = calculateChainProgress(chain.quests);
      return {
        id: chain.id,
        title: chain.title,
        narrative: chain.narrative,
        completedAt: chain.completedAt,
        createdAt: chain.createdAt,
        totalSteps: progress.totalSteps,
        completedSteps: progress.completedSteps,
        progressPct: progress.progressPct,
        isCompleted: progress.isCompleted,
        currentChapterIndex: progress.currentChapterIndex,
        chapters: chain.quests.map((q) => ({
          id: q.id,
          title: q.title,
          description: q.description,
          category: q.category,
          difficulty: q.difficulty as Difficulty,
          chapterIndex: q.chapterIndex ?? 1,
          isCompleted: q.completions.length > 0,
        })),
      };
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to fetch chains:", error);
    return { success: false, error: "Failed to fetch quest chains." };
  }
}
