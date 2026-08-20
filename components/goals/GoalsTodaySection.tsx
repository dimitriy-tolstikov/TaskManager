"use client";

import { GoalEntryCard } from "@/components/goals/GoalEntryCard";
import type { GoalsDashboardDto } from "@/lib/apiClient";

interface GoalsTodaySectionProps {
  dashboard: GoalsDashboardDto;
  onAck: (instanceId: string) => void;
}

export function GoalsTodaySection({ dashboard, onAck }: GoalsTodaySectionProps) {
  const count =
    dashboard.current.length + dashboard.overdue.length + dashboard.upcomingToday.length;
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
        {dashboard.overdue.map((entry) => (
          <GoalEntryCard
            key={entry.instanceId}
            entry={entry}
            variant="overdue"
            onAck={() => onAck(entry.instanceId)}
          />
        ))}
        {dashboard.upcomingToday.map((entry) => (
          <GoalEntryCard key={entry.instanceId} entry={entry} variant="upcoming" />
        ))}
      </div>
    </section>
  );
}
