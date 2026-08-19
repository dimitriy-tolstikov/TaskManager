"use client";

import type { TaskStatus } from "@prisma/client";

import type { TaskActions } from "@/components/tasks/TaskRow";
import {
  createTask,
  deleteTask,
  updateTask,
  type TaskDto,
  type TaskFilterState,
} from "@/lib/apiClient";
import { moveToDay } from "@/lib/calendarUtils";

interface TaskActionsDeps {
  tasks: TaskDto[];
  filters: TaskFilterState;
  setTasks: (tasks: TaskDto[]) => void;
  refreshTasks: () => Promise<void>;
  refreshData: () => Promise<void>;
  onOpen: (task: TaskDto) => void;
}

interface TaskViewActions {
  actions: TaskActions;
  onQuickAdd: (title: string) => Promise<void>;
  onStatusChange: (task: TaskDto, status: TaskStatus) => void;
  onMoveToDay: (task: TaskDto, day: Date) => void;
}

// Optimistic update; rolls back to the previous state on failure.
async function applyOptimistic(
  tasks: TaskDto[],
  setTasks: (tasks: TaskDto[]) => void,
  taskId: string,
  patch: Partial<TaskDto>,
  update: () => Promise<unknown>,
) {
  setTasks(tasks.map((item) => (item.id === taskId ? { ...item, ...patch } : item)));
  try {
    await update();
  } catch (error) {
    setTasks(tasks);
    window.alert(error instanceof Error ? error.message : "Что-то пошло не так");
  }
}

/** Task mutations shared by the list/kanban/today/calendar views. */
export function useTaskActions({
  tasks,
  filters,
  setTasks,
  refreshTasks,
  refreshData,
  onOpen,
}: TaskActionsDeps): TaskViewActions {
  async function handleQuickAdd(title: string) {
    await createTask({ title, projectId: filters.projectId, areaId: filters.areaId });
    await refreshData();
  }

  async function handleToggle(task: TaskDto) {
    await updateTask(task.id, { status: task.status === "DONE" ? "TODO" : "DONE" });
    await refreshTasks();
  }

  async function handleDelete(task: TaskDto) {
    if (window.confirm(`Удалить задачу «${task.title}»?`)) {
      await deleteTask(task.id);
      await refreshData();
    }
  }

  function handleStatusChange(task: TaskDto, status: TaskStatus) {
    void applyOptimistic(tasks, setTasks, task.id, { status }, () =>
      updateTask(task.id, { status }),
    );
  }

  function handleMoveToDay(task: TaskDto, day: Date) {
    const dueAt = moveToDay(task.dueAt, day);
    void applyOptimistic(tasks, setTasks, task.id, { dueAt }, () => updateTask(task.id, { dueAt }));
  }

  return {
    actions: {
      onToggle: (task) => void handleToggle(task),
      onOpen,
      onDelete: (task) => void handleDelete(task),
    },
    onQuickAdd: handleQuickAdd,
    onStatusChange: handleStatusChange,
    onMoveToDay: handleMoveToDay,
  };
}
