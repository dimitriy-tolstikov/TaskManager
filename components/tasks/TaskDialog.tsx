"use client";

import { TaskDialogBody } from "@/components/tasks/TaskDialogBody";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AreaDto, TaskDto } from "@/lib/apiClient";

interface TaskDialogProps {
  task: TaskDto | null;
  areas: AreaDto[];
  onClose: () => void;
  onChanged: () => Promise<void>;
}

export function TaskDialog({ task, areas, onClose, onChanged }: TaskDialogProps) {
  return (
    <Dialog open={task !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Задача</DialogTitle>
        </DialogHeader>
        {task && (
          <TaskDialogBody
            key={task.id}
            task={task}
            areas={areas}
            onClose={onClose}
            onChanged={onChanged}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
