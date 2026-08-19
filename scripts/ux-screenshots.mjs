/* One-off UX audit script: screenshots of key screens in light/dark themes. */
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

  // login page (dark + light)
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/01-login-dark.png` });
  await page.emulateMedia({ colorScheme: "light" });
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  await page.screenshot({ path: `${OUT}/02-login-light.png` });
  await page.evaluate(() => document.documentElement.classList.add("dark"));

  // login via API and open app
  const res = await ctx.request.post(`${BASE}/api/auth/login`, {
    data: { email: "demo@example.com", password: "demo12345" },
  });
  if (!res.ok()) throw new Error(`login failed: ${res.status()}`);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/03-app-dark.png` });

  // task dialog (open first task if any)
  const row = page.getByText("Сверстать лендинг").first();
  if ((await row.count()) > 0) {
    await row.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/04-task-dialog-dark.png` });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }

  // light theme app
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/05-app-light.png` });

  // mobile viewport dark
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/06-app-mobile-dark.png` });

  // computed fonts actually used on body
  const body = await page.evaluate(() => {
    const s = getComputedStyle(document.body);
    return { fontFamily: s.fontFamily, fontSize: s.fontSize };
  });
  console.log("body computed style:", JSON.stringify(body, null, 2));

  await browser.close();
  console.log("screenshots saved to", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
