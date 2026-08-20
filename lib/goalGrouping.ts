// Pure grouping helpers for goals dashboard: easy to unit test, no React.

import type { GoalDashboardEntryDto } from "@/lib/apiClient";

export interface OverdueGoalGroup {
  latest: GoalDashboardEntryDto;
  instanceIds: string[];
  missedCount: number;
}

// One recurring goal can pile up several overdue windows; show one card per goal.
export function groupOverdueGoals(entries: GoalDashboardEntryDto[]): OverdueGoalGroup[] {
  const byGoal = new Map<string, GoalDashboardEntryDto[]>();
  for (const entry of entries) {
    const list = byGoal.get(entry.goalId) ?? [];
    list.push(entry);
    byGoal.set(entry.goalId, list);
  }
  return [...byGoal.values()].map((group) => {
    const sorted = [...group].sort((a, b) => b.windowEnd.localeCompare(a.windowEnd));
    return {
      latest: sorted[0],
      instanceIds: sorted.map((entry) => entry.instanceId),
      missedCount: sorted.length,
    };
  });
}
