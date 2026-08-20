"use client";

import { useState } from "react";

import { GoalDaysPicker } from "@/components/goals/GoalDaysPicker";
import { GoalTargetRow, type GoalTargetForm } from "@/components/goals/GoalTargetRow";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createGoal,
  updateGoal,
  type AreaDto,
  type GoalDto,
  type GoalPayload,
} from "@/lib/apiClient";
import { minutesToTimeInput, timeInputToMinutes } from "@/lib/goalFormat";

interface GoalDialogBodyProps {
  goal: GoalDto | null;
  areas: AreaDto[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}

interface GoalFormState {
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  targets: GoalTargetForm[];
}

function toFormState(goal: GoalDto | null): GoalFormState {
  return {
    name: goal?.name ?? "",
    startTime: goal ? minutesToTimeInput(goal.startTime) : "06:00",
    endTime: goal ? minutesToTimeInput(goal.endTime) : "09:00",
    daysOfWeek: goal?.daysOfWeek ?? [],
    targets: (goal?.targets ?? []).map((target) => ({
      scope: target.areaId ? `area:${target.areaId}` : `project:${target.projectId}`,
      requiredCount: String(target.requiredCount),
    })),
  };
}

function toPayload(form: GoalFormState): GoalPayload {
  return {
    name: form.name.trim(),
    startTime: timeInputToMinutes(form.startTime),
    endTime: timeInputToMinutes(form.endTime),
    daysOfWeek: form.daysOfWeek,
    targets: form.targets.map((target) => {
      const [kind, id] = target.scope.split(":");
      return {
        ...(kind === "area" ? { areaId: id } : { projectId: id }),
        requiredCount: Number(target.requiredCount) || 1,
      };
    }),
  };
}

export function GoalDialogBody({ goal, areas, onClose, onSaved }: GoalDialogBodyProps) {
  const [form, setForm] = useState<GoalFormState>(() => toFormState(goal));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function patch(update: Partial<GoalFormState>) {
    setForm((prev) => ({ ...prev, ...update }));
  }

  function patchTarget(index: number, update: GoalTargetForm) {
    patch({ targets: form.targets.map((item, i) => (i === index ? update : item)) });
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      const payload = toPayload(form);
      if (goal) {
        await updateGoal(goal.id, payload);
      } else {
        await createGoal(payload);
      }
      await onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Что-то пошло не так");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Название</Label>
        <Input value={form.name} onChange={(e) => patch({ name: e.target.value })} />
      </div>
      <div className="flex gap-3">
        <div className="flex-1 space-y-1.5">
          <Label>Начало</Label>
          <Input
            type="time"
            value={form.startTime}
            onChange={(e) => patch({ startTime: e.target.value })}
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <Label>Конец</Label>
          <Input
            type="time"
            value={form.endTime}
            onChange={(e) => patch({ endTime: e.target.value })}
          />
        </div>
      </div>
      <GoalDaysPicker value={form.daysOfWeek} onChange={(daysOfWeek) => patch({ daysOfWeek })} />
      <div className="space-y-2">
        <Label>Таргеты</Label>
        {form.targets.map((target, index) => (
          <GoalTargetRow
            key={index}
            value={target}
            areas={areas}
            onChange={(update) => patchTarget(index, update)}
            onRemove={() => patch({ targets: form.targets.filter((_, i) => i !== index) })}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => patch({ targets: [...form.targets, { scope: "", requiredCount: "1" }] })}
        >
          + Таргет
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Отмена
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !form.name.trim()}>
          Сохранить
        </Button>
      </DialogFooter>
    </div>
  );
}
