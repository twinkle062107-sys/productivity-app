import { z } from "zod";

export const chainChapterDraftSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Chapter title must be at least 2 characters.")
    .max(80, "Chapter title cannot exceed 80 characters."),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "EPIC"]).default("MEDIUM"),
  category: z.string().trim().max(30).optional().or(z.literal("")),
});

export const chainDraftSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Chain title must be at least 2 characters.")
    .max(80, "Chain title cannot exceed 80 characters."),
  narrative: z.string().trim().max(500).optional().or(z.literal("")),
  chapters: z
    .array(chainChapterDraftSchema)
    .min(2, "A Quest Chain requires at least 2 chapters.")
    .max(10, "A Quest Chain cannot have more than 10 chapters."),
});

export type ChainChapterDraft = z.infer<typeof chainChapterDraftSchema>;
export type ChainDraft = z.infer<typeof chainDraftSchema>;
