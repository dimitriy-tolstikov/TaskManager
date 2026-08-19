import type { GoalInstance, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  allocateDayProgress,
  countInWindow,
  isInstanceDone,
  type CompletedTaskRef,
  type ProgressInstance,
} from "@/lib/goalProgress";
import { addDays, isSameDay, startOfDay } from "@/lib/goalWindows";
import { materializeInstances } from "@/lib/services/goalService";

export interface DashboardTargetEntry {
  targetId: string;
  label: string;
  required: number;
  done: number;
}

export interface DashboardEntry {
  instanceId: string;
  goalId: string;
  goalName: string;
  windowStart: Date;
  windowEnd: Date;
  targets: DashboardTargetEntry[];
}

export interface GoalsDashboard {
  current: DashboardEntry[];
  upcomingToday: DashboardEntry[];
  overdue: DashboardEntry[];
}

type GoalForDashboard = Prisma.GoalGetPayload<{
  include: { targets: { include: { area: true; project: true } }; instances: true };
}>;

interface FlatInstance {
  goal: GoalForDashboard;
  instance: GoalInstance;
}

// Overdue windows stay visible for a week; older ones are only reachable via ack-less history.
const LOOKBACK_DAYS = 7;

export async function getDashboard(userId: string, now = new Date()): Promise<GoalsDashboard> {
  const from = addDays(startOfDay(now), -LOOKBACK_DAYS);
  const to = addDays(startOfDay(now), 1);
  await materializeInstances(userId, from, to);
  const goals = await db.goal.findMany({
    where: { userId, active: true },
    include: {
      targets: { include: { area: true, project: true } },
      instances: {
        where: { windowStart: { gte: from, lte: to } },
        orderBy: { windowStart: "asc" },
      },
    },
  });
  const tasks = await loadCompletedTasks(userId, from, now);
  const entries = buildEntries(goals, tasks, now);
  return classifyEntries(entries, now);
}

async function loadCompletedTasks(
  userId: string,
  from: Date,
  to: Date,
): Promise<CompletedTaskRef[]> {
  const rows = await db.task.findMany({
    where: { project: { area: { userId } }, completedAt: { gte: from, lte: to } },
    select: { completedAt: true, projectId: true, project: { select: { areaId: true } } },
    orderBy: { completedAt: "asc" },
  });
  return rows.flatMap((row) =>
    row.completedAt
      ? [{ completedAt: row.completedAt, projectId: row.projectId, areaId: row.project.areaId }]
      : [],
  );
}

interface ScoredInstance {
  flat: FlatInstance;
  entry: DashboardEntry;
  isDone: boolean;
}

function buildEntries(
  goals: GoalForDashboard[],
  tasks: CompletedTaskRef[],
  now: Date,
): ScoredInstance[] {
  const flats = goals.flatMap((goal) => goal.instances.map((instance) => ({ goal, instance })));
  const dayAllocation = allocateDayProgress(
    toProgressInstances(flats.filter((flat) => isSameDay(flat.instance.windowStart, now))),
    tasks.filter((task) => isSameDay(task.completedAt, now)),
  );
  return flats.map((flat) => scoreInstance(flat, tasks, now, dayAllocation));
}

function toProgressInstances(flats: FlatInstance[]): ProgressInstance[] {
  return flats.map((flat) => ({
    instanceId: flat.instance.id,
    windowStart: flat.instance.windowStart,
    windowEnd: flat.instance.windowEnd,
    targets: flat.goal.targets.map((target) => ({
      targetId: target.id,
      scope: { areaId: target.areaId, projectId: target.projectId },
      required: target.requiredCount,
    })),
  }));
}

function scoreInstance(
  flat: FlatInstance,
  tasks: CompletedTaskRef[],
  now: Date,
  dayAllocation: Map<string, number>,
): ScoredInstance {
  const isToday = isSameDay(flat.instance.windowStart, now);
  const done = new Map<string, number>();
  for (const target of flat.goal.targets) {
    const value = isToday
      ? (dayAllocation.get(target.id) ?? 0)
      : countInWindow(tasks, flat.instance, {
          areaId: target.areaId,
          projectId: target.projectId,
        });
    done.set(target.id, value);
  }
  return {
    flat,
    entry: buildEntry(flat, done),
    isDone: isInstanceDone(
      flat.goal.targets.map((t) => ({
        targetId: t.id,
        scope: { areaId: t.areaId, projectId: t.projectId },
        required: t.requiredCount,
      })),
      done,
    ),
  };
}

function buildEntry(flat: FlatInstance, done: Map<string, number>): DashboardEntry {
  return {
    instanceId: flat.instance.id,
    goalId: flat.goal.id,
    goalName: flat.goal.name,
    windowStart: flat.instance.windowStart,
    windowEnd: flat.instance.windowEnd,
    targets: flat.goal.targets.map((target) => ({
      targetId: target.id,
      label: target.project?.name ?? target.area?.name ?? "—",
      required: target.requiredCount,
      done: done.get(target.id) ?? 0,
    })),
  };
}

function classifyEntries(entries: ScoredInstance[], now: Date): GoalsDashboard {
  const dashboard: GoalsDashboard = { current: [], upcomingToday: [], overdue: [] };
  for (const { flat, entry, isDone } of entries) {
    const { windowStart, windowEnd, acknowledgedAt } = flat.instance;
    if (windowStart <= now && now <= windowEnd) {
      dashboard.current.push(entry);
    } else if (isSameDay(windowStart, now) && windowStart > now) {
      dashboard.upcomingToday.push(entry);
    } else if (windowEnd < now && !isDone && !acknowledgedAt) {
      dashboard.overdue.push(entry);
    }
  }
  dashboard.overdue.sort((a, b) => b.windowStart.getTime() - a.windowStart.getTime());
  return dashboard;
}
