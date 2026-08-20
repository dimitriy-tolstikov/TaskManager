"use client";

import { GoalDialogBody } from "@/components/goals/GoalDialogBody";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AreaDto, GoalDto } from "@/lib/apiClient";

interface GoalDialogProps {
  goal: GoalDto | null;
  areas: AreaDto[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export function GoalDialog({ goal, areas, onClose, onSaved }: GoalDialogProps) {
  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{goal ? "Редактировать цель" : "Новая цель"}</DialogTitle>
        </DialogHeader>
        <GoalDialogBody
          key={goal?.id ?? "new"}
          goal={goal}
          areas={areas}
          onClose={onClose}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}
