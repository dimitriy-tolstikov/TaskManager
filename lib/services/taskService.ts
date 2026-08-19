import type { Prisma, Project, Task, TaskStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { ensureInboxProject, getOwnedProject } from "@/lib/services/projectService";
import { resolveTagIds } from "@/lib/services/tagService";
import type { CreateTaskInput, TaskFiltersInput, UpdateTaskInput } from "@/lib/validation/tasks";

const taskInclude = {
  subtasks: { orderBy: { position: "asc" } },
  tags: { include: { tag: true } },
  project: { select: { id: true, name: true, areaId: true } },
} satisfies Prisma.TaskInclude;

export type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

export function listTasks(userId: string, filters: TaskFiltersInput): Promise<TaskWithRelations[]> {
  return db.task.findMany({
    where: buildTaskWhere(userId, filters),
    include: taskInclude,
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
}

function buildTaskWhere(userId: string, filters: TaskFiltersInput): Prisma.TaskWhereInput {
  const isOverdue = filters.overdue === "true";
  return {
    project: { area: { userId, ...(filters.areaId ? { id: filters.areaId } : {}) } },
    ...(filters.projectId ? { projectId: filters.projectId } : {}),
    ...statusWhere(filters.status, isOverdue),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.tag ? { tags: { some: { tag: { userId, name: filters.tag } } } } : {}),
    ...(filters.q ? { OR: searchClauses(filters.q) } : {}),
    ...(isOverdue ? { dueAt: { lt: new Date() } } : {}),
  };
}

function searchClauses(q: string): Prisma.TaskWhereInput[] {
  return [
    { title: { contains: q, mode: "insensitive" } },
    { description: { contains: q, mode: "insensitive" } },
  ];
}

function statusWhere(status: TaskStatus | undefined, isOverdue: boolean) {
  if (status) {
    return { status };
  }
  // Overdue only makes sense for tasks that are not finished yet.
  return isOverdue ? { status: { notIn: ["DONE", "CANCELLED"] as TaskStatus[] } } : {};
}

export async function createTask(
  userId: string,
  input: CreateTaskInput,
): Promise<TaskWithRelations> {
  const project = await resolveTargetProject(userId, input);
  const tagIds = await resolveTagIds(userId, input.tags ?? []);
  return db.task.create({
    data: {
      title: input.title,
      description: input.description ?? "",
      status: input.status ?? "BACKLOG",
      priority: input.priority ?? "MED",
      dueAt: input.dueAt ?? null,
      estimateMin: input.estimateMin ?? null,
      completedAt: input.status === "DONE" ? new Date() : null,
      project: { connect: { id: project.id } },
      tags: { create: tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })) },
    },
    include: taskInclude,
  });
}

async function resolveTargetProject(userId: string, input: CreateTaskInput): Promise<Project> {
  if (input.projectId) {
    return getOwnedProject(userId, input.projectId);
  }
  if (input.areaId) {
    const project = await db.project.findFirst({
      where: { areaId: input.areaId, archived: false, area: { userId } },
      orderBy: { name: "asc" },
    });
    if (!project) {
      throw new ValidationError("В этом направлении нет проекта — сначала создайте проект");
    }
    return project;
  }
  return ensureInboxProject(userId);
}

export async function getOwnedTask(userId: string, taskId: string): Promise<Task> {
  const task = await db.task.findFirst({ where: { id: taskId, project: { area: { userId } } } });
  if (!task) {
    throw new NotFoundError("Задача не найдена");
  }
  return task;
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<TaskWithRelations> {
  const current = await getOwnedTask(userId, taskId);
  if (input.projectId) {
    await getOwnedProject(userId, input.projectId);
  }
  const tagIds = input.tags ? await resolveTagIds(userId, input.tags) : null;
  return db.task.update({
    where: { id: current.id },
    data: buildUpdateData(input, current, tagIds),
    include: taskInclude,
  });
}

function buildUpdateData(
  input: UpdateTaskInput,
  current: Task,
  tagIds: string[] | null,
): Prisma.TaskUpdateInput {
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.projectId ? { project: { connect: { id: input.projectId } } } : {}),
    ...(input.priority ? { priority: input.priority } : {}),
    ...(input.dueAt !== undefined ? { dueAt: input.dueAt } : {}),
    ...(input.estimateMin !== undefined ? { estimateMin: input.estimateMin } : {}),
    ...statusTransition(input.status, current.status),
    ...(tagIds ? { tags: { deleteMany: {}, create: linkTags(tagIds) } } : {}),
  };
}

function linkTags(tagIds: string[]) {
  return tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } }));
}

function statusTransition(next: TaskStatus | undefined, currentStatus: TaskStatus) {
  if (!next || next === currentStatus) {
    return next ? { status: next } : {};
  }
  if (next === "DONE") {
    return { status: next, completedAt: new Date() };
  }
  return { status: next, completedAt: currentStatus === "DONE" ? null : undefined };
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  const task = await getOwnedTask(userId, taskId);
  await db.task.delete({ where: { id: task.id } });
}
