"use client";

import { useDraggable } from "@dnd-kit/core";
import { Repeat } from "lucide-react";

import type { TaskDto } from "@/lib/apiClient";
import { cn } from "@/lib/utils";

interface CalendarTaskChipProps {
  task: TaskDto;
  color?: string;
  onOpen: (task: TaskDto) => void;
}

export function CalendarTaskChip({ task, color, onOpen }: CalendarTaskChipProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `cal:${task.id}`,
  });
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
        "flex cursor-grab items-center gap-1 rounded px-1 py-0.5 text-xs hover:bg-muted",
        isDragging && "z-10 bg-card opacity-80 shadow",
      )}
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: color ?? "var(--muted-foreground)" }}
      />
      <span
        className={cn("truncate", task.status === "DONE" && "text-muted-foreground line-through")}
      >
        {task.title}
      </span>
      {task.recurrence && (
        <Repeat
          className="size-3 shrink-0 text-muted-foreground"
          aria-label="Повторяющаяся задача"
        />
      )}
    </div>
  );
}
