// Pure formatting helpers for goals UI: easy to unit test, no React.

export const DAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

// Order for the picker: Monday first, getDay indices.
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function formatTimeRange(startTime: number, endTime: number): string {
  return `${formatMinutes(startTime)}–${formatMinutes(endTime)}`;
}

export function formatDaysOfWeek(daysOfWeek: number[]): string {
  if (daysOfWeek.length === 0 || daysOfWeek.length === 7) {
    return "Ежедневно";
  }
  return DAY_ORDER.filter((day) => daysOfWeek.includes(day))
    .map((day) => DAY_LABELS[day])
    .join(", ");
}

export function minutesToTimeInput(minutes: number): string {
  return formatMinutes(minutes);
}

export function timeInputToMinutes(value: string): number {
  const [hours, mins] = value.split(":").map(Number);
  return (hours || 0) * 60 + (mins || 0);
}

export function formatClock(iso: string): string {
  const date = new Date(iso);
  return formatMinutes(date.getHours() * 60 + date.getMinutes());
}

export function formatDayDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function formatRemaining(toIso: string, now = new Date()): string {
  const diffMin = Math.max(0, Math.round((new Date(toIso).getTime() - now.getTime()) / 60_000));
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  if (hours === 0) {
    return `${mins} мин`;
  }
  return mins === 0 ? `${hours} ч` : `${hours} ч ${mins} мин`;
}
