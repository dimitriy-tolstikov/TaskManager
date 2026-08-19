"use client";

import { useDraggable } from "@dnd-kit/core";
import { Repeat } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { TaskDto } from "@/lib/apiClient";
import { formatDueDate, isOverdue, PRIORITY_LABELS } from "@/lib/taskUtils";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  task: TaskDto;
  onOpen: (task: TaskDto) => void;
}

const priorityVariant = { LOW: "outline", MED: "secondary", HIGH: "destructive" } as const;

export function KanbanCard({ task, onOpen }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });
  const doneSubtasks = task.subtasks.filter((subtask) => subtask.done).length;
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task)}
      onKeyDown={(event) => event.key === "Enter" && onOpen(task)}
      className={cn(
        "cursor-grab rounded-lg border border-border bg-card p-2 text-sm shadow-sm hover:bg-muted/50",
        isDragging && "z-10 opacity-70",
      )}
    >
      <div className="leading-snug font-medium">{task.title}</div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span>{task.project.name}</span>
        {task.subtasks.length > 0 && (
          <span>
            · {doneSubtasks}/{task.subtasks.length}
          </span>
        )}
        {task.dueAt && (
          <span className={cn(isOverdue(task) && "font-medium text-destructive")}>
            · {formatDueDate(task.dueAt)}
          </span>
        )}
        {task.recurrence && <Repeat className="size-3.5" aria-label="Повторяющаяся задача" />}
      </div>
      <div className="mt-1.5">
        <Badge variant={priorityVariant[task.priority]}>{PRIORITY_LABELS[task.priority]}</Badge>
      </div>
    </div>
  );
}
