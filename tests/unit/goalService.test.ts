import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";
import {
  acknowledgeInstance,
  createGoal,
  deleteGoal,
  materializeInstances,
  updateGoal,
} from "@/lib/services/goalService";

vi.mock("@/lib/db", () => ({
  db: {
    goal: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    goalInstance: {
      createMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    area: { findFirst: vi.fn() },
    project: { findFirst: vi.fn() },
  },
}));

const goalFindMany = vi.mocked(db.goal.findMany);
const goalFindFirst = vi.mocked(db.goal.findFirst);
const goalCreate = vi.mocked(db.goal.create);
const goalUpdate = vi.mocked(db.goal.update);
const goalDelete = vi.mocked(db.goal.delete);
const instanceCreateMany = vi.mocked(db.goalInstance.createMany);
const instanceFindFirst = vi.mocked(db.goalInstance.findFirst);
const instanceUpdate = vi.mocked(db.goalInstance.update);
const areaFindFirst = vi.mocked(db.area.findFirst);
const projectFindFirst = vi.mocked(db.project.findFirst);

const userId = "user-1";
const ownedGoal = {
  id: "goal-1",
  userId,
  name: "Утро 6–9",
  startTime: 360,
  endTime: 540,
  daysOfWeek: [] as number[],
  active: true,
};

function as<T>(value: unknown): T {
  return value as T;
}

beforeEach(() => {
  vi.clearAllMocks();
  goalCreate.mockResolvedValue(as({ id: "goal-new" }));
  goalUpdate.mockResolvedValue(as({ id: "goal-1" }));
});

describe("createGoal", () => {
  it("creates a goal with nested targets connected to area and project", async () => {
    areaFindFirst.mockResolvedValue(as({ id: "area-1" }));
    projectFindFirst.mockResolvedValue(as({ id: "project-1" }));

    await createGoal(userId, {
      name: "Утро 6–9",
      startTime: 360,
      endTime: 540,
      daysOfWeek: [],
      targets: [
        { areaId: "area-1", requiredCount: 1 },
        { projectId: "project-1", requiredCount: 2 },
      ],
    });

    const data = goalCreate.mock.calls[0][0].data;
    expect(data.user).toEqual({ connect: { id: userId } });
    expect(data.targets?.create).toEqual([
      { requiredCount: 1, area: { connect: { id: "area-1" } } },
      { requiredCount: 2, project: { connect: { id: "project-1" } } },
    ]);
  });

  it("rejects a target scope that does not belong to the user", async () => {
    areaFindFirst.mockResolvedValue(null);

    await expect(
      createGoal(userId, {
        name: "Цель",
        startTime: 360,
        endTime: 540,
        daysOfWeek: [],
        targets: [{ areaId: "area-foreign", requiredCount: 1 }],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(goalCreate).not.toHaveBeenCalled();
  });
});

describe("updateGoal", () => {
  it("throws NotFoundError for a goal of another user", async () => {
    goalFindFirst.mockResolvedValue(null);

    await expect(updateGoal(userId, "goal-foreign", { name: "x" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("rejects when merged start and end times coincide", async () => {
    goalFindFirst.mockResolvedValue(as(ownedGoal));

    await expect(updateGoal(userId, ownedGoal.id, { endTime: 360 })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(goalUpdate).not.toHaveBeenCalled();
  });

  it("replaces targets wholesale when they are provided", async () => {
    goalFindFirst.mockResolvedValue(as(ownedGoal));
    areaFindFirst.mockResolvedValue(as({ id: "area-2" }));

    await updateGoal(userId, ownedGoal.id, {
      targets: [{ areaId: "area-2", requiredCount: 3 }],
    });

    expect(goalUpdate.mock.calls[0][0].data.targets).toEqual({
      deleteMany: {},
      create: [{ requiredCount: 3, area: { connect: { id: "area-2" } } }],
    });
  });

  it("keeps targets untouched when they are not provided", async () => {
    goalFindFirst.mockResolvedValue(as(ownedGoal));

    await updateGoal(userId, ownedGoal.id, { active: false });

    expect(goalUpdate.mock.calls[0][0].data.targets).toBeUndefined();
  });
});

describe("deleteGoal", () => {
  it("deletes only an owned goal", async () => {
    goalFindFirst.mockResolvedValue(as(ownedGoal));

    await deleteGoal(userId, ownedGoal.id);

    expect(goalDelete).toHaveBeenCalledWith({ where: { id: ownedGoal.id } });
  });
});

describe("materializeInstances", () => {
  it("creates one window per day and relies on skipDuplicates for idempotency", async () => {
    goalFindMany.mockResolvedValue(as([ownedGoal]));

    await materializeInstances(userId, new Date(2026, 7, 17), new Date(2026, 7, 19, 23, 59));

    const call = as<{ skipDuplicates?: boolean; data: unknown[] }>(
      instanceCreateMany.mock.calls[0]?.[0],
    );
    expect(call.skipDuplicates).toBe(true);
    expect(call.data).toHaveLength(3);
    expect(as<{ windowStart: Date }[]>(call.data)[0].windowStart).toEqual(
      new Date(2026, 7, 17, 6, 0),
    );
  });

  it("builds overnight windows ending the next day", async () => {
    goalFindMany.mockResolvedValue(as([{ ...ownedGoal, startTime: 1320, endTime: 120 }]));

    await materializeInstances(userId, new Date(2026, 7, 19), new Date(2026, 7, 19, 23, 59));

    const rows = as<{ windowStart: Date; windowEnd: Date }[]>(
      instanceCreateMany.mock.calls[0]?.[0]?.data,
    );
    expect(rows[0].windowStart).toEqual(new Date(2026, 7, 19, 22, 0));
    expect(rows[0].windowEnd).toEqual(new Date(2026, 7, 20, 2, 0));
  });

  it("materializes only scheduled days of week", async () => {
    goalFindMany.mockResolvedValue(as([{ ...ownedGoal, daysOfWeek: [1] }]));

    await materializeInstances(userId, new Date(2026, 7, 16), new Date(2026, 7, 19, 23, 59));

    expect(instanceCreateMany.mock.calls[0]?.[0]?.data).toHaveLength(1);
  });

  it("does nothing when the user has no active goals", async () => {
    goalFindMany.mockResolvedValue([]);

    await materializeInstances(userId, new Date(2026, 7, 17), new Date(2026, 7, 19));

    expect(instanceCreateMany).not.toHaveBeenCalled();
  });
});

describe("acknowledgeInstance", () => {
  it("marks an owned instance as acknowledged", async () => {
    instanceFindFirst.mockResolvedValue(as({ id: "inst-1" }));

    await acknowledgeInstance(userId, "inst-1");

    expect(instanceFindFirst.mock.calls[0]?.[0]?.where).toEqual({
      id: "inst-1",
      goal: { userId },
    });
    expect(instanceUpdate.mock.calls[0]?.[0]?.data.acknowledgedAt).toBeInstanceOf(Date);
  });

  it("throws NotFoundError for an instance of another user", async () => {
    instanceFindFirst.mockResolvedValue(null);

    await expect(acknowledgeInstance(userId, "inst-foreign")).rejects.toBeInstanceOf(NotFoundError);
    expect(instanceUpdate).not.toHaveBeenCalled();
  });
});
