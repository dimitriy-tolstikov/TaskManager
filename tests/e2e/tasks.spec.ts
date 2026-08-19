import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const response = await page.request.post("/api/auth/login", {
    data: { email: "demo@example.com", password: "demo12345" },
  });
  expect(response.ok()).toBe(true);
});

test("logged-in user sees quick add and the task list", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Быстрое добавление задачи")).toBeVisible();
  await expect(page.getByLabel("Поиск задач")).toBeVisible();
  await expect(page.getByRole("button", { name: "Все задачи" })).toBeVisible();
});

test("quick add creates a task that appears in the list", async ({ page }) => {
  const title = `e2e-task-${Date.now()}`;
  await page.goto("/");

  const quickAdd = page.getByLabel("Быстрое добавление задачи");
  await quickAdd.fill(title);
  await quickAdd.press("Enter");

  await expect(page.getByText(title)).toBeVisible();

  // Cleanup: remove the task created by this test from the local database.
  const listResponse = await page.request.get(`/api/tasks?q=${encodeURIComponent(title)}`);
  const tasks = (await listResponse.json()) as { id: string }[];
  for (const task of tasks) {
    await page.request.delete(`/api/tasks/${task.id}`);
  }
});
