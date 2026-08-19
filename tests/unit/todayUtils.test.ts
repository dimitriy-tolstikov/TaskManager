import { describe, expect, it } from "vitest";

import type { TaskDto } from "@/lib/apiClient";
import { splitTodayTasks } from "@/lib/todayUtils";

const NOW = new Date("2026-08-19T15:00:00");

function makeTask(partial: Partial<TaskDto> & { id: string }): TaskDto {
  return {
    projectId: "project-1",
    title: partial.id,
    description: "",
    status: "TODO",
    priority: "MED",
    dueAt: null,
    estimateMin: null,
    completedAt: null,
    createdAt: "2026-08-01T10:00:00",
    subtasks: [],
    tags: [],
    project: { id: "project-1", name: "Проект", areaId: "area-1" },
    recurrence: null,
    ...partial,
  };
}

describe("splitTodayTasks", () => {
  it("puts tasks with a past due day into overdue", () => {
    const task = makeTask({ id: "a", dueAt: "2026-08-18T23:59:00" });

    expect(splitTodayTasks([task], NOW).overdue).toEqual([task]);
  });

  it("keeps tasks due earlier today in dueToday, not overdue", () => {
    const task = makeTask({ id: "a", dueAt: "2026-08-19T09:00:00" });

    const sections = splitTodayTasks([task], NOW);
    expect(sections.dueToday).toEqual([task]);
    expect(sections.overdue).toEqual([]);
  });

  it("excludes tasks due tomorrow or later", () => {
    const task = makeTask({ id: "a", dueAt: "2026-08-20T00:00:00" });

    const sections = splitTodayTasks([task], NOW);
    expect(sections).toEqual({ overdue: [], dueToday: [], inProgressWithoutDue: [] });
  });

  it("skips finished tasks regardless of the due date", () => {
    const tasks = [
      makeTask({ id: "a", status: "DONE", dueAt: "2026-08-18T10:00:00" }),
      makeTask({ id: "b", status: "CANCELLED", dueAt: "2026-08-19T10:00:00" }),
    ];

    expect(splitTodayTasks(tasks, NOW)).toEqual({
      overdue: [],
      dueToday: [],
      inProgressWithoutDue: [],
    });
  });

  it("collects in-progress tasks without a due date separately", () => {
    const inProgress = makeTask({ id: "a", status: "IN_PROGRESS" });
    const backlog = makeTask({ id: "b", status: "BACKLOG" });

    expect(splitTodayTasks([inProgress, backlog], NOW).inProgressWithoutDue).toEqual([inProgress]);
  });
});
