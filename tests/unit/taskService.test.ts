import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";
import { createTask, listTasks, updateTask } from "@/lib/services/taskService";

vi.mock("@/lib/db", () => ({
  db: {
    task: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    project: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    area: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    tag: {
      upsert: vi.fn(),
    },
  },
}));

const taskFindMany = vi.mocked(db.task.findMany);
const taskFindFirst = vi.mocked(db.task.findFirst);
const taskCreate = vi.mocked(db.task.create);
const taskUpdate = vi.mocked(db.task.update);
const projectFindFirst = vi.mocked(db.project.findFirst);
const projectCreate = vi.mocked(db.project.create);
const areaFindFirst = vi.mocked(db.area.findFirst);
const areaCreate = vi.mocked(db.area.create);
const tagUpsert = vi.mocked(db.tag.upsert);

const userId = "user-1";
const ownedProject = {
  id: "project-1",
  areaId: "area-1",
  name: "Сайт",
  archived: false,
};
const ownedTask = {
  id: "task-1",
  projectId: ownedProject.id,
  title: "Задача",
  status: "TODO",
  priority: "MED",
  completedAt: null,
};

function as<T>(value: unknown): T {
  return value as T;
}

beforeEach(() => {
  vi.clearAllMocks();
  taskCreate.mockResolvedValue(as({ id: "task-new" }));
  taskUpdate.mockResolvedValue(as({ id: "task-1" }));
});

describe("createTask", () => {
  it("applies BACKLOG/MED defaults when creating in an explicit project", async () => {
    projectFindFirst.mockResolvedValue(as(ownedProject));

    await createTask(userId, { title: "Новая", projectId: ownedProject.id });

    const data = taskCreate.mock.calls[0][0].data;
    expect(data.status).toBe("BACKLOG");
    expect(data.priority).toBe("MED");
    expect(data.completedAt).toBeNull();
    expect(data.project).toEqual({ connect: { id: ownedProject.id } });
  });

  it("falls back to the inbox project on quick add, creating it when missing", async () => {
    projectFindFirst.mockResolvedValue(null);
    areaFindFirst.mockResolvedValue(null);
    areaCreate.mockResolvedValue(as({ id: "area-inbox" }));
    projectCreate.mockResolvedValue(as({ id: "project-inbox" }));

    await createTask(userId, { title: "Быстрая" });

    expect(areaCreate).toHaveBeenCalledOnce();
    expect(projectCreate).toHaveBeenCalledOnce();
    expect(taskCreate.mock.calls[0][0].data.project).toEqual({
      connect: { id: "project-inbox" },
    });
  });

  it("reuses the existing inbox project on quick add", async () => {
    projectFindFirst.mockResolvedValue(as({ id: "project-inbox" }));

    await createTask(userId, { title: "Быстрая" });

    expect(areaCreate).not.toHaveBeenCalled();
    expect(projectCreate).not.toHaveBeenCalled();
    expect(taskCreate.mock.calls[0][0].data.project).toEqual({
      connect: { id: "project-inbox" },
    });
  });

  it("upserts tags by name and links them to the task", async () => {
    projectFindFirst.mockResolvedValue(as(ownedProject));
    tagUpsert.mockResolvedValueOnce(as({ id: "tag-1" })).mockResolvedValueOnce(as({ id: "tag-2" }));

    await createTask(userId, { title: "С тегами", projectId: ownedProject.id, tags: ["а", "б"] });

    expect(tagUpsert).toHaveBeenCalledTimes(2);
    expect(tagUpsert.mock.calls[0][0].where).toEqual({ userId_name: { userId, name: "а" } });
    expect(taskCreate.mock.calls[0][0].data.tags).toEqual({
      create: [{ tag: { connect: { id: "tag-1" } } }, { tag: { connect: { id: "tag-2" } } }],
    });
  });
});

describe("updateTask", () => {
  it("sets completedAt when the status becomes DONE", async () => {
    taskFindFirst.mockResolvedValue(as(ownedTask));

    await updateTask(userId, ownedTask.id, { status: "DONE" });

    const data = taskUpdate.mock.calls[0][0].data;
    expect(data.status).toBe("DONE");
    expect(data.completedAt).toBeInstanceOf(Date);
  });

  it("clears completedAt when a done task is reopened", async () => {
    taskFindFirst.mockResolvedValue(as({ ...ownedTask, status: "DONE", completedAt: new Date() }));

    await updateTask(userId, ownedTask.id, { status: "TODO" });

    const data = taskUpdate.mock.calls[0][0].data;
    expect(data.status).toBe("TODO");
    expect(data.completedAt).toBeNull();
  });

  it("replaces tags when tags are provided", async () => {
    taskFindFirst.mockResolvedValue(as(ownedTask));
    tagUpsert.mockResolvedValue(as({ id: "tag-9" }));

    await updateTask(userId, ownedTask.id, { tags: ["новый"] });

    expect(taskUpdate.mock.calls[0][0].data.tags).toEqual({
      deleteMany: {},
      create: [{ tag: { connect: { id: "tag-9" } } }],
    });
  });
});

describe("listTasks", () => {
  it("filters by status", async () => {
    await listTasks(userId, { status: "TODO" });

    expect(taskFindMany.mock.calls[0][0]?.where).toMatchObject({ status: "TODO" });
  });

  it("scopes tasks to the current user", async () => {
    await listTasks(userId, {});

    expect(taskFindMany.mock.calls[0][0]?.where).toMatchObject({
      project: { area: { userId } },
    });
  });

  it("searches title and description case-insensitively", async () => {
    await listTasks(userId, { q: "лендинг" });

    expect(taskFindMany.mock.calls[0][0]?.where).toMatchObject({
      OR: [
        { title: { contains: "лендинг", mode: "insensitive" } },
        { description: { contains: "лендинг", mode: "insensitive" } },
      ],
    });
  });

  it("filters overdue tasks: past due date and unfinished status", async () => {
    await listTasks(userId, { overdue: "true" });

    expect(taskFindMany.mock.calls[0][0]?.where).toMatchObject({
      dueAt: { lt: expect.any(Date) },
      status: { notIn: ["DONE", "CANCELLED"] },
    });
  });

  it("filters by tag name", async () => {
    await listTasks(userId, { tag: "срочно" });

    expect(taskFindMany.mock.calls[0][0]?.where).toMatchObject({
      tags: { some: { tag: { userId, name: "срочно" } } },
    });
  });
});
