"use client";

import { GoalEntryCard } from "@/components/goals/GoalEntryCard";
import type { GoalsDashboardDto } from "@/lib/apiClient";
import { groupOverdueGoals } from "@/lib/goalGrouping";

interface GoalsTodaySectionProps {
  dashboard: GoalsDashboardDto;
  onAck: (instanceId: string) => void;
}

export function GoalsTodaySection({ dashboard, onAck }: GoalsTodaySectionProps) {
  const overdueGroups = groupOverdueGoals(dashboard.overdue);
  const count = dashboard.current.length + overdueGroups.length + dashboard.upcomingToday.length;
  if (count === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="mb-2 text-sm font-medium">
        Цели <span className="text-muted-foreground">({count})</span>
      </h2>
      <div className="space-y-2">
        {dashboard.current.map((entry) => (
          <GoalEntryCard key={entry.instanceId} entry={entry} variant="current" />
        ))}
        {overdueGroups.map((group) => (
          <GoalEntryCard
            key={group.latest.goalId}
            entry={group.latest}
            variant="overdue"
            missedCount={group.missedCount}
            onAck={() => group.instanceIds.forEach((id) => onAck(id))}
          />
        ))}
        {dashboard.upcomingToday.map((entry) => (
          <GoalEntryCard key={entry.instanceId} entry={entry} variant="upcoming" />
        ))}
      </div>
    </section>
  );
}
