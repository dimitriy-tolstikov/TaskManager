import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";
import { getDashboard } from "@/lib/services/goalDashboardService";

vi.mock("@/lib/db", () => ({
  db: {
    goal: { findMany: vi.fn() },
    goalInstance: { createMany: vi.fn() },
    task: { findMany: vi.fn() },
  },
}));

const goalFindMany = vi.mocked(db.goal.findMany);
const instanceCreateMany = vi.mocked(db.goalInstance.createMany);
const taskFindMany = vi.mocked(db.task.findMany);

const userId = "user-1";
// Local time on purpose: window math is wall-clock based.
const now = new Date(2026, 7, 19, 10, 0); // Wednesday

function at(dayOffset: number, hours: number, minutes = 0): Date {
  return new Date(2026, 7, 19 + dayOffset, hours, minutes);
}

function as<T>(value: unknown): T {
  return value as T;
}

const area1 = { id: "area-1", name: "Работа" };
const project2 = { id: "project-2", name: "Диплом" };

const goalA = {
  id: "goal-a",
  userId,
  name: "Утро 6–9",
  startTime: 360,
  endTime: 540,
  daysOfWeek: [] as number[],
  active: true,
  targets: [
    {
      id: "t1",
      goalId: "goal-a",
      areaId: "area-1",
      projectId: null,
      requiredCount: 1,
      area: area1,
      project: null,
    },
    {
      id: "t2",
      goalId: "goal-a",
      areaId: null,
      projectId: "project-2",
      requiredCount: 1,
      area: null,
      project: project2,
    },
  ],
  instances: [
    {
      id: "i-today",
      goalId: "goal-a",
      windowStart: at(0, 6),
      windowEnd: at(0, 9),
      acknowledgedAt: null,
    },
    {
      id: "i-yesterday",
      goalId: "goal-a",
      windowStart: at(-1, 6),
      windowEnd: at(-1, 9),
      acknowledgedAt: null,
    },
    {
      id: "i-acked",
      goalId: "goal-a",
      windowStart: at(-2, 6),
      windowEnd: at(-2, 9),
      acknowledgedAt: at(-2, 10),
    },
  ],
};

const goalB = {
  id: "goal-b",
  userId,
  name: "День 8–11",
  startTime: 480,
  endTime: 660,
  daysOfWeek: [] as number[],
  active: true,
  targets: [
    {
      id: "t3",
      goalId: "goal-b",
      areaId: "area-1",
      projectId: null,
      requiredCount: 2,
      area: area1,
      project: null,
    },
  ],
  instances: [
    {
      id: "i-current",
      goalId: "goal-b",
      windowStart: at(0, 8),
      windowEnd: at(0, 11),
      acknowledgedAt: null,
    },
    {
      id: "i-upcoming",
      goalId: "goal-b",
      windowStart: at(0, 20),
      windowEnd: at(0, 21),
      acknowledgedAt: null,
    },
  ],
};

function completedTask(dayOffset: number, hours: number, projectId: string, areaId: string) {
  return {
    completedAt: at(dayOffset, hours, 30),
    projectId,
    project: { areaId },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  goalFindMany.mockResolvedValue(as([goalA, goalB]));
  taskFindMany.mockResolvedValue(
    as([
      completedTask(0, 7, "project-2", "area-2"), // inside today's morning window, project scope
      completedTask(0, 9, "project-1", "area-1"), // after the morning window, same day
      completedTask(-1, 10, "project-1", "area-1"), // yesterday, outside its window
    ]),
  );
});

describe("getDashboard", () => {
  it("materializes instances idempotently before reading", async () => {
    await getDashboard(userId, now);

    expect(instanceCreateMany).toHaveBeenCalledOnce();
    expect(instanceCreateMany.mock.calls[0]?.[0]?.skipDuplicates).toBe(true);
  });

  it("classifies a running window as current with its progress", async () => {
    const dashboard = await getDashboard(userId, now);

    expect(dashboard.current.map((entry) => entry.instanceId)).toEqual(["i-current"]);
    expect(dashboard.current[0].targets[0]).toMatchObject({
      targetId: "t3",
      label: "Работа",
      required: 2,
      done: 0,
    });
  });

  it("classifies a window starting later today as upcomingToday", async () => {
    const dashboard = await getDashboard(userId, now);

    expect(dashboard.upcomingToday.map((entry) => entry.instanceId)).toEqual(["i-upcoming"]);
  });

  it("retro-fills today's expired window from a same-day completion and clears overdue", async () => {
    const dashboard = await getDashboard(userId, now);

    // i-today ended at 09:00, but both quotas were filled by same-day completions.
    expect(dashboard.overdue.map((entry) => entry.instanceId)).not.toContain("i-today");
  });

  it("keeps past-day windows overdue when completions fall outside the window", async () => {
    const dashboard = await getDashboard(userId, now);

    expect(dashboard.overdue.map((entry) => entry.instanceId)).toEqual(["i-yesterday"]);
    expect(dashboard.overdue[0].targets.map((t) => t.done)).toEqual([0, 0]);
  });

  it("hides acknowledged instances from overdue", async () => {
    const dashboard = await getDashboard(userId, now);

    expect(dashboard.overdue.map((entry) => entry.instanceId)).not.toContain("i-acked");
  });
});
