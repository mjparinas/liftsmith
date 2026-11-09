// Layout on the phones and tablets in scripts/devices.mjs: no sideways scroll, the main buttons on screen,
// big targets, and a set logged and saved on each one.
//   npm run build && node scripts/e2e-devices.mjs [base-url] [out-dir]
//   DEVICES=ios|android|full|"Pixel 7,iPad Mini" picks a subset (default: all)
import fs from "node:fs";
import { closeAll, open, pick } from "./devices.mjs";
import { base, check, finish, onboard, watchErrors } from "./helpers.mjs";

const OUT = process.argv[3] || "e2e-shots/devices";
fs.mkdirSync(OUT, { recursive: true });
const TARGET = 44; // Apple's 44 pt; Android asks for 48 dp on the main controls

const server = await base();
const fail = [];
let ran = 0;
for (const { name } of pick()) {
  const t0 = Date.now();
  const target = await open(name);
  if (!target) continue;
  const { browser, opts, engine } = target;
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
    for (const tab of ["Today", "Recovery", "Progress", "Gyms"]) {
      const b = await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: tab, exact: true }).boundingBox();
      check(b && b.y >= 0 && b.y + b.height <= opts.viewport.height && b.x + b.width <= opts.viewport.width + 1, `${name}: the ${tab} tab is off screen`, fail);
    }
    await page.screenshot({ path: `${OUT}/${tag}-today.png` });
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
    await page.getByRole("button", { name: "Done" }).click();
    for (const tab of ["Recovery", "Progress", "Gyms"]) {
      await page.getByRole("button", { name: tab }).click();
      await noSideScroll(tab);
    }
    await page.screenshot({ path: `${OUT}/${tag}-gyms.png` });
  } catch (e) {
    fail.push(`${name}: ${e}`);
  }
  fail.push(...errors.map((e) => `${name}: ${e}`));
  await ctx.close();
  ran++;
  console.log(`  ${name} (${engine}, ${opts.viewport.width}×${opts.viewport.height}) ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
await closeAll();
server.close();
check(ran > 0, "no device ran", fail);
finish("devices", fail);
