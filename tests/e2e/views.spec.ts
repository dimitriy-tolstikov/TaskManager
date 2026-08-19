import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const response = await page.request.post("/api/auth/login", {
    data: { email: "demo@example.com", password: "demo12345" },
  });
  expect(response.ok()).toBe(true);
});

test("kanban view renders the status columns", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "Канбан" }).click();

  await expect(page.getByRole("heading", { name: "Бэклог" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Сделать" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "В работе" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Готово" })).toBeVisible();
});

test("today view renders sections and shows a task due today", async ({ page }) => {
  const title = `e2e-today-${Date.now()}`;
  const dueAt = new Date();
  dueAt.setHours(12, 0, 0, 0);
  const createResponse = await page.request.post("/api/tasks", {
    data: { title, dueAt: dueAt.toISOString() },
  });
  expect(createResponse.ok()).toBe(true);
  const created = (await createResponse.json()) as { id: string };

  await page.goto("/");
  await page.getByRole("tab", { name: "Сегодня" }).click();

  await expect(page.getByRole("heading", { name: /Просроченные/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Сегодня/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /В работе без срока/ })).toBeVisible();
  await expect(page.getByText(title)).toBeVisible();

  // Cleanup: remove the task created by this test from the local database.
  await page.request.delete(`/api/tasks/${created.id}`);
});

test("selecting an area in the sidebar shows its name as the heading", async ({ page }) => {
  const areasResponse = await page.request.get("/api/areas");
  const areas = (await areasResponse.json()) as { id: string; name: string }[];
  expect(areas.length).toBeGreaterThan(0);

  await page.goto("/");
  // The demo data has a project named after its area, so click the first exact
  // match in the sidebar nav — DOM order puts the area button before its projects.
  await page
    .getByRole("navigation")
    .getByRole("button", { name: areas[0].name, exact: true })
    .first()
    .click();

  await expect(page.getByRole("heading", { name: areas[0].name, exact: true })).toBeVisible();
});
