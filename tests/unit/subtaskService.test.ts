import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { addSubtask, updateSubtask } from "@/lib/services/subtaskService";

vi.mock("@/lib/db", () => ({
  db: {
    task: {
      findFirst: vi.fn(),
    },
    subtask: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

const taskFindFirst = vi.mocked(db.task.findFirst);
const subtaskFindFirst = vi.mocked(db.subtask.findFirst);
const subtaskCreate = vi.mocked(db.subtask.create);
const subtaskUpdate = vi.mocked(db.subtask.update);
const subtaskCount = vi.mocked(db.subtask.count);

const userId = "user-1";

function as<T>(value: unknown): T {
  return value as T;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("addSubtask", () => {
  it("appends a subtask at the end of the checklist", async () => {
    taskFindFirst.mockResolvedValue(as({ id: "task-1" }));
    subtaskCount.mockResolvedValue(2);
    subtaskCreate.mockResolvedValue(as({ id: "sub-3" }));

    await addSubtask(userId, "task-1", { title: "Шаг 3" });

    expect(subtaskCreate.mock.calls[0][0].data).toEqual({
      taskId: "task-1",
      title: "Шаг 3",
      position: 2,
    });
  });

  it("rejects adding to another user's task", async () => {
    taskFindFirst.mockResolvedValue(null);

    await expect(addSubtask(userId, "task-x", { title: "Шаг" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(subtaskCreate).not.toHaveBeenCalled();
  });
});

describe("updateSubtask", () => {
  it("toggles done on an owned subtask", async () => {
    subtaskFindFirst.mockResolvedValue(as({ id: "sub-1", done: false }));
    subtaskUpdate.mockResolvedValue(as({ id: "sub-1", done: true }));

    await updateSubtask(userId, "sub-1", { done: true });

    expect(subtaskUpdate).toHaveBeenCalledWith({ where: { id: "sub-1" }, data: { done: true } });
  });
});
