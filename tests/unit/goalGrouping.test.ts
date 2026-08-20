import { describe, expect, it } from "vitest";

import type { GoalDashboardEntryDto } from "@/lib/apiClient";
import { groupOverdueGoals } from "@/lib/goalGrouping";

function entry(goalId: string, instanceId: string, windowEnd: string): GoalDashboardEntryDto {
  return { instanceId, goalId, goalName: "Цель", windowStart: windowEnd, windowEnd, targets: [] };
}

describe("groupOverdueGoals", () => {
  it("groups windows of the same goal, latest first", () => {
    const groups = groupOverdueGoals([
      entry("g1", "i1", "2026-08-18T09:00:00"),
      entry("g1", "i2", "2026-08-19T09:00:00"),
      entry("g2", "i3", "2026-08-19T10:00:00"),
    ]);
    expect(groups).toHaveLength(2);
    const g1 = groups.find((g) => g.latest.goalId === "g1");
    expect(g1?.missedCount).toBe(2);
    expect(g1?.latest.instanceId).toBe("i2");
    expect(g1?.instanceIds).toEqual(["i2", "i1"]);
  });

  it("returns empty array for no entries", () => {
    expect(groupOverdueGoals([])).toEqual([]);
  });
});
