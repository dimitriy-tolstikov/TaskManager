import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string().min(1, "Введите название тега").max(50),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
