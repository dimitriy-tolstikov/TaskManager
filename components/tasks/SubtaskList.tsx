"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { addSubtask, deleteSubtask, updateSubtask, type TaskDto } from "@/lib/apiClient";
import { cn } from "@/lib/utils";

interface SubtaskListProps {
  task: TaskDto;
  onChanged: () => Promise<void>;
}

export function SubtaskList({ task, onChanged }: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState("");

  async function handleAdd() {
    if (!newTitle.trim()) {
      return;
    }
    await addSubtask(task.id, newTitle.trim());
    setNewTitle("");
    await onChanged();
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Подзадачи</p>
      {task.subtasks.map((subtask) => (
        <div key={subtask.id} className="flex items-center gap-2">
          <Checkbox
            checked={subtask.done}
            onCheckedChange={async (checked) => {
              await updateSubtask(subtask.id, { done: checked === true });
              await onChanged();
            }}
            aria-label={`Подзадача ${subtask.title}`}
          />
          <span className={cn("flex-1 text-sm", subtask.done && "line-through opacity-60")}>
            {subtask.title}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Удалить подзадачу"
            onClick={async () => {
              await deleteSubtask(subtask.id);
              await onChanged();
            }}
          >
            <X />
          </Button>
        </div>
      ))}
      <Input
        value={newTitle}
        onChange={(event) => setNewTitle(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && void handleAdd()}
        placeholder="Добавить подзадачу… (Enter)"
        aria-label="Новая подзадача"
      />
    </div>
  );
}
