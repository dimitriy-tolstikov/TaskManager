"use client";

import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

import { CalendarMonthGrid } from "@/components/calendar/CalendarMonthGrid";
import { CalendarWeekGrid } from "@/components/calendar/CalendarWeekGrid";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AreaDto, TaskDto } from "@/lib/apiClient";
import {
  formatPeriodTitle,
  parseDayKey,
  shiftCalendar,
  todayCalendar,
  type CalendarMode,
  type CalendarState,
} from "@/lib/calendarUtils";

interface CalendarActions {
  onOpen: (task: TaskDto) => void;
  onMove: (task: TaskDto, day: Date) => void;
}

interface CalendarViewProps {
  tasks: TaskDto[];
  areas: AreaDto[];
  isLoading: boolean;
  state: CalendarState;
  onStateChange: (state: CalendarState) => void;
  actions: CalendarActions;
}

export function CalendarView({
  tasks,
  areas,
  isLoading,
  state,
  onStateChange,
  actions,
}: CalendarViewProps) {
  // The distance constraint keeps plain clicks free for opening the task dialog.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const areaColors = useMemo(
    () => new Map(areas.map((area): [string, string] => [area.id, area.color])),
    [areas],
  );

  function handleDragEnd(event: DragEndEvent) {
    const overId = String(event.over?.id ?? "");
    const task = tasks.find((item) => `cal:${item.id}` === event.active.id);
    if (task && overId.startsWith("day:")) {
      actions.onMove(task, parseDayKey(overId.slice(4)));
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Предыдущий период"
            onClick={() => onStateChange(shiftCalendar(state, -1))}
          >
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onStateChange(todayCalendar(state))}>
            Сегодня
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Следующий период"
            onClick={() => onStateChange(shiftCalendar(state, 1))}
          >
            <ChevronRight />
          </Button>
          <h2 className="ml-2 text-sm font-medium">{formatPeriodTitle(state)}</h2>
        </div>
        <Tabs
          value={state.mode}
          onValueChange={(mode) => onStateChange({ ...state, mode: mode as CalendarMode })}
        >
          <TabsList>
            <TabsTrigger value="week">Неделя</TabsTrigger>
            <TabsTrigger value="month">Месяц</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Загрузка…</p>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {state.mode === "week" ? (
            <CalendarWeekGrid
              anchor={state.anchor}
              tasks={tasks}
              areaColors={areaColors}
              onOpen={actions.onOpen}
            />
          ) : (
            <CalendarMonthGrid
              anchor={state.anchor}
              tasks={tasks}
              areaColors={areaColors}
              onOpen={actions.onOpen}
            />
          )}
        </DndContext>
      )}
    </div>
  );
}
