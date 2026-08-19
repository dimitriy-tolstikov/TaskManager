import type { Prisma } from "@prisma/client";

// Shared by taskService and recurrenceService so the completion flow returns
// the same task shape as the rest of the task API.
export const taskInclude = {
  subtasks: { orderBy: { position: "asc" } },
  tags: { include: { tag: true } },
  project: { select: { id: true, name: true, areaId: true } },
  recurrence: { select: { id: true, rrule: true } },
} satisfies Prisma.TaskInclude;

export type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;
