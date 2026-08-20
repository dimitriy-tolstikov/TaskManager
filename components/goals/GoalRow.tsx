"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { GoalDto } from "@/lib/apiClient";
import { formatDaysOfWeek, formatTimeRange } from "@/lib/goalFormat";

interface GoalRowProps {
  goal: GoalDto;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: (active: boolean) => void;
}

function targetsSummary(goal: GoalDto): string {
  return goal.targets
    .map((target) => `${target.project?.name ?? target.area?.name ?? "—"}: ${target.requiredCount}`)
    .join(", ");
}

export function GoalRow({ goal, onEdit, onDelete, onToggleActive }: GoalRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border p-3">
      <Checkbox
        aria-label="Активна"
        checked={goal.active}
        onCheckedChange={(checked) => onToggleActive(checked === true)}
      />
      <div className="flex-1">
        <p className="text-sm font-medium">{goal.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatTimeRange(goal.startTime, goal.endTime)} · {formatDaysOfWeek(goal.daysOfWeek)} ·{" "}
          {targetsSummary(goal)}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onEdit}>
        Изменить
      </Button>
      <Button variant="destructive" size="sm" onClick={onDelete}>
        Удалить
      </Button>
    </div>
  );
}
