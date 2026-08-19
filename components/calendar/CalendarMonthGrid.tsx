"use client";

import { CalendarDayCell } from "@/components/calendar/CalendarDayCell";
import type { TaskDto } from "@/lib/apiClient";
import { getMonthGridDays, tasksForDay, WEEKDAY_LABELS } from "@/lib/calendarUtils";

interface CalendarMonthGridProps {
  anchor: Date;
  tasks: TaskDto[];
  areaColors: Map<string, string>;
  onOpen: (task: TaskDto) => void;
}

export function CalendarMonthGrid({ anchor, tasks, areaColors, onOpen }: CalendarMonthGridProps) {
  const days = getMonthGridDays(anchor);

  return (
    <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-border">
      {WEEKDAY_LABELS.map((label) => (
        <div
          key={label}
          className="border-r border-b border-border bg-muted/50 px-1 py-1 text-center text-xs font-medium text-muted-foreground"
        >
          {label}
        </div>
      ))}
      {days.map((day) => (
        <CalendarDayCell
          key={day.toISOString()}
          day={day}
          tasks={tasksForDay(tasks, day)}
          areaColors={areaColors}
          isOutsideMonth={day.getMonth() !== anchor.getMonth()}
          className="min-h-24"
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
