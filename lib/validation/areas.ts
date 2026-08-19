import { z } from "zod";

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Цвет в формате #rrggbb");

export const createAreaSchema = z.object({
  name: z.string().min(1, "Введите название направления").max(100),
  color: colorSchema.default("#3b82f6"),
});

export const updateAreaSchema = z.object({
  name: z.string().min(1, "Введите название направления").max(100).optional(),
  color: colorSchema.optional(),
  position: z.number().int().optional(),
});

export type CreateAreaInput = z.infer<typeof createAreaSchema>;
export type UpdateAreaInput = z.infer<typeof updateAreaSchema>;
