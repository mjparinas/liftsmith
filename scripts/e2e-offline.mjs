// Real offline: after one visit, the app opens and a workout runs with the network off.
//   npm run build:static && node scripts/e2e-offline.mjs
import { chromium } from "playwright";

import { base, check, finish, onboard } from "./helpers.mjs";

const server = await base();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 412, height: 860 } });
const page = await ctx.newPage();
const fail = [];
try {
  await page.goto(`${server.url}/app/`);
  await onboard(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // the worker now controls the page and has cached its files
  await page.getByText("Today's workout").waitFor();
  await ctx.setOffline(true);
  await page.reload();
  // The page loads before the app has read its data and drawn Today (a skeleton shows meanwhile), so wait for it.
  const opened = await page
    .getByText("Today's workout")
    .waitFor({ timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  check(opened, "App opens offline", fail);
  await page.getByRole("button", { name: "Start workout" }).click();
  await page.getByRole("button", { name: /Log (set|warm-up)/ }).click();
  check(await page.getByText("Rest", { exact: true }).isVisible(), "Sets log offline", fail);
} catch (e) {
  fail.push(String(e));
}
await browser.close();
server.close();
finish("offline", fail);
