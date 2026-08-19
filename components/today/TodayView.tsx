"use client";

import { type TaskActions } from "@/components/tasks/TaskRow";
import { TodaySection } from "@/components/today/TodaySection";
import type { AreaDto, TaskDto } from "@/lib/apiClient";
import { splitTodayTasks } from "@/lib/todayUtils";

interface TodayViewProps {
  tasks: TaskDto[];
  areas: AreaDto[];
  isLoading: boolean;
  actions: TaskActions;
}

export function TodayView({ tasks, areas, isLoading, actions }: TodayViewProps) {
  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Загрузка…</p>;
  }
  const sections = splitTodayTasks(tasks, new Date());
  const colorByAreaId = new Map(areas.map((area) => [area.id, area.color]));
  const areaColor = (task: TaskDto) => colorByAreaId.get(task.project.areaId);

  return (
    <div className="space-y-6">
      <TodaySection
        title="Просроченные"
        titleClassName="text-destructive"
        tasks={sections.overdue}
        actions={actions}
        areaColor={areaColor}
      />
      <TodaySection
        title="Сегодня"
        tasks={sections.dueToday}
        actions={actions}
        areaColor={areaColor}
      />
      <TodaySection
        title="В работе без срока"
        tasks={sections.inProgressWithoutDue}
        actions={actions}
        areaColor={areaColor}
      />
    </div>
  );
}
