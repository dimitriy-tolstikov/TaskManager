import type { Area, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import type { CreateAreaInput, UpdateAreaInput } from "@/lib/validation/areas";

const areaInclude = { projects: { orderBy: { name: "asc" } } } satisfies Prisma.AreaInclude;

export type AreaWithProjects = Prisma.AreaGetPayload<{ include: typeof areaInclude }>;

export function listAreas(userId: string): Promise<AreaWithProjects[]> {
  return db.area.findMany({
    where: { userId },
    include: areaInclude,
    orderBy: { position: "asc" },
  });
}

export async function createArea(userId: string, input: CreateAreaInput): Promise<Area> {
  const position = await db.area.count({ where: { userId } });
  return db.area.create({
    data: { userId, name: input.name, color: input.color, position },
  });
}

export async function updateArea(
  userId: string,
  areaId: string,
  input: UpdateAreaInput,
): Promise<Area> {
  const area = await getOwnedArea(userId, areaId);
  return db.area.update({ where: { id: area.id }, data: input });
}

export async function deleteArea(userId: string, areaId: string): Promise<void> {
  const area = await getOwnedArea(userId, areaId);
  // Projects and their tasks are removed by the onDelete: Cascade rules.
  await db.area.delete({ where: { id: area.id } });
}

async function getOwnedArea(userId: string, areaId: string): Promise<Area> {
  const area = await db.area.findFirst({ where: { id: areaId, userId } });
  if (!area) {
    throw new NotFoundError("Направление не найдено");
  }
  return area;
}
