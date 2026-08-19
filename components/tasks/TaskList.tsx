"use client";

import { TaskRow } from "@/components/tasks/TaskRow";
import type { TaskDto } from "@/lib/apiClient";

interface TaskListProps {
  tasks: TaskDto[];
  isLoading: boolean;
  onToggle: (task: TaskDto) => void;
  onOpen: (task: TaskDto) => void;
  onDelete: (task: TaskDto) => void;
}

export function TaskList({ tasks, isLoading, onToggle, onOpen, onDelete }: TaskListProps) {
  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Загрузка…</p>;
  }
  if (tasks.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Задач нет — добавьте первую через строку выше
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          onToggle={onToggle}
          onOpen={onOpen}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
