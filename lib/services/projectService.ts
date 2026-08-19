import type { Project } from "@prisma/client";

import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import type { CreateProjectInput, UpdateProjectInput } from "@/lib/validation/projects";

export const INBOX_AREA_NAME = "Входящие";
export const INBOX_PROJECT_NAME = "Входящие";
export const INBOX_AREA_COLOR = "#64748b";

export function listProjects(userId: string, areaId?: string): Promise<Project[]> {
  return db.project.findMany({
    where: { ...(areaId ? { areaId } : {}), area: { userId } },
    orderBy: { name: "asc" },
  });
}

export async function getOwnedProject(userId: string, projectId: string): Promise<Project> {
  const project = await db.project.findFirst({ where: { id: projectId, area: { userId } } });
  if (!project) {
    throw new NotFoundError("Проект не найден");
  }
  return project;
}

export async function createProject(userId: string, input: CreateProjectInput): Promise<Project> {
  const area = await db.area.findFirst({ where: { id: input.areaId, userId } });
  if (!area) {
    throw new NotFoundError("Направление не найдено");
  }
  return db.project.create({ data: { name: input.name, areaId: area.id } });
}

export async function updateProject(
  userId: string,
  projectId: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const project = await getOwnedProject(userId, projectId);
  return db.project.update({ where: { id: project.id }, data: input });
}

export async function deleteProject(userId: string, projectId: string): Promise<void> {
  const project = await getOwnedProject(userId, projectId);
  // Tasks inside the project are removed by the onDelete: Cascade rule.
  await db.project.delete({ where: { id: project.id } });
}

/** Returns the per-user inbox project, creating the inbox area/project on first use. */
export async function ensureInboxProject(userId: string): Promise<Project> {
  const existing = await db.project.findFirst({
    where: { name: INBOX_PROJECT_NAME, area: { userId, name: INBOX_AREA_NAME } },
  });
  if (existing) {
    return existing;
  }
  const area =
    (await db.area.findFirst({ where: { userId, name: INBOX_AREA_NAME } })) ??
    (await db.area.create({
      data: { userId, name: INBOX_AREA_NAME, color: INBOX_AREA_COLOR, position: -1 },
    }));
  return db.project.create({ data: { areaId: area.id, name: INBOX_PROJECT_NAME } });
}
