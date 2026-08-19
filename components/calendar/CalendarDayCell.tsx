"use client";

import { useDroppable } from "@dnd-kit/core";

import { CalendarTaskChip } from "@/components/calendar/CalendarTaskChip";
import type { TaskDto } from "@/lib/apiClient";
import { dayKey, isSameDay } from "@/lib/calendarUtils";
import { cn } from "@/lib/utils";

interface CalendarDayCellProps {
  day: Date;
  tasks: TaskDto[];
  areaColors: Map<string, string>;
  isOutsideMonth?: boolean;
  className?: string;
  onOpen: (task: TaskDto) => void;
}

export function CalendarDayCell({
  day,
  tasks,
  areaColors,
  isOutsideMonth,
  className,
  onOpen,
}: CalendarDayCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${dayKey(day)}` });
  const isToday = isSameDay(day, new Date());

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-0.5 border-r border-b border-border p-1",
        isOutsideMonth && "bg-muted/40 text-muted-foreground",
        isOver && "bg-accent",
        className,
      )}
    >
      <div className={cn("text-right text-xs", isToday && "font-bold text-primary")}>
        {day.getDate()}
      </div>
      {tasks.map((task) => (
        <CalendarTaskChip
          key={task.id}
          task={task}
          color={areaColors.get(task.project.areaId)}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
