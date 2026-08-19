import { expect, test } from "@playwright/test";

test("login page renders the form", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByText("Войдите в свой аккаунт Task Manager")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Пароль")).toBeVisible();
  await expect(page.getByRole("button", { name: "Войти" })).toBeVisible();
});
