/* One-off: goals in light theme + console errors capture. */
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
    colorScheme: "light",
  });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  await ctx.request.post(`${BASE}/api/auth/login`, {
    data: { email: "demo@example.com", password: "demo12345" },
  });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  // switch to light theme via the toggle (default is dark)
  await page.getByRole("button", { name: "Светлая тема" }).click();
  await page.waitForTimeout(400);

  await page.getByRole("tab", { name: "Цели" }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/14-goals-tab-light.png` });

  await page.getByRole("tab", { name: "Сегодня" }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/15-today-goals-light.png` });

  // restore dark
  await page.getByRole("button", { name: "Тёмная тема" }).click();
  console.log("console errors:", JSON.stringify(consoleErrors, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
