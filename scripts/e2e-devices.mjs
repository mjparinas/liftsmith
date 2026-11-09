// Layout on common phones and tablets: no sideways scroll, the main button on screen, big targets.
//   npm run build:static && node scripts/e2e-devices.mjs [base-url] [out-dir]
import fs from "node:fs";
import { chromium, devices } from "playwright";
import { base, check, finish, onboard, watchErrors } from "./helpers.mjs";

const OUT = process.argv[3] || "e2e-shots/devices";
fs.mkdirSync(OUT, { recursive: true });
const TARGET = 44; // Apple's 44 pt; Android asks for 48 dp on the main controls
const DEVICES = ["Galaxy S9+", "Galaxy S24", "Pixel 7", "iPhone SE (3rd gen)", "iPhone 15 Pro Max", "Pixel 7 landscape", "iPad Mini", "Galaxy Tab S9"];

const server = await base();
const browser = await chromium.launch();
const fail = [];
for (const name of DEVICES) {
  const d = devices[name];
  if (!d) {
    console.log(`(skipping ${name}: not in this Playwright)`);
    continue;
  }
  const opts = { ...d };
  delete opts.defaultBrowserType;
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  watchErrors(page, errors);
  const tag = name.replace(/\W+/g, "-");
  const noSideScroll = async (where) => {
    const w = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(w <= 1, `${name}: ${where} scrolls sideways by ${w}px`, fail);
  };
  try {
    await page.goto(`${server.url}/app/`);
    await noSideScroll("onboarding");
    await onboard(page);
    await noSideScroll("today");
    const start = await page.getByRole("button", { name: "Start workout" }).boundingBox();
    check(start && start.y + start.height <= opts.viewport.height, `${name}: Start workout is below the fold`, fail);
    await page.getByRole("button", { name: "Start workout" }).click();
    await page.getByRole("button", { name: /Log set/ }).waitFor();
    await noSideScroll("workout");
    const log = await page.getByRole("button", { name: /Log set/ }).boundingBox();
    check(log && log.y >= 0 && log.y + log.height <= opts.viewport.height, `${name}: Log set is not fully on screen`, fail);
    check(log && log.height >= 48, `${name}: Log set is under 48 px tall`, fail);
    for (const label of ["More reps", "Less reps", "Swap exercise", "End"]) {
      const b = await page.getByRole("button", { name: label, exact: true }).boundingBox();
      check(b && b.height >= TARGET - 8 && b.width >= TARGET - 8, `${name}: "${label}" is too small to tap (${b?.width}×${b?.height})`, fail);
    }
    await page.screenshot({ path: `${OUT}/${tag}-workout.png` });
    await page.getByRole("button", { name: /Log set/ }).click();
    await noSideScroll("rest");
    await page.getByRole("button", { name: "End" }).click();
    await page.getByRole("button", { name: "Finish and save" }).click();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    for (const tab of ["Recovery", "Progress", "Gyms"]) {
      await page.getByRole("button", { name: tab }).click();
      await noSideScroll(tab);
    }
    await page.screenshot({ path: `${OUT}/${tag}-gyms.png` });
    await page.goto(`${server.url}/me/`);
    await page.getByRole("heading", { name: /training/ }).waitFor();
    for (const tab of ["Overview", "Calendar", "Lifts", "History", "Log a workout", "Share"]) {
      await page.getByRole("link", { name: tab, exact: true }).click();
      await noSideScroll(`dashboard ${tab}`);
    }
    await page.getByRole("link", { name: "Overview", exact: true }).click();
    await page.screenshot({ path: `${OUT}/${tag}-dashboard.png` });
  } catch (e) {
    fail.push(`${name}: ${e}`);
  }
  fail.push(...errors.map((e) => `${name}: ${e}`));
  await ctx.close();
}
await browser.close();
server.close();
finish("devices", fail);
