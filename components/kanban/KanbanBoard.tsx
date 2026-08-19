"use client";

import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import type { TaskStatus } from "@prisma/client";

import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import type { TaskDto } from "@/lib/apiClient";
import { KANBAN_COLUMNS } from "@/lib/taskUtils";

interface KanbanBoardProps {
  tasks: TaskDto[];
  isLoading: boolean;
  onStatusChange: (task: TaskDto, status: TaskStatus) => void;
  onOpen: (task: TaskDto) => void;
}

export function KanbanBoard({ tasks, isLoading, onStatusChange, onOpen }: KanbanBoardProps) {
  // The distance constraint keeps plain clicks free for opening the task dialog.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Загрузка…</p>;
  }

  function handleDragEnd(event: DragEndEvent) {
    const status = event.over?.id as TaskStatus | undefined;
    const task = tasks.find((item) => item.id === event.active.id);
    if (task && status && status !== task.status) {
      onStatusChange(task, status);
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid flex-1 grid-cols-2 gap-3 xl:grid-cols-4">
        {KANBAN_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasks.filter((task) => task.status === status)}
            onOpen={onOpen}
          />
        ))}
      </div>
    </DndContext>
  );
}
