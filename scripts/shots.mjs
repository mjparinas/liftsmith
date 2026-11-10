// Screenshots of every main screen for design reviews: node scripts/shots.mjs [base-url] [out-dir]
// Runs first-run setup, a short workout, and visits each tab. Phone size, 2x.
import fs from "node:fs";
import { chromium } from "playwright";

import { base, onboard } from "./helpers.mjs";

const OUT = process.argv[3] || "shots";
fs.mkdirSync(OUT, { recursive: true });
const server = await base();
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 412, height: 915 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  reducedMotion: "reduce",
});
// Headless Chromium only has software WebGL, which the site and app treat as no WebGL (src/lib/webgl.ts);
// this flag keeps the 3D figure in the pictures.
await ctx.addInitScript(() => {
  window.__liftsmithForceWebGL = true;
});
const page = await ctx.newPage();
const shot = async (n, full = false) => {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${OUT}/${n}.png`, fullPage: full });
};
await page.goto(`${server.url}/app/`);
await page.getByRole("button", { name: "Get started" }).waitFor();
await shot("00-welcome");
await page.getByRole("button", { name: "Get started" }).click();
await page.getByRole("button", { name: "Continue" }).waitFor();
await shot("01-setup");
await page.getByRole("button", { name: "Back" }).click();
await onboard(page);
await shot("02-today-empty-history");
await page.locator("#len").fill("30");
await page.getByRole("button", { name: "Start workout" }).click();
await page.getByRole("button", { name: /Log set/ }).waitFor();
await shot("03-workout");
await page.getByRole("button", { name: /Log set/ }).click();
await shot("04-rest");
for (let i = 0; i < 40; i++) {
  if (await page.getByRole("button", { name: "Finish workout" }).isVisible()) break;
  const fb = page.getByRole("button", { name: "About right" });
  if (await fb.isVisible()) await fb.click();
  const skip = page.getByRole("button", { name: "Skip rest" });
  if (await skip.isVisible()) await skip.click();
  await page.getByRole("button", { name: /Log set/ }).click();
}
await page.getByRole("button", { name: "Finish workout" }).click();
await page.getByText(/XP/).first().waitFor();
await page.waitForTimeout(1200);
await shot("05-done");
await page.getByRole("button", { name: "Done", exact: true }).click();
await shot("06-today");
for (const [tab, n] of [
  ["Body", "07-recovery"],
  ["Progress", "08-progress"],
  ["Gyms", "09-gyms"],
]) {
  await page.getByRole("button", { name: tab, exact: true }).click();
  await shot(n);
}
await browser.close();
server.close();
console.log(`shots in ${OUT}`);
