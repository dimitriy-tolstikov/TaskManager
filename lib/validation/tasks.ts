import { TaskPriority, TaskStatus } from "@prisma/client";
import { z } from "zod";

import { RECURRENCE_KINDS } from "@/lib/recurrence";

const titleSchema = z.string().min(1, "Введите название задачи").max(300);
const tagNameSchema = z.string().min(1).max(50);
const recurrenceSchema = z.enum(RECURRENCE_KINDS);

export const createTaskSchema = z.object({
  title: titleSchema,
  description: z.string().max(5000).optional(),
  projectId: z.string().min(1).optional(),
  areaId: z.string().min(1).optional(),
  status: z.enum(TaskStatus).optional(),
  priority: z.enum(TaskPriority).optional(),
  dueAt: z.coerce.date().nullish(),
  estimateMin: z.number().int().min(0).max(100000).nullish(),
  tags: z.array(tagNameSchema).max(20).optional(),
});

export const updateTaskSchema = z.object({
  title: titleSchema.optional(),
  description: z.string().max(5000).optional(),
  projectId: z.string().min(1).optional(),
  status: z.enum(TaskStatus).optional(),
  priority: z.enum(TaskPriority).optional(),
  dueAt: z.coerce.date().nullish(),
  estimateMin: z.number().int().min(0).max(100000).nullish(),
  tags: z.array(tagNameSchema).max(20).optional(),
  recurrence: recurrenceSchema.optional(),
});

/** Filters of GET /api/tasks; `overdue` arrives as the literal query string "true". */
export const taskFiltersSchema = z.object({
  areaId: z.string().optional(),
  projectId: z.string().optional(),
  status: z.enum(TaskStatus).optional(),
  priority: z.enum(TaskPriority).optional(),
  tag: z.string().optional(),
  q: z.string().max(200).optional(),
  overdue: z.literal("true").optional(),
  dueFrom: z.coerce.date().optional(),
  dueTo: z.coerce.date().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFiltersInput = z.infer<typeof taskFiltersSchema>;
