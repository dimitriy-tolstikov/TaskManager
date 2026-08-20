import { describe, expect, it } from "vitest";

import {
  formatDaysOfWeek,
  formatMinutes,
  formatRemaining,
  formatTimeRange,
  minutesToTimeInput,
  timeInputToMinutes,
} from "@/lib/goalFormat";

describe("goalFormat", () => {
  it("formats minutes as HH:MM with padding", () => {
    expect(formatMinutes(360)).toBe("06:00");
    expect(formatMinutes(545)).toBe("09:05");
  });

  it("formats a window as a time range", () => {
    expect(formatTimeRange(360, 540)).toBe("06:00–09:00");
  });

  it("labels an empty schedule as daily", () => {
    expect(formatDaysOfWeek([])).toBe("Ежедневно");
    expect(formatDaysOfWeek([0, 1, 2, 3, 4, 5, 6])).toBe("Ежедневно");
  });

  it("lists selected days starting from Monday", () => {
    expect(formatDaysOfWeek([5, 1, 3])).toBe("Пн, Ср, Пт");
    expect(formatDaysOfWeek([0])).toBe("Вс");
  });

  it("converts between time input value and minutes", () => {
    expect(timeInputToMinutes("06:30")).toBe(390);
    expect(minutesToTimeInput(390)).toBe("06:30");
  });

  it("formats remaining time in hours and minutes", () => {
    const now = new Date("2026-08-19T07:00:00Z");
    expect(formatRemaining("2026-08-19T08:20:00Z", now)).toBe("1 ч 20 мин");
    expect(formatRemaining("2026-08-19T07:45:00Z", now)).toBe("45 мин");
    expect(formatRemaining("2026-08-19T09:00:00Z", now)).toBe("2 ч");
    expect(formatRemaining("2026-08-19T06:00:00Z", now)).toBe("0 мин");
  });
});
