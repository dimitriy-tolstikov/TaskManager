import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";
import { deleteTask, updateTask } from "@/lib/services/taskService";

vi.mock("@/lib/db", () => {
  const dbMock = {
    task: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    taskTag: { findMany: vi.fn() },
    recurrenceRule: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((callback: (tx: unknown) => unknown) => callback(dbMock)),
  };
  return { db: dbMock };
});

const taskFindFirst = vi.mocked(db.task.findFirst);
const taskCreate = vi.mocked(db.task.create);
const taskUpdate = vi.mocked(db.task.update);
const taskDelete = vi.mocked(db.task.delete);
const taskCount = vi.mocked(db.task.count);
const taskTagFindMany = vi.mocked(db.taskTag.findMany);
const ruleFindUnique = vi.mocked(db.recurrenceRule.findUnique);
const ruleCreate = vi.mocked(db.recurrenceRule.create);
const ruleUpdate = vi.mocked(db.recurrenceRule.update);
const ruleDelete = vi.mocked(db.recurrenceRule.delete);

const userId = "user-1";
const ownedTask = {
  id: "task-1",
  projectId: "project-1",
  title: "Еженедельный статус",
  description: "Описание",
  status: "TODO",
  priority: "HIGH",
  estimateMin: 30,
  dueAt: new Date("2026-08-19T10:00:00.000Z"),
  recurrenceId: "rule-1",
  completedAt: null,
};

function as<T>(value: unknown): T {
  return value as T;
}

function mockRule(rrule: string) {
  ruleFindUnique.mockResolvedValue(as({ id: "rule-1", rrule, nextRunAt: null }));
}

