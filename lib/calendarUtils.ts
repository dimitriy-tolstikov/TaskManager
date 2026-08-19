import type { TaskDto } from "@/lib/apiClient";

export type CalendarMode = "week" | "month";

export interface CalendarState {
  mode: CalendarMode;
  anchor: Date;
}

export const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_GRID_WEEKS = 6;

export function initialCalendarState(): CalendarState {
  return { mode: "month", anchor: new Date() };
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Week starts on Monday, per the ru-RU convention. */
function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  const mondayOffset = (day.getDay() + 6) % 7;
  return addDays(day, -mondayOffset);
}

export function getWeekDays(anchor: Date): Date[] {
  const monday = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/** Fixed 6-week grid starting on the Monday of the week containing the 1st. */
export function getMonthGridDays(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = startOfWeek(first);
  return Array.from({ length: MONTH_GRID_WEEKS * 7 }, (_, index) => addDays(start, index));
}

/** Visible range as query params: tasks outside it are never rendered. */
export function calendarRangeFilters(state: CalendarState): { dueFrom: string; dueTo: string } {
  const days = state.mode === "week" ? getWeekDays(state.anchor) : getMonthGridDays(state.anchor);
  const last = days[days.length - 1];
  return {
    dueFrom: days[0].toISOString(),
    dueTo: new Date(last.getTime() + DAY_MS - 1).toISOString(),
  };
}

export function shiftCalendar(state: CalendarState, direction: -1 | 1): CalendarState {
  const anchor = new Date(state.anchor);
  if (state.mode === "week") {
    anchor.setDate(anchor.getDate() + direction * 7);
  } else {
    anchor.setMonth(anchor.getMonth() + direction);
  }
  return { ...state, anchor };
}

export function todayCalendar(state: CalendarState): CalendarState {
  return { ...state, anchor: new Date() };
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatPeriodTitle(state: CalendarState): string {
  if (state.mode === "month") {
    return capitalize(state.anchor.toLocaleDateString("ru-RU", { month: "long", year: "numeric" }));
  }
  const days = getWeekDays(state.anchor);
  const short = (day: Date) =>
    day.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }).replace(".", "");
  return `${short(days[0])} – ${short(days[6])} ${days[6].getFullYear()}`;
}

export function tasksForDay(tasks: TaskDto[], day: Date): TaskDto[] {
  return tasks.filter((task) => task.dueAt !== null && isSameDay(new Date(task.dueAt), day));
}

// Droppable ids carry the local day; date-only ISO would parse back as UTC.
export function dayKey(day: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

export function parseDayKey(key: string): Date {
  const [year, month, date] = key.split("-").map(Number);
  return new Date(year, month - 1, date);
}

/** Moves a deadline to another day, keeping the original time of day. */
export function moveToDay(dueAt: string | null, day: Date): string {
  const next = startOfDay(day);
  if (dueAt) {
    const old = new Date(dueAt);
    next.setHours(old.getHours(), old.getMinutes(), 0, 0);
  } else {
    next.setHours(12, 0, 0, 0);
  }
  return next.toISOString();
}
