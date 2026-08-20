import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const response = await page.request.post("/api/auth/login", {
    data: { email: "demo@example.com", password: "demo12345" },
  });
  expect(response.ok()).toBe(true);
});

// The goal window 00:00–00:01 daily guarantees an overdue instance from yesterday
// no matter what local time the test runs at (unlike the seeded "Утро 6–9" goal,
// which is only overdue after 09:00).
test("goals tab renders, overdue goal can be acknowledged in the today view", async ({ page }) => {
  const areas = (await (await page.request.get("/api/areas")).json()) as { id: string }[];
  expect(areas.length).toBeGreaterThan(0);

  const name = `e2e-goal-${Date.now()}`;
  const createResponse = await page.request.post("/api/goals", {
    data: {
      name,
      startTime: 0,
      endTime: 1,
      daysOfWeek: [],
      targets: [{ areaId: areas[0].id, requiredCount: 1 }],
    },
  });
  expect(createResponse.ok()).toBe(true);
  const goal = (await createResponse.json()) as { id: string };

  try {
    await page.goto("/");
    await page.getByRole("tab", { name: "Цели" }).click();
    await expect(page.getByText("Утро 6–9")).toBeVisible();
    await expect(page.getByText(name)).toBeVisible();

    // The overdue badge is visible on every view and leads to the Today view.
    const badge = page.getByRole("button", { name: /^Цели: \d+$/ });
    await expect(badge).toBeVisible();
    await badge.click();

    await expect(page.getByRole("heading", { name: /^Цели/ })).toBeVisible();
    const card = page
      .locator("div")
      .filter({ hasText: name })
      .filter({ has: page.getByRole("button", { name: "Закрыть" }) })
      .last();
    await expect(card.getByText("Просрочена")).toBeVisible();

    // A daily 00:00–00:01 goal has one overdue instance per lookback day, so a
    // single ack removes exactly one card, not all of them.
    const beforeAck = await page.getByText(name).count();
    await card.getByRole("button", { name: "Закрыть" }).click();
    await expect(page.getByText(name)).toHaveCount(beforeAck - 1);
  } finally {
    // Cleanup: remove the goal created by this test from the local database.
    await page.request.delete(`/api/goals/${goal.id}`);
  }
});
