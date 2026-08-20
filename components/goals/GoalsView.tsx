"use client";

import { useState } from "react";

import { GoalDialog } from "@/components/goals/GoalDialog";
import { GoalRow } from "@/components/goals/GoalRow";
import { Button } from "@/components/ui/button";
import { deleteGoal, updateGoal, type AreaDto, type GoalDto } from "@/lib/apiClient";
import { useGoals } from "@/lib/hooks/useGoals";

interface GoalsViewProps {
  areas: AreaDto[];
  onDashboardRefresh: () => Promise<void>;
}

type DialogState = { goal: GoalDto | null } | null;

export function GoalsView({ areas, onDashboardRefresh }: GoalsViewProps) {
  const { goals, isLoading, refresh } = useGoals();
  const [dialog, setDialog] = useState<DialogState>(null);

  async function handleChanged() {
    await Promise.all([refresh(), onDashboardRefresh()]);
  }

  async function handleToggleActive(goal: GoalDto, active: boolean) {
    await updateGoal(goal.id, { active });
    await handleChanged();
  }

  async function handleDelete(goal: GoalDto) {
    if (!window.confirm(`Удалить цель «${goal.name}»?`)) {
      return;
    }
    await deleteGoal(goal.id);
    await handleChanged();
  }

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Загрузка…</p>;
  }

  return (
    <div className="space-y-3">
      <div>
        <Button onClick={() => setDialog({ goal: null })}>+ Цель</Button>
      </div>
      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground">Целей пока нет</p>
      ) : (
        goals.map((goal) => (
          <GoalRow
            key={goal.id}
            goal={goal}
            onEdit={() => setDialog({ goal })}
            onDelete={() => void handleDelete(goal)}
            onToggleActive={(active) => void handleToggleActive(goal, active)}
          />
        ))
      )}
      {dialog && (
        <GoalDialog
          goal={dialog.goal}
          areas={areas}
          onClose={() => setDialog(null)}
          onSaved={handleChanged}
        />
      )}
    </div>
  );
}
