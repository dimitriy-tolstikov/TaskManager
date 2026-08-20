/* One-off: verify theme toggle switches and persists. */
import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await ctx.request.post("http://localhost:3000/api/auth/login", {
  data: { email: "demo@example.com", password: "demo12345" },
});
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
const before = await page.evaluate(() => document.documentElement.className.includes("dark"));
await page.getByRole("button", { name: "Светлая тема" }).click();
await page.waitForTimeout(400);
const after = await page.evaluate(() => document.documentElement.className.includes("dark"));
await page.screenshot({ path: "docs/ux-audit/13-theme-light-toggled.png" });
await page.reload({ waitUntil: "networkidle" });
const persisted = await page.evaluate(() => document.documentElement.className.includes("dark"));
// restore dark default
await page.getByRole("button", { name: "Тёмная тема" }).click();
console.log(JSON.stringify({ before, after, persistedAfterReload: persisted }));
await browser.close();
