import type { Goal, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { listWindowsForRange } from "@/lib/goalWindows";
import type { CreateGoalInput, GoalTargetInput, UpdateGoalInput } from "@/lib/validation/goals";

export const goalInclude = {
  targets: {
    include: {
      area: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.GoalInclude;

export type GoalWithTargets = Prisma.GoalGetPayload<{ include: typeof goalInclude }>;

export function listGoals(userId: string): Promise<GoalWithTargets[]> {
  return db.goal.findMany({
    where: { userId },
    include: goalInclude,
    orderBy: { createdAt: "asc" },
  });
}

export async function getOwnedGoal(userId: string, goalId: string): Promise<Goal> {
  const goal = await db.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) {
    throw new NotFoundError("Цель не найдена");
  }
  return goal;
}

export async function createGoal(userId: string, input: CreateGoalInput): Promise<GoalWithTargets> {
  await validateTargetScopes(userId, input.targets);
  return db.goal.create({
    data: {
      user: { connect: { id: userId } },
      name: input.name,
      startTime: input.startTime,
      endTime: input.endTime,
      daysOfWeek: input.daysOfWeek,
      targets: { create: input.targets.map(targetCreateData) },
    },
    include: goalInclude,
  });
}

export async function updateGoal(
  userId: string,
  goalId: string,
  input: UpdateGoalInput,
): Promise<GoalWithTargets> {
  const goal = await getOwnedGoal(userId, goalId);
  const startTime = input.startTime ?? goal.startTime;
  const endTime = input.endTime ?? goal.endTime;
  if (startTime === endTime) {
    throw new ValidationError("Начало и конец окна не должны совпадать");
  }
  if (input.targets) {
    await validateTargetScopes(userId, input.targets);
  }
  return db.goal.update({
    where: { id: goal.id },
    data: buildUpdateData(input),
    include: goalInclude,
  });
}

function buildUpdateData(input: UpdateGoalInput): Prisma.GoalUpdateInput {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
    ...(input.endTime !== undefined ? { endTime: input.endTime } : {}),
    ...(input.daysOfWeek !== undefined ? { daysOfWeek: input.daysOfWeek } : {}),
    ...(input.active !== undefined ? { active: input.active } : {}),
    // Targets are replaced wholesale: scopes/counts have no identity worth merging.
    ...(input.targets
      ? { targets: { deleteMany: {}, create: input.targets.map(targetCreateData) } }
      : {}),
  };
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  const goal = await getOwnedGoal(userId, goalId);
  await db.goal.delete({ where: { id: goal.id } });
}

function targetCreateData(target: GoalTargetInput) {
  return {
    requiredCount: target.requiredCount,
    ...(target.areaId ? { area: { connect: { id: target.areaId } } } : {}),
    ...(target.projectId ? { project: { connect: { id: target.projectId } } } : {}),
  };
}

async function validateTargetScopes(userId: string, targets: GoalTargetInput[]): Promise<void> {
  for (const target of targets) {
    if (target.areaId) {
      const area = await db.area.findFirst({ where: { id: target.areaId, userId } });
      if (!area) {
        throw new ValidationError("Направление не найдено");
      }
    }
    if (target.projectId) {
      const project = await db.project.findFirst({
        where: { id: target.projectId, area: { userId } },
      });
      if (!project) {
        throw new ValidationError("Проект не найден");
      }
    }
  }
}

/** Idempotent: the unique (goalId, windowStart) constraint plus skipDuplicates makes reruns no-ops. */
export async function materializeInstances(userId: string, from: Date, to: Date): Promise<void> {
  const goals = await db.goal.findMany({ where: { userId, active: true } });
  const rows = goals.flatMap((goal) =>
    listWindowsForRange(goal, from, to).map((window) => ({
      goalId: goal.id,
      windowStart: window.start,
      windowEnd: window.end,
    })),
  );
  if (rows.length > 0) {
    await db.goalInstance.createMany({ data: rows, skipDuplicates: true });
  }
}

export async function acknowledgeInstance(userId: string, instanceId: string): Promise<void> {
  const instance = await db.goalInstance.findFirst({
    where: { id: instanceId, goal: { userId } },
  });
  if (!instance) {
    throw new NotFoundError("Экземпляр цели не найден");
  }
  await db.goalInstance.update({
    where: { id: instance.id },
    data: { acknowledgedAt: new Date() },
  });
}
