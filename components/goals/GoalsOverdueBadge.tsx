"use client";

interface GoalsOverdueBadgeProps {
  count: number;
  onClick: () => void;
}

export function GoalsOverdueBadge({ count, onClick }: GoalsOverdueBadgeProps) {
  if (count === 0) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground"
    >
      Цели: {count}
    </button>
  );
}
