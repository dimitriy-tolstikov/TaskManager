import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const response = await page.request.post("/api/auth/login", {
    data: { email: "demo@example.com", password: "demo12345" },
  });
  expect(response.ok()).toBe(true);
});

test("calendar view shows a task due today and switches between week and month", async ({
  page,
}) => {
  const title = `e2e-calendar-${Date.now()}`;
  const dueAt = new Date();
  dueAt.setHours(12, 0, 0, 0);
  const createResponse = await page.request.post("/api/tasks", {
    data: { title, dueAt: dueAt.toISOString() },
  });
  expect(createResponse.ok()).toBe(true);
  const created = (await createResponse.json()) as { id: string };

  await page.goto("/");
  await page.getByRole("tab", { name: "Календарь" }).click();

  // Month is the default mode; the task chip sits in today's cell.
  await expect(page.getByText(title)).toBeVisible();

  await page.getByRole("tab", { name: "Неделя" }).click();
  await expect(page.getByText(title)).toBeVisible();

  await page.getByRole("tab", { name: "Месяц" }).click();
  await expect(page.getByText(title)).toBeVisible();

  // Cleanup: remove the task created by this test from the local database.
  await page.request.delete(`/api/tasks/${created.id}`);
});

test("calendar navigation moves to the previous period and back to today", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Календарь" }).click();

  const heading = page.locator("h2");
  const todayTitle = await heading.textContent();

  await page.getByRole("button", { name: "Предыдущий период" }).click();
  await expect(heading).not.toHaveText(todayTitle ?? "");

  await page.getByRole("button", { name: "Сегодня", exact: true }).click();
  await expect(heading).toHaveText(todayTitle ?? "");
});
