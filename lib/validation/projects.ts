import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Введите название проекта").max(100),
  areaId: z.string().min(1),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, "Введите название проекта").max(100).optional(),
  archived: z.boolean().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
