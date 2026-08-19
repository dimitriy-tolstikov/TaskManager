import type { TaskPriority, TaskStatus } from "@prisma/client";

import type { TaskDto } from "@/lib/apiClient";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  BACKLOG: "Бэклог",
  TODO: "Сделать",
  IN_PROGRESS: "В работе",
  DONE: "Готово",
  CANCELLED: "Отменено",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Низкий",
  MED: "Средний",
  HIGH: "Высокий",
};

export function isOverdue(task: Pick<TaskDto, "dueAt" | "status">): boolean {
  if (!task.dueAt || task.status === "DONE" || task.status === "CANCELLED") {
    return false;
  }
  return new Date(task.dueAt).getTime() < Date.now();
}

export function formatDueDate(dueAt: string): string {
  return new Date(dueAt).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Converts an ISO string to the `YYYY-MM-DDTHH:mm` value of a datetime-local input. */
export function toLocalInputValue(iso: string | null): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
