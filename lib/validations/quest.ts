import { z } from "zod";

export const questDraftSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Quest title is required")
    .max(80, "Title must be 80 characters or fewer"),
  description: z.string().trim().max(500, "Description must be 500 characters or fewer").optional().or(z.literal("")),
  category: z.string().trim().max(40, "Category must be 40 characters or fewer").optional().default("Focus"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "EPIC"]).default("MEDIUM"),
  frequency: z.enum(["ONCE", "DAILY", "WEEKLY", "CUSTOM"]).default("DAILY"),
  reminderOn: z.boolean().default(true),
});

export type QuestDraft = z.infer<typeof questDraftSchema>;

export const completeQuestSchema = z.object({
  questId: z.string().min(1, "Quest ID is required"),
});

export type CompleteQuestInput = z.infer<typeof completeQuestSchema>;
