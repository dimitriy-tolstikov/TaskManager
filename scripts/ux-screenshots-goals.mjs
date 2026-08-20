/* One-off: goals feature screenshots after G2. */
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

  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  await page.getByRole("tab", { name: "Цели" }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/11-goals-tab-dark.png` });

  await page.getByRole("tab", { name: "Сегодня" }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/12-today-with-goals-dark.png` });

  await browser.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
