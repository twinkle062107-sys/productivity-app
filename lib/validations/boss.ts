import { z } from "zod";

export const bossDraftSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Boss title must be at least 2 characters.")
    .max(60, "Boss title cannot exceed 60 characters."),
  maxHp: z
    .number()
    .int("HP must be an integer.")
    .min(20, "Boss HP must be at least 20.")
    .max(2000, "Boss HP cannot exceed 2000.")
    .default(100),
});

export type BossDraft = z.infer<typeof bossDraftSchema>;
