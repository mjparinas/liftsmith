// Layout on the phones and tablets in scripts/devices.mjs: no sideways scroll, the main buttons on screen,
// big targets, and a set logged and saved on each one.
//   npm run build:static && node scripts/e2e-devices.mjs [base-url] [out-dir]
//   DEVICES=ios|android|full|"Pixel 7,iPad Mini" picks a subset (default: all)
import fs from "node:fs";

import { closeAll, open, pick } from "./devices.mjs";
import { base, check, finish, onboard, stubSignIn, watchErrors } from "./helpers.mjs";

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
  await stubSignIn(ctx);
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
    await noSideScroll("welcome");
    await onboard(page);
    await noSideScroll("today");
    for (const tab of ["Today", "Body", "Progress", "Friends"]) {
      const b = await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: tab, exact: true }).boundingBox();
      check(
        b && b.y >= 0 && b.y + b.height <= opts.viewport.height && b.x + b.width <= opts.viewport.width + 1,
        `${name}: the ${tab} tab is off screen`,
        fail,
      );
    }
    await page.screenshot({ path: `${OUT}/${tag}-today.png` });
    const start = await page.getByRole("button", { name: "Start workout" }).boundingBox();
    check(start && start.y + start.height <= opts.viewport.height, `${name}: Start workout is below the fold`, fail);
    await page.getByRole("button", { name: "Start workout" }).click();
    await page.getByRole("button", { name: /Log (set|warm-up)/ }).waitFor();
    await noSideScroll("workout");
    const log = await page.getByRole("button", { name: /Log (set|warm-up)/ }).boundingBox();
    check(log && log.y >= 0 && log.y + log.height <= opts.viewport.height, `${name}: Log set is not fully on screen`, fail);
    check(log && log.height >= 48, `${name}: Log set is under 48 px tall`, fail);
    for (const label of ["More reps", "Less reps", "Swap exercise", "End"]) {
      const b = await page.getByRole("button", { name: label, exact: true }).boundingBox();
      check(
        b && b.height >= TARGET - 8 && b.width >= TARGET - 8,
        `${name}: "${label}" is too small to tap (${b?.width}×${b?.height})`,
        fail,
      );
    }
    await page.screenshot({ path: `${OUT}/${tag}-workout.png` });
    // Skip the warm-ups so the saved workout has a working set.
    const skipWarm = page.getByRole("button", { name: "Skip warm-up" });
    if (await skipWarm.isVisible()) await skipWarm.click();
    await page.getByRole("button", { name: /Log (set|warm-up)/ }).click();
    await noSideScroll("rest");
    await page.getByRole("button", { name: "End", exact: true }).click();
    await page.getByRole("button", { name: "Finish and save" }).click();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    for (const tab of ["Body", "Progress", "Friends"]) {
      await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: tab, exact: true }).click();
      await noSideScroll(tab);
    }
    await page.screenshot({ path: `${OUT}/${tag}-friends.png` });
    // The tab bar never covers the end of a screen, even with Android's three-button bar under it
    // (a 48 px safe area, faked here because a browser's is 0), and Today's Start button sits above it.
    const bar = await page.addStyleTag({ content: ".safe-bottom { padding-bottom: 48px !important; }" });
    for (const tab of ["Today", "Body", "Progress", "Friends"]) {
      await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: tab, exact: true }).click();
      await page.waitForTimeout(150);
      const gap = await page.evaluate(() => {
        window.scrollTo(0, document.documentElement.scrollHeight);
        const nav = document.querySelector("nav")?.getBoundingClientRect().top ?? 0;
        const end = document.querySelector("main")?.firstElementChild?.getBoundingClientRect().bottom ?? 0;
        const start = [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("Start workout"));
        return { content: nav - end, start: start ? nav - start.getBoundingClientRect().bottom : 0 };
      });
      check(gap.content >= 0, `${name}: the tab bar covers the end of ${tab} by ${-gap.content}px`, fail);
      check(gap.start >= 0, `${name}: the tab bar covers Start workout by ${-gap.start}px`, fail);
    }
    await bar.evaluate((el) => el.remove());
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
  ran++;
  console.log(`  ${name} (${engine}, ${opts.viewport.width}×${opts.viewport.height}) ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
await closeAll();
server.close();
check(ran > 0, "no device ran", fail);
finish("devices", fail);
