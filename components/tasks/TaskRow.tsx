"use client";

import { MoreHorizontal, Repeat } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TaskDto } from "@/lib/apiClient";
import { formatDueDate, isOverdue, PRIORITY_LABELS } from "@/lib/taskUtils";
import { cn } from "@/lib/utils";

export interface TaskActions {
  onToggle: (task: TaskDto) => void;
  onOpen: (task: TaskDto) => void;
  onDelete: (task: TaskDto) => void;
}

interface TaskRowProps extends TaskActions {
  task: TaskDto;
  areaColor?: string;
}

const priorityVariant = { LOW: "outline", MED: "secondary", HIGH: "destructive" } as const;

export function TaskRow({ task, areaColor, onToggle, onOpen, onDelete }: TaskRowProps) {
  const isDone = task.status === "DONE";
  const doneSubtasks = task.subtasks.filter((subtask) => subtask.done).length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task)}
      onKeyDown={(event) => event.key === "Enter" && onOpen(task)}
      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 hover:bg-muted/50"
    >
      <span onClick={(event) => event.stopPropagation()}>
        <Checkbox
          checked={isDone}
          onCheckedChange={() => onToggle(task)}
          aria-label="Отметить выполненной"
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-sm", isDone && "text-muted-foreground line-through")}>
          {task.title}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {areaColor && (
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: areaColor }} />
          )}
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
          {task.recurrence && (
            <Repeat className="size-3.5 shrink-0" aria-label="Повторяющаяся задача" />
          )}
        </div>
      </div>
      {task.tags.map(({ tag }) => (
        <Badge key={tag.id} variant="outline">
          {tag.name}
        </Badge>
      ))}
      <Badge variant={priorityVariant[task.priority]}>{PRIORITY_LABELS[task.priority]}</Badge>
      <span onClick={(event) => event.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-xs" aria-label="Меню задачи" />}
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(task)}>
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </span>
    </div>
  );
}
