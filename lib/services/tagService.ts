import type { Tag } from "@prisma/client";

import { db } from "@/lib/db";
import type { CreateTagInput } from "@/lib/validation/tags";

export function listTags(userId: string): Promise<Tag[]> {
  return db.tag.findMany({ where: { userId }, orderBy: { name: "asc" } });
}

export function createTag(userId: string, input: CreateTagInput): Promise<Tag> {
  return db.tag.upsert({
    where: { userId_name: { userId, name: input.name } },
    create: { userId, name: input.name },
    update: {},
  });
}

/** Upserts tags by (userId, name) and returns their ids for linking to a task. */
export async function resolveTagIds(userId: string, names: string[]): Promise<string[]> {
  const uniqueNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  const tagIds: string[] = [];
  for (const name of uniqueNames) {
    const tag = await createTag(userId, { name });
    tagIds.push(tag.id);
  }
  return tagIds;
}
