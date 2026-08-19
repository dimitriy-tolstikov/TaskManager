// Pure progress computation for goal instances: no DB access, easy to unit test.

export interface TargetScope {
  areaId: string | null;
  projectId: string | null;
}

export interface ProgressTarget {
  targetId: string;
  scope: TargetScope;
  required: number;
}

export interface ProgressInstance {
  instanceId: string;
  windowStart: Date;
  windowEnd: Date;
  targets: ProgressTarget[];
}

// areaId is pre-resolved (task.project.areaId) so scope checks stay a plain comparison.
export interface CompletedTaskRef {
  completedAt: Date;
  projectId: string;
  areaId: string;
}

export function taskMatchesScope(task: CompletedTaskRef, scope: TargetScope): boolean {
  if (scope.projectId) {
    return task.projectId === scope.projectId;
  }
  return scope.areaId !== null && task.areaId === scope.areaId;
}

export interface WindowBounds {
  windowStart: Date;
  windowEnd: Date;
}

/** Past-day rule: a task counts only when its completedAt falls inside the window. */
export function countInWindow(
  tasks: CompletedTaskRef[],
  window: WindowBounds,
  scope: TargetScope,
): number {
  return tasks.filter(
    (task) =>
      task.completedAt >= window.windowStart &&
      task.completedAt <= window.windowEnd &&
      taskMatchesScope(task, scope),
  ).length;
}

/**
 * Same-day rule: tasks completed any time this day are dealt (by completedAt asc) into the
 * earliest unfilled window of the day (windowStart asc). Within that window a task counts
 * toward every matching target, mirroring the in-window counting rule for past days.
 */
export function allocateDayProgress(
  instances: ProgressInstance[],
  tasks: CompletedTaskRef[],
): Map<string, number> {
  const ordered = [...instances].sort((a, b) => a.windowStart.getTime() - b.windowStart.getTime());
  const done = new Map<string, number>();
  const remaining = new Map<string, number>();
  for (const instance of ordered) {
    for (const target of instance.targets) {
      done.set(target.targetId, 0);
      remaining.set(target.targetId, target.required);
    }
  }
  const sortedTasks = [...tasks].sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());
  for (const task of sortedTasks) {
    fillEarliestMatchingWindow(ordered, task, remaining, done);
  }
  return done;
}

function fillEarliestMatchingWindow(
  instances: ProgressInstance[],
  task: CompletedTaskRef,
  remaining: Map<string, number>,
  done: Map<string, number>,
): void {
  for (const instance of instances) {
    const matched = instance.targets.filter(
      (t) => (remaining.get(t.targetId) ?? 0) > 0 && taskMatchesScope(task, t.scope),
    );
    if (matched.length === 0) {
      continue;
    }
    for (const target of matched) {
      remaining.set(target.targetId, (remaining.get(target.targetId) ?? 0) - 1);
      done.set(target.targetId, (done.get(target.targetId) ?? 0) + 1);
    }
    return;
  }
}

export function isInstanceDone(targets: ProgressTarget[], done: Map<string, number>): boolean {
  return targets.every((target) => (done.get(target.targetId) ?? 0) >= target.required);
}
