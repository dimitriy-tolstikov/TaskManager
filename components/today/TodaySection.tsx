"use client";

import { TaskRow, type TaskActions } from "@/components/tasks/TaskRow";
import type { TaskDto } from "@/lib/apiClient";
import { cn } from "@/lib/utils";

interface TodaySectionProps {
  title: string;
  tasks: TaskDto[];
  actions: TaskActions;
  titleClassName?: string;
  areaColor?: (task: TaskDto) => string | undefined;
}

export function TodaySection({
  title,
  tasks,
  actions,
  titleClassName,
  areaColor,
}: TodaySectionProps) {
  return (
    <section>
      <h2 className={cn("mb-2 text-sm font-medium", titleClassName)}>
        {title} <span className="text-muted-foreground">({tasks.length})</span>
      </h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Нет задач</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} areaColor={areaColor?.(task)} {...actions} />
          ))}
        </div>
      )}
    </section>
  );
}