beforeEach(() => {
  vi.clearAllMocks();
  taskFindFirst.mockResolvedValue(as(ownedTask));
  taskTagFindMany.mockResolvedValue(as([{ taskId: ownedTask.id, tagId: "tag-1" }]));
  taskUpdate.mockResolvedValue(as({ id: ownedTask.id }));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("updateTask completing a recurring task", () => {
  it("spawns the next daily copy one day after the due date", async () => {
    mockRule("FREQ=DAILY");

    await updateTask(userId, ownedTask.id, { status: "DONE" });

    expect(taskUpdate.mock.calls[0][0].data).toMatchObject({ status: "DONE" });
    expect(taskCreate).toHaveBeenCalledOnce();
    expect(taskCreate.mock.calls[0][0].data.dueAt).toEqual(new Date("2026-08-20T10:00:00.000Z"));
  });

  it("spawns the next weekly copy seven days after the due date", async () => {
    mockRule("FREQ=WEEKLY");

    await updateTask(userId, ownedTask.id, { status: "DONE" });

    expect(taskCreate.mock.calls[0][0].data.dueAt).toEqual(new Date("2026-08-26T10:00:00.000Z"));
  });

  it("spawns the next monthly copy one month after the due date", async () => {
    mockRule("FREQ=MONTHLY");

    await updateTask(userId, ownedTask.id, { status: "DONE" });

    expect(taskCreate.mock.calls[0][0].data.dueAt).toEqual(new Date("2026-09-19T10:00:00.000Z"));
  });

  it("anchors at the completion time when the task has no due date", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-19T12:00:00.000Z"));
    taskFindFirst.mockResolvedValue(as({ ...ownedTask, dueAt: null }));
    mockRule("FREQ=WEEKLY");

    await updateTask(userId, ownedTask.id, { status: "DONE" });

    expect(taskCreate.mock.calls[0][0].data.dueAt).toEqual(new Date("2026-08-26T12:00:00.000Z"));
  });

  it("copies title, project and tags, resetting the status to TODO", async () => {
    mockRule("FREQ=WEEKLY");

    await updateTask(userId, ownedTask.id, { status: "DONE" });

    expect(taskCreate.mock.calls[0][0].data).toMatchObject({
      title: ownedTask.title,
      description: ownedTask.description,
      status: "TODO",
      priority: ownedTask.priority,
      estimateMin: ownedTask.estimateMin,
      project: { connect: { id: ownedTask.projectId } },
      recurrence: { connect: { id: "rule-1" } },
      tags: { create: [{ tag: { connect: { id: "tag-1" } } }] },
    });
  });

  it("advances the rule's nextRunAt past the spawned copy", async () => {
    mockRule("FREQ=WEEKLY");

    await updateTask(userId, ownedTask.id, { status: "DONE" });

    expect(ruleUpdate).toHaveBeenCalledOnce();
    expect(ruleUpdate.mock.calls[0][0].data.nextRunAt).toEqual(
      new Date("2026-09-02T10:00:00.000Z"),
    );
  });

  it("does not spawn a copy for a task without a rule", async () => {
    taskFindFirst.mockResolvedValue(as({ ...ownedTask, recurrenceId: null }));

    await updateTask(userId, ownedTask.id, { status: "DONE" });

    expect(taskCreate).not.toHaveBeenCalled();
    expect(ruleUpdate).not.toHaveBeenCalled();
  });

  it("detaches the rule when the recurrence is removed on completion", async () => {
    mockRule("FREQ=WEEKLY");
    taskCount.mockResolvedValue(0);

    await updateTask(userId, ownedTask.id, { status: "DONE", recurrence: "none" });

    expect(taskUpdate.mock.calls[0][0].data).toMatchObject({
      status: "DONE",
      recurrence: { disconnect: true },
    });
    expect(taskCreate).not.toHaveBeenCalled();
    expect(ruleDelete).toHaveBeenCalledOnce();
  });
});

describe("syncRecurrenceRule via updateTask", () => {
  it("creates a rule and connects it when recurrence is set on a plain task", async () => {
    taskFindFirst.mockResolvedValue(as({ ...ownedTask, recurrenceId: null }));
    ruleCreate.mockResolvedValue(as({ id: "rule-new" }));

    await updateTask(userId, ownedTask.id, { recurrence: "biweekly" });

    expect(ruleCreate.mock.calls[0][0].data).toMatchObject({
      rrule: "FREQ=WEEKLY;INTERVAL=2",
      nextRunAt: new Date("2026-09-02T10:00:00.000Z"),
    });
    expect(taskUpdate.mock.calls[0][0].data.recurrence).toEqual({
      connect: { id: "rule-new" },
    });
  });

  it("rewrites the existing rule when the recurrence kind changes", async () => {
    await updateTask(userId, ownedTask.id, { recurrence: "monthly" });

    expect(ruleUpdate.mock.calls[0][0]).toMatchObject({
      where: { id: "rule-1" },
      data: { rrule: "FREQ=MONTHLY", nextRunAt: new Date("2026-09-19T10:00:00.000Z") },
    });
    expect(taskUpdate.mock.calls[0][0].data.recurrence).toBeUndefined();
  });

  it("keeps the shared rule alive while another task still uses it", async () => {
    taskCount.mockResolvedValue(1);

    await updateTask(userId, ownedTask.id, { recurrence: "none" });

    expect(taskUpdate.mock.calls[0][0].data.recurrence).toEqual({ disconnect: true });
    expect(ruleDelete).not.toHaveBeenCalled();
  });
});

describe("deleteTask", () => {
  it("deletes the orphaned rule together with its last task", async () => {
    taskCount.mockResolvedValue(0);

    await deleteTask(userId, ownedTask.id);

    expect(taskDelete).toHaveBeenCalledOnce();
    expect(ruleDelete).toHaveBeenCalledWith({ where: { id: "rule-1" } });
  });

  it("keeps the rule when copies still reference it", async () => {
    taskCount.mockResolvedValue(1);

    await deleteTask(userId, ownedTask.id);

    expect(ruleDelete).not.toHaveBeenCalled();
  });
});
