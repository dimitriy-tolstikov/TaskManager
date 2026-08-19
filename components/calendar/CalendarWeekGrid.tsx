"use client";

import { CalendarDayCell } from "@/components/calendar/CalendarDayCell";
import type { TaskDto } from "@/lib/apiClient";
import { getWeekDays, tasksForDay, WEEKDAY_LABELS } from "@/lib/calendarUtils";

interface CalendarWeekGridProps {
  anchor: Date;
  tasks: TaskDto[];
  areaColors: Map<string, string>;
  onOpen: (task: TaskDto) => void;
}

export function CalendarWeekGrid({ anchor, tasks, areaColors, onOpen }: CalendarWeekGridProps) {
  const days = getWeekDays(anchor);

  return (
    <div className="grid flex-1 grid-cols-7 overflow-hidden rounded-lg border border-border">
      {days.map((day, index) => (
        <div
          key={day.toISOString()}
          className="border-r border-b border-border bg-muted/50 px-1 py-1 text-center text-xs font-medium text-muted-foreground"
        >
          {WEEKDAY_LABELS[index]} {day.getDate()}
        </div>
      ))}
      {days.map((day) => (
        <CalendarDayCell
          key={day.toISOString()}
          day={day}
          tasks={tasksForDay(tasks, day)}
          areaColors={areaColors}
          className="min-h-48"
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
