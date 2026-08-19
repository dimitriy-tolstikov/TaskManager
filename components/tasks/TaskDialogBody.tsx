"use client";

import { useState } from "react";

import { SubtaskList } from "@/components/tasks/SubtaskList";
import { TaskFormFields, type TaskFormState } from "@/components/tasks/TaskFormFields";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { deleteTask, updateTask, type AreaDto, type TaskDto } from "@/lib/apiClient";
import { toLocalInputValue } from "@/lib/taskUtils";

interface TaskDialogBodyProps {
  task: TaskDto;
  areas: AreaDto[];
  onClose: () => void;
  onChanged: () => Promise<void>;
}

function toFormState(task: TaskDto): TaskFormState {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    projectId: task.projectId,
    dueAt: toLocalInputValue(task.dueAt),
    estimateMin: task.estimateMin === null ? "" : String(task.estimateMin),
    tags: task.tags.map(({ tag }) => tag.name).join(", "),
  };
}

export function TaskDialogBody({ task, areas, onClose, onChanged }: TaskDialogBodyProps) {
  const [form, setForm] = useState<TaskFormState>(() => toFormState(task));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function patch(update: Partial<TaskFormState>) {
    setForm((prev) => ({ ...prev, ...update }));
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      await updateTask(task.id, {
        title: form.title.trim(),
        description: form.description,
        status: form.status,
        priority: form.priority,
        projectId: form.projectId,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
        estimateMin: form.estimateMin ? Number(form.estimateMin) : null,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      await onChanged();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Что-то пошло не так");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Удалить задачу «${task.title}»?`)) {
      return;
    }
    await deleteTask(task.id);
    await onChanged();
    onClose();
  }

  return (
    <div className="space-y-4">
      <TaskFormFields value={form} areas={areas} onChange={patch} />
      <SubtaskList task={task} onChanged={onChanged} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button variant="destructive" onClick={handleDelete}>
          Удалить
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !form.title.trim()}>
          Сохранить
        </Button>
      </DialogFooter>
    </div>
  );
}
