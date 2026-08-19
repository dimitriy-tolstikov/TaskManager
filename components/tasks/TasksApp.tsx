"use client";

import { useCallback, useEffect, useState } from "react";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { QuickAdd } from "@/components/tasks/QuickAdd";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { TaskFiltersPanel } from "@/components/tasks/TaskFiltersPanel";
import { TaskList } from "@/components/tasks/TaskList";
import {
  createTask,
  deleteTask,
  listTags,
  updateTask,
  type TagDto,
  type TaskDto,
  type TaskFilterState,
} from "@/lib/apiClient";
import { useAreas } from "@/lib/hooks/useAreas";
import { useTasks } from "@/lib/hooks/useTasks";

export function TasksApp({ userEmail }: { userEmail: string }) {
  const { areas, refresh: refreshAreas } = useAreas();
  const [filters, setFilters] = useState<TaskFilterState>({});
  const { tasks, isLoading, refresh: refreshTasks } = useTasks(filters);
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
        <QuickAdd onAdd={handleQuickAdd} />
        <TaskFiltersPanel filters={filters} tags={tags} onChange={setFilters} />
        <TaskList
          tasks={tasks}
          isLoading={isLoading}
          onToggle={(task) => void handleToggle(task)}
          onOpen={(task) => setSelectedTaskId(task.id)}
          onDelete={(task) => void handleDelete(task)}
        />
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
