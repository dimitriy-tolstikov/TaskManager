import { describe, expect, it } from "vitest";

import {
  allocateDayProgress,
  countInWindow,
  isInstanceDone,
  type CompletedTaskRef,
  type ProgressInstance,
} from "@/lib/goalProgress";

const areaScope = { areaId: "area-1", projectId: null };
const projectScope = { areaId: null, projectId: "project-1" };

function task(completedAt: Date, projectId = "project-1", areaId = "area-1"): CompletedTaskRef {
  return { completedAt, projectId, areaId };
}

function instance(
  instanceId: string,
  start: Date,
  end: Date,
  targets: ProgressInstance["targets"],
): ProgressInstance {
  return { instanceId, windowStart: start, windowEnd: end, targets };
}

describe("countInWindow", () => {
  const window = {
    windowStart: new Date(2026, 7, 19, 6, 0),
    windowEnd: new Date(2026, 7, 19, 9, 0),
  };

  it("counts tasks completed inside the window", () => {
    const tasks = [task(new Date(2026, 7, 19, 7, 0)), task(new Date(2026, 7, 19, 8, 59))];

    expect(countInWindow(tasks, window, areaScope)).toBe(2);
  });

  it("ignores tasks completed outside the window", () => {
    const tasks = [task(new Date(2026, 7, 19, 9, 1)), task(new Date(2026, 7, 19, 5, 59))];

    expect(countInWindow(tasks, window, areaScope)).toBe(0);
  });

  it("ignores tasks from another scope", () => {
    const tasks = [task(new Date(2026, 7, 19, 7, 0), "project-2", "area-2")];

    expect(countInWindow(tasks, window, areaScope)).toBe(0);
    expect(countInWindow(tasks, window, projectScope)).toBe(0);
  });
});

describe("allocateDayProgress", () => {
  const morning = instance("i-morning", new Date(2026, 7, 19, 6, 0), new Date(2026, 7, 19, 9, 0), [
    { targetId: "t-morning", scope: areaScope, required: 1 },
  ]);
  const evening = instance(
    "i-evening",
    new Date(2026, 7, 19, 18, 0),
    new Date(2026, 7, 19, 21, 0),
    [{ targetId: "t-evening", scope: areaScope, required: 1 }],
  );

  it("fills the earliest unfilled window even when the task was completed after it ended", () => {
    const tasks = [task(new Date(2026, 7, 19, 12, 0))];

    const done = allocateDayProgress([morning, evening], tasks);

    expect(done.get("t-morning")).toBe(1);
    expect(done.get("t-evening")).toBe(0);
  });

  it("spills over to the next window once the earlier quota is filled", () => {
    const tasks = [task(new Date(2026, 7, 19, 12, 0)), task(new Date(2026, 7, 19, 13, 0))];

    const done = allocateDayProgress([morning, evening], tasks);

    expect(done.get("t-morning")).toBe(1);
    expect(done.get("t-evening")).toBe(1);
  });

  it("caps progress at the required count", () => {
    const tasks = [task(new Date(2026, 7, 19, 7, 0)), task(new Date(2026, 7, 19, 8, 0))];

    const done = allocateDayProgress([morning], tasks);

    expect(done.get("t-morning")).toBe(1);
  });

  it("skips targets whose scope does not match the task", () => {
    const projectOnly = instance(
      "i-project",
      new Date(2026, 7, 19, 6, 0),
      new Date(2026, 7, 19, 9, 0),
      [{ targetId: "t-project", scope: { areaId: null, projectId: "project-9" }, required: 1 }],
    );

    const done = allocateDayProgress([projectOnly], [task(new Date(2026, 7, 19, 7, 0))]);

    expect(done.get("t-project")).toBe(0);
  });

  it("counts one task toward every matching target of the earliest window", () => {
    const dual = instance("i-dual", new Date(2026, 7, 19, 6, 0), new Date(2026, 7, 19, 9, 0), [
      { targetId: "t-area", scope: areaScope, required: 1 },
      { targetId: "t-project", scope: projectScope, required: 1 },
    ]);

    const done = allocateDayProgress([dual], [task(new Date(2026, 7, 19, 12, 0))]);

    expect(done.get("t-area")).toBe(1);
    expect(done.get("t-project")).toBe(1);
  });

  it("deals tasks by completedAt regardless of input order", () => {
    const tasks = [task(new Date(2026, 7, 19, 13, 0)), task(new Date(2026, 7, 19, 12, 0))];

    const done = allocateDayProgress([morning, evening], tasks);

    expect(done.get("t-morning")).toBe(1);
    expect(done.get("t-evening")).toBe(1);
  });
});

describe("isInstanceDone", () => {
  it("is done only when every target quota is met", () => {
    const targets = [
      { targetId: "t1", scope: areaScope, required: 1 },
      { targetId: "t2", scope: projectScope, required: 2 },
    ];

    expect(
      isInstanceDone(
        targets,
        new Map([
          ["t1", 1],
          ["t2", 2],
        ]),
      ),
    ).toBe(true);
    expect(
      isInstanceDone(
        targets,
        new Map([
          ["t1", 1],
          ["t2", 1],
        ]),
      ),
    ).toBe(false);
    expect(isInstanceDone(targets, new Map())).toBe(false);
  });
});
