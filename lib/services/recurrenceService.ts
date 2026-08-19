import type { Prisma, Task } from "@prisma/client";

import { db } from "@/lib/db";
import { buildRruleString, nextOccurrenceAfter } from "@/lib/recurrence";
import { taskInclude, type TaskWithRelations } from "@/lib/services/taskInclude";
import type { UpdateTaskInput } from "@/lib/validation/tasks";

export function isCompletingRecurringTask(current: Task, input: UpdateTaskInput): boolean {
  return input.status === "DONE" && current.status !== "DONE" && current.recurrenceId !== null;
}

/**
 * Completion of a recurring task: the original becomes DONE and a fresh TODO
 * copy is created for the next occurrence, carrying over project and tags.
 */
export async function completeRecurringTask(
  current: Task,
  input: UpdateTaskInput,
  updateData: Prisma.TaskUpdateInput,
  tagIds: string[] | null,
): Promise<TaskWithRelations> {
  const rule = current.recurrenceId
    ? await db.recurrenceRule.findUnique({ where: { id: current.recurrenceId } })
    : null;
  if (!rule || input.recurrence === "none") {
    const updated = await db.task.update({
      where: { id: current.id },
      data: { ...updateData, recurrence: { disconnect: true } },
      include: taskInclude,
    });
    if (current.recurrenceId) {
      await deleteRuleIfUnused(current.recurrenceId);
    }
    return updated;
  }
  const rruleString = input.recurrence ? buildRruleString(input.recurrence) : rule.rrule;
  const anchor = (input.dueAt !== undefined ? input.dueAt : current.dueAt) ?? new Date();
  const nextRun = nextOccurrenceAfter(rruleString, anchor);
  return db.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id: current.id },
      data: updateData,
      include: taskInclude,
    });
    if (nextRun) {
      await spawnNextCopy(tx, current, input, tagIds, rule.id, nextRun);
      await tx.recurrenceRule.update({
        where: { id: rule.id },
        data: { rrule: rruleString, nextRunAt: nextOccurrenceAfter(rruleString, nextRun) },
      });
    }
    return updated;
  });
}

async function spawnNextCopy(
  tx: Prisma.TransactionClient,
  current: Task,
  input: UpdateTaskInput,
  tagIds: string[] | null,
  ruleId: string,
  nextRun: Date,
): Promise<void> {
  const copyTagIds =
    tagIds ??
    (await tx.taskTag.findMany({ where: { taskId: current.id } })).map((link) => link.tagId);
  await tx.task.create({
    data: {
      title: input.title ?? current.title,
      description: input.description ?? current.description,
      status: "TODO",
      priority: input.priority ?? current.priority,
      dueAt: nextRun,
      estimateMin: input.estimateMin !== undefined ? input.estimateMin : current.estimateMin,
      project: { connect: { id: input.projectId ?? current.projectId } },
      recurrence: { connect: { id: ruleId } },
      tags: { create: copyTagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })) },
    },
  });
}

interface RecurrenceSync {
  data: Prisma.TaskUpdateInput;
  orphanRuleId?: string;
}

/** Applies the dialog's recurrence choice: create, update or detach the rule. */
export async function syncRecurrenceRule(
  current: Task,
  input: UpdateTaskInput,
): Promise<RecurrenceSync> {
  if (input.recurrence === undefined) {
    return { data: {} };
  }
  if (input.recurrence === "none") {
    return current.recurrenceId
      ? { data: { recurrence: { disconnect: true } }, orphanRuleId: current.recurrenceId }
      : { data: {} };
  }
  const rrule = buildRruleString(input.recurrence);
  const anchor = (input.dueAt !== undefined ? input.dueAt : current.dueAt) ?? new Date();
  const nextRunAt = nextOccurrenceAfter(rrule, anchor);
  if (current.recurrenceId) {
    await db.recurrenceRule.update({
      where: { id: current.recurrenceId },
      data: { rrule, nextRunAt },
    });
    return { data: {} };
  }
  const rule = await db.recurrenceRule.create({ data: { rrule, nextRunAt } });
  return { data: { recurrence: { connect: { id: rule.id } } } };
}

/** Copies of a recurring task share one rule, so delete it only when unused. */
export async function deleteRuleIfUnused(ruleId: string): Promise<void> {
  const remaining = await db.task.count({ where: { recurrenceId: ruleId } });
  if (remaining === 0) {
    await db.recurrenceRule.delete({ where: { id: ruleId } });
  }
}
