"use client";

import { useCallback, useEffect, useState } from "react";

import { CalendarView } from "@/components/calendar/CalendarView";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { QuickAdd } from "@/components/tasks/QuickAdd";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { TaskFiltersPanel } from "@/components/tasks/TaskFiltersPanel";
import { TaskList } from "@/components/tasks/TaskList";
import { ViewTabs, type TaskView } from "@/components/tasks/ViewTabs";
import { TodayView } from "@/components/today/TodayView";
import { listTags, type AreaDto, type TagDto, type TaskFilterState } from "@/lib/apiClient";
import {
  calendarRangeFilters,
  initialCalendarState,
  type CalendarState,
} from "@/lib/calendarUtils";
import { useAreas } from "@/lib/hooks/useAreas";
import { useTaskActions } from "@/lib/hooks/useTaskActions";
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
// The Calendar view additionally limits tasks to the visible date range.
function scopedFilters(
  view: TaskView,
  filters: TaskFilterState,
  calendar: CalendarState,
): TaskFilterState {
  if (view === "today") {
    return { ...filters, status: undefined, overdue: undefined };
  }
  if (view === "calendar") {
    return { ...filters, ...calendarRangeFilters(calendar) };
  }
  return filters;
}

export function TasksApp({ userEmail }: { userEmail: string }) {
  const { areas, refresh: refreshAreas } = useAreas();
  const [filters, setFilters] = useState<TaskFilterState>({});
  const [view, setView] = useState<TaskView>("list");
  const [calendar, setCalendar] = useState<CalendarState>(initialCalendarState);
  const {
    tasks,
    isLoading,
    refresh: refreshTasks,
    setTasks,
  } = useTasks(scopedFilters(view, filters, calendar));
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

  const { actions, onQuickAdd, onStatusChange, onMoveToDay } = useTaskActions({
    tasks,
    filters,
    setTasks,
    refreshTasks,
    refreshData,
    onOpen: (task) => setSelectedTaskId(task.id),
  });

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
        <QuickAdd onAdd={onQuickAdd} />
        {view !== "today" && (
          <TaskFiltersPanel filters={filters} tags={tags} onChange={setFilters} />
        )}
        {view === "list" && <TaskList tasks={tasks} isLoading={isLoading} {...actions} />}
        {view === "kanban" && (
          <KanbanBoard
            tasks={tasks}
            isLoading={isLoading}
            onStatusChange={onStatusChange}
            onOpen={actions.onOpen}
          />
        )}
        {view === "today" && (
          <TodayView tasks={tasks} areas={areas} isLoading={isLoading} actions={actions} />
        )}
        {view === "calendar" && (
          <CalendarView
            tasks={tasks}
            areas={areas}
            isLoading={isLoading}
            state={calendar}
            onStateChange={setCalendar}
            actions={{ onOpen: actions.onOpen, onMove: onMoveToDay }}
          />
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
