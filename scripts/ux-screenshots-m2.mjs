/* One-off: screenshots of kanban and today views after M2. */
import { mkdir } from "node:fs/promises";

import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const OUT = "docs/ux-audit";

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
  });
  const page = await ctx.newPage();
  const res = await ctx.request.post(`${BASE}/api/auth/login`, {
    data: { email: "demo@example.com", password: "demo12345" },
  });
  if (!res.ok()) throw new Error(`login failed: ${res.status()}`);

  // a task due today so the Today view has content
  const task = await ctx.request.post(`${BASE}/api/tasks`, {
    data: { title: "UX-аудит: сегодня", dueAt: new Date().toISOString() },
  });
  const taskId = (await task.json()).id;

  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Канбан" }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/07-kanban-dark.png` });

  await page.getByRole("tab", { name: "Сегодня" }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/08-today-dark.png` });

  await ctx.request.delete(`${BASE}/api/tasks/${taskId}`);
  await browser.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
