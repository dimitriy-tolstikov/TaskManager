// Pure date math for goal windows: no DB access, easy to unit test.

export interface GoalWindow {
  start: Date;
  end: Date;
}

export interface GoalSchedule {
  startTime: number;
  endTime: number;
  daysOfWeek: number[];
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Builds the concrete window for a calendar day; endTime <= startTime means the window crosses midnight. */
export function buildWindow(day: Date, startTime: number, endTime: number): GoalWindow {
  const start = new Date(startOfDay(day).getTime() + startTime * 60_000);
  let end = new Date(startOfDay(day).getTime() + endTime * 60_000);
  if (endTime <= startTime) {
    end = addDays(end, 1);
  }
  return { start, end };
}

export function runsOnDay(daysOfWeek: number[], day: Date): boolean {
  return daysOfWeek.length === 0 || daysOfWeek.includes(day.getDay());
}

/** Lists window starts of a schedule whose windowStart falls into [from, to]. */
export function listWindowsForRange(schedule: GoalSchedule, from: Date, to: Date): GoalWindow[] {
  const windows: GoalWindow[] = [];
  for (let day = startOfDay(from); day <= to; day = addDays(day, 1)) {
    if (!runsOnDay(schedule.daysOfWeek, day)) {
      continue;
    }
    const window = buildWindow(day, schedule.startTime, schedule.endTime);
    if (window.start >= from && window.start <= to) {
      windows.push(window);
    }
  }
  return windows;
}
