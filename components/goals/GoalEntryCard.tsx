"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GoalDashboardEntryDto } from "@/lib/apiClient";
import { formatClock, formatRemaining } from "@/lib/goalFormat";
import { cn } from "@/lib/utils";

interface GoalEntryCardProps {
  entry: GoalDashboardEntryDto;
  variant: "current" | "overdue" | "upcoming";
  onAck?: () => void;
}

function statusLine(entry: GoalDashboardEntryDto, variant: string): string {
  if (variant === "current") {
    return `Осталось ${formatRemaining(entry.windowEnd)}`;
  }
  if (variant === "upcoming") {
    return `Начнётся в ${formatClock(entry.windowStart)}`;
  }
  return `Окно ${formatClock(entry.windowStart)}–${formatClock(entry.windowEnd)}`;
}

export function GoalEntryCard({ entry, variant, onAck }: GoalEntryCardProps) {
  return (
    <div
      className={cn(
        "rounded-md border p-3",
        variant === "overdue" ? "border-destructive" : "border-border",
        variant === "upcoming" && "opacity-60",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            "text-sm font-medium",
            variant === "overdue" && "text-destructive",
            variant === "upcoming" && "text-muted-foreground",
          )}
        >
          {entry.goalName}
        </p>
        <span className="text-xs text-muted-foreground">{statusLine(entry, variant)}</span>
      </div>
      <div className="mt-2 space-y-1">
        {entry.targets.map((target) => (
          <div key={target.targetId} className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full", variant === "overdue" ? "bg-destructive" : "bg-primary")}
                style={{ width: `${Math.min(100, (target.done / target.required) * 100)}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
              {target.label} {target.done}/{target.required}
            </span>
          </div>
        ))}
      </div>
      {variant === "overdue" && onAck && (
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="destructive">Просрочена</Badge>
          <Button variant="outline" size="sm" onClick={onAck}>
            Закрыть
          </Button>
        </div>
      )}
    </div>
  );
}
