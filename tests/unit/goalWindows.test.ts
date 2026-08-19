import { describe, expect, it } from "vitest";

import { buildWindow, listWindowsForRange, runsOnDay } from "@/lib/goalWindows";

describe("buildWindow", () => {
  it("builds a same-day window from minutes from midnight", () => {
    const window = buildWindow(new Date(2026, 7, 19), 360, 540);

    expect(window.start).toEqual(new Date(2026, 7, 19, 6, 0));
    expect(window.end).toEqual(new Date(2026, 7, 19, 9, 0));
  });

  it("rolls the end into the next day when the window crosses midnight", () => {
    const window = buildWindow(new Date(2026, 7, 19), 1320, 120);

    expect(window.start).toEqual(new Date(2026, 7, 19, 22, 0));
    expect(window.end).toEqual(new Date(2026, 7, 20, 2, 0));
  });
});

describe("runsOnDay", () => {
  it("treats an empty daysOfWeek as daily", () => {
    expect(runsOnDay([], new Date(2026, 7, 19))).toBe(true);
  });

  it("matches by JS getDay (0 = Sunday)", () => {
    const wednesday = new Date(2026, 7, 19);

    expect(runsOnDay([3], wednesday)).toBe(true);
    expect(runsOnDay([1, 2], wednesday)).toBe(false);
  });
});

describe("listWindowsForRange", () => {
  it("lists one window per day in the range", () => {
    const windows = listWindowsForRange(
      { startTime: 360, endTime: 540, daysOfWeek: [] },
      new Date(2026, 7, 17),
      new Date(2026, 7, 19, 23, 59),
    );

    expect(windows).toHaveLength(3);
    expect(windows[0].start).toEqual(new Date(2026, 7, 17, 6, 0));
    expect(windows[2].start).toEqual(new Date(2026, 7, 19, 6, 0));
  });

  it("skips days outside the schedule", () => {
    const windows = listWindowsForRange(
      { startTime: 360, endTime: 540, daysOfWeek: [1] },
      new Date(2026, 7, 16), // Sunday
      new Date(2026, 7, 19, 23, 59),
    );

    expect(windows).toHaveLength(1);
    expect(windows[0].start).toEqual(new Date(2026, 7, 17, 6, 0)); // Monday
  });

  it("excludes windows whose start is outside the range", () => {
    const windows = listWindowsForRange(
      { startTime: 360, endTime: 540, daysOfWeek: [] },
      new Date(2026, 7, 17, 12, 0), // after that day's window start
      new Date(2026, 7, 18, 23, 59),
    );

    expect(windows).toHaveLength(1);
    expect(windows[0].start).toEqual(new Date(2026, 7, 18, 6, 0));
  });
});
