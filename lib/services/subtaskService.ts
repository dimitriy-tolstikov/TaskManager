import type { Subtask } from "@prisma/client";

import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { getOwnedTask } from "@/lib/services/taskService";
import type { CreateSubtaskInput, UpdateSubtaskInput } from "@/lib/validation/subtasks";

export async function addSubtask(
  userId: string,
  taskId: string,
  input: CreateSubtaskInput,
): Promise<Subtask> {
  const task = await getOwnedTask(userId, taskId);
  const position = await db.subtask.count({ where: { taskId: task.id } });
  return db.subtask.create({ data: { taskId: task.id, title: input.title, position } });
}

export async function updateSubtask(
  userId: string,
  subtaskId: string,
  input: UpdateSubtaskInput,
): Promise<Subtask> {
  const subtask = await getOwnedSubtask(userId, subtaskId);
  return db.subtask.update({ where: { id: subtask.id }, data: input });
}

export async function deleteSubtask(userId: string, subtaskId: string): Promise<void> {
  const subtask = await getOwnedSubtask(userId, subtaskId);
  await db.subtask.delete({ where: { id: subtask.id } });
}

async function getOwnedSubtask(userId: string, subtaskId: string): Promise<Subtask> {
  const subtask = await db.subtask.findFirst({
    where: { id: subtaskId, task: { project: { area: { userId } } } },
  });
  if (!subtask) {
    throw new NotFoundError("Подзадача не найдена");
  }
  return subtask;
}
