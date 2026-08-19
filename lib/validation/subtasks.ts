import { z } from "zod";

export const createSubtaskSchema = z.object({
  title: z.string().min(1, "Введите название подзадачи").max(300),
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1, "Введите название подзадачи").max(300).optional(),
  done: z.boolean().optional(),
});

export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>;
