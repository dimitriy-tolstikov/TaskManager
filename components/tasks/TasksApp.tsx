"use client";

import type { TaskStatus } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";

import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { QuickAdd } from "@/components/tasks/QuickAdd";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { TaskFiltersPanel } from "@/components/tasks/TaskFiltersPanel";
import { TaskList } from "@/components/tasks/TaskList";
import type { TaskActions } from "@/components/tasks/TaskRow";
import { ViewTabs, type TaskView } from "@/components/tasks/ViewTabs";
import { TodayView } from "@/components/today/TodayView";
import {
  createTask,
  deleteTask,
  listTags,
  updateTask,
  type AreaDto,
  type TagDto,
  type TaskDto,
  type TaskFilterState,
} from "@/lib/apiClient";
import { useAreas } from "@/lib/hooks/useAreas";
import { useTasks } from "@/lib/hooks/useTasks";

function viewHeading(areas: AreaDto[], filters: TaskFilterState): string {
  if (filters.projectId) {
    const area = areas.find((item) => item.id === filters.areaId);
    const project = area?.projects.find((item) => item.id === filters.projectId);
    return area && project ? `${area.name} / ${project.name}` : "Задачи";
  }
  if (filters.areaId) {
    return areas.find((item) => item.id === filters.areaId)?.name ?? "Задачи";
  }
  return "Все задачи";
}

// The Today view derives its sections from due dates, so the status/overdue
// panel filters would only break it; the rest (area, project, search) applies.
function todayFilters(filters: TaskFilterState): TaskFilterState {
  return { ...filters, status: undefined, overdue: undefined };
}

export function TasksApp({ userEmail }: { userEmail: string }) {
  const { areas, refresh: refreshAreas } = useAreas();
  const [filters, setFilters] = useState<TaskFilterState>({});
  const [view, setView] = useState<TaskView>("list");
  const effectiveFilters = view === "today" ? todayFilters(filters) : filters;
  const { tasks, isLoading, refresh: refreshTasks, setTasks } = useTasks(effectiveFilters);
  const [tags, setTags] = useState<TagDto[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  const refreshData = useCallback(async () => {
    await Promise.all([refreshAreas(), refreshTasks()]);
    setTags(await listTags());
  }, [refreshAreas, refreshTasks]);

  useEffect(() => {
    void listTags().then(setTags);
  }, []);

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

  async function handleStatusChange(task: TaskDto, status: TaskStatus) {
    // Optimistic column move; roll back to the previous state on failure.
    const previous = tasks;
    setTasks(tasks.map((item) => (item.id === task.id ? { ...item, status } : item)));
    try {
      await updateTask(task.id, { status });
    } catch (error) {
      setTasks(previous);
      window.alert(error instanceof Error ? error.message : "Что-то пошло не так");
    }
  }

  const actions: TaskActions = {
    onToggle: (task) => void handleToggle(task),
    onOpen: (task) => setSelectedTaskId(task.id),
    onDelete: (task) => void handleDelete(task),
  };

  return (
    <div className="flex">
      <AppSidebar
        areas={areas}
        filters={filters}
        userEmail={userEmail}
        onFiltersChange={setFilters}
        onDataChanged={refreshData}
      />
      <main className="flex h-screen flex-1 flex-col gap-3 overflow-y-auto p-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold">{viewHeading(areas, filters)}</h1>
          <ViewTabs view={view} onChange={setView} />
        </div>
        <QuickAdd onAdd={handleQuickAdd} />
        {view !== "today" && (
          <TaskFiltersPanel filters={filters} tags={tags} onChange={setFilters} />
        )}
        {view === "list" && <TaskList tasks={tasks} isLoading={isLoading} {...actions} />}
        {view === "kanban" && (
          <KanbanBoard
            tasks={tasks}
            isLoading={isLoading}
            onStatusChange={(task, status) => void handleStatusChange(task, status)}
            onOpen={actions.onOpen}
          />
        )}
        {view === "today" && (
          <TodayView tasks={tasks} areas={areas} isLoading={isLoading} actions={actions} />
        )}
      </main>
      <TaskDialog
        task={selectedTask}
        areas={areas}
        onClose={() => setSelectedTaskId(null)}
        onChanged={refreshData}
      />
    </div>
  );
}
