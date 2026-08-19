import type { TaskDto } from "@/lib/apiClient";

export interface TodaySections {
  overdue: TaskDto[];
  dueToday: TaskDto[];
  inProgressWithoutDue: TaskDto[];
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Splits tasks into the "Today" view sections (FR-10).
 * "Overdue" means the due day has fully passed; tasks due earlier today stay
 * in `dueToday` so the sections are disjoint — the row highlights them red.
 */
export function splitTodayTasks(tasks: TaskDto[], now: Date): TodaySections {
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const sections: TodaySections = { overdue: [], dueToday: [], inProgressWithoutDue: [] };

  for (const task of tasks) {
    if (task.status === "DONE" || task.status === "CANCELLED") {
      continue;
    }
    if (!task.dueAt) {
      if (task.status === "IN_PROGRESS") {
        sections.inProgressWithoutDue.push(task);
      }
      continue;
    }
    const dueAt = new Date(task.dueAt);
    if (dueAt < todayStart) {
      sections.overdue.push(task);
    } else if (dueAt < tomorrowStart) {
      sections.dueToday.push(task);
    }
  }
  return sections;
}
