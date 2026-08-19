"use client";

import { useDroppable } from "@dnd-kit/core";
import type { TaskStatus } from "@prisma/client";

import { KanbanCard } from "@/components/kanban/KanbanCard";
import { Badge } from "@/components/ui/badge";
import type { TaskDto } from "@/lib/apiClient";
import { STATUS_LABELS } from "@/lib/taskUtils";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: TaskDto[];
  onOpen: (task: TaskDto) => void;
}

export function KanbanColumn({ status, tasks, onOpen }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-40 flex-col gap-2 rounded-lg bg-muted/40 p-2",
        isOver && "ring-2 ring-primary/40",
      )}
    >
      <header className="flex items-center justify-between px-1">
        <h2 className="text-sm font-medium">{STATUS_LABELS[status]}</h2>
        <Badge variant="secondary">{tasks.length}</Badge>
      </header>
      {tasks.length === 0 ? (
        <p className="px-1 py-4 text-center text-xs text-muted-foreground">Нет задач</p>
      ) : (
        tasks.map((task) => <KanbanCard key={task.id} task={task} onOpen={onOpen} />)
      )}
    </section>
  );
}
