import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { createArea, deleteArea, updateArea } from "@/lib/services/areaService";
import { createProject, deleteProject } from "@/lib/services/projectService";

vi.mock("@/lib/db", () => ({
  db: {
    area: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    project: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const areaFindFirst = vi.mocked(db.area.findFirst);
const areaCreate = vi.mocked(db.area.create);
const areaDelete = vi.mocked(db.area.delete);
const areaCount = vi.mocked(db.area.count);
const projectFindFirst = vi.mocked(db.project.findFirst);
const projectCreate = vi.mocked(db.project.create);
const projectDelete = vi.mocked(db.project.delete);

const userId = "user-1";
const ownedArea = { id: "area-1", userId, name: "Работа", color: "#3b82f6", position: 0 };

function as<T>(value: unknown): T {
  return value as T;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("areaService", () => {
  it("creates an area at the end of the list", async () => {
    areaCount.mockResolvedValue(2);
    areaCreate.mockResolvedValue(as(ownedArea));

    await createArea(userId, { name: "Учёба", color: "#22c55e" });

    expect(areaCreate.mock.calls[0][0].data).toMatchObject({ userId, position: 2 });
  });

  it("rejects updates of another user's area", async () => {
    areaFindFirst.mockResolvedValue(null);

    await expect(updateArea(userId, "area-x", { name: "Чужое" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("deletes the area row; projects and tasks cascade in the database", async () => {
    areaFindFirst.mockResolvedValue(as(ownedArea));

    await deleteArea(userId, ownedArea.id);

    expect(areaDelete).toHaveBeenCalledWith({ where: { id: ownedArea.id } });
  });
});

describe("projectService", () => {
  it("rejects creating a project in another user's area", async () => {
    areaFindFirst.mockResolvedValue(null);

    await expect(
      createProject(userId, { name: "Проект", areaId: "area-x" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(projectCreate).not.toHaveBeenCalled();
  });

  it("deletes the project row; tasks cascade in the database", async () => {
    projectFindFirst.mockResolvedValue(as({ id: "project-1", areaId: ownedArea.id }));

    await deleteProject(userId, "project-1");

    expect(projectDelete).toHaveBeenCalledWith({ where: { id: "project-1" } });
  });
});
