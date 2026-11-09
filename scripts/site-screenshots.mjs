// Real app screenshots for the home page (public/screens/*.webp). It drives the real app through a
// month of workouts on a fake clock, so Today, Progress and Recovery show a lifter's history, then
// captures each screen at phone size. Re-run after a visible change to those screens:
//   npm run build:static && node scripts/site-screenshots.mjs [base-url]
import fs from "node:fs";
import { chromium } from "playwright";
import sharp from "sharp";
import { base, onboard } from "./helpers.mjs";

const OUT = "public/screens";
const TMP = "e2e-shots/site";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const server = await base();
// SwiftShader gives headless Chromium WebGL, so the 3D demo on the workout screen renders.
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: "dark", reducedMotion: "reduce" });
const page = await ctx.newPage();
page.on("dialog", (d) => d.dismiss().catch(() => {}));

const DAY = 86_400_000;
// The screenshots are taken on a Wednesday morning, mid-block (a build week, not the deload), after two
// and a half weeks of four-day training (Mon, Tue, Thu, Fri), the last one yesterday evening. So Today
// shows a streak and "2 more this week", Progress has this week's sets, and Recovery shows a mix of bands.
const today = new Date();
today.setHours(7, 30, 0, 0);
while (today.getDay() !== 3) today.setTime(today.getTime() - DAY);
const days = [];
for (let back = 17; back >= 1; back--) {
  const d = new Date(today.getTime() - back * DAY);
  d.setHours(17, 30, 0, 0);
  if ([1, 2, 4, 5].includes(d.getDay())) days.push(d);
}

async function shot(name, { clip } = {}) {
  await page.waitForTimeout(250);
  const png = `${TMP}/${name}.png`;
  await page.screenshot({ path: png, clip });
  await sharp(png).webp({ quality: 82 }).toFile(`${OUT}/${name}.webp`);
  console.log(`  ${OUT}/${name}.webp`);
}

/** One workout, set by set, with real-feeling rests (the clock jumps forward instead of waiting).
 *  `late`: from the last few sessions, so the workout and rest shots carry real weights; they're taken on
 *  the first barbell set seen, which shows the plate graphic. `last` also captures the finish screen. */
const taken = new Set();
async function workout({ late = false, last = false } = {}) {
  await page.getByRole("button", { name: "Start workout" }).click();
  await page.getByRole("button", { name: /Log (set|warm-up)/ }).waitFor();
  for (let i = 0; i < 60; i++) {
    if (await page.getByRole("button", { name: "Finish workout" }).isVisible()) break;
    const fb = page.getByRole("button", { name: "About right" });
    if (await fb.isVisible()) await fb.click();
    const barbell = late && !taken.has("workout") && (await page.getByText(/Each side/).first().isVisible()) && (await page.getByText(/· Set \d+ of/).first().isVisible()); // a working set, not a warm-up
    if (barbell) {
      await shot("workout");
      taken.add("workout");
    }
    await page.clock.runFor(40_000); // the set itself
    await page.getByRole("button", { name: /Log (set|warm-up)/ }).click();
    if (barbell) {
      await page.clock.runFor(35_000);
      await shot("rest");
    }
    await page.clock.runFor(150_000); // rest runs out by itself
    const skip = page.getByRole("button", { name: "Skip rest" });
    if (await skip.isVisible()) await skip.click();
  }
  await page.getByRole("button", { name: "Finish workout" }).click();
  await page.getByText(/XP/).first().waitFor();
  if (last) {
    await page.waitForTimeout(1500); // badges and the crate animate in
    await shot("done");
  }
  await page.getByRole("button", { name: "Done", exact: true }).click();
}

try {
  await page.clock.install({ time: days[0].getTime() - 3600_000 });
  await page.goto(`${server.url}/app/`);
  await onboard(page);
  for (let i = 0; i < days.length; i++) {
    await page.clock.setSystemTime(days[i]);
    await page.reload();
    await page.getByText("Today's workout").waitFor();
    await workout({ late: i >= days.length - 4, last: i === days.length - 1 });
  }
  await page.clock.setSystemTime(today); // Wednesday 07:30, the morning after the last workout
  await page.reload();
  await page.getByText("Today's workout").waitFor();
  await shot("today");
  for (const [tab, name] of [["Recovery", "recovery"], ["Progress", "progress"]]) {
    await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: tab, exact: true }).click();
    await shot(name);
  }
  if (!taken.has("workout")) throw new Error("no barbell set in the last four workouts to photograph");
} catch (e) {
  console.error(e);
  await page.screenshot({ path: `${TMP}/failure.png` }).catch(() => {});
  process.exitCode = 1;
}
await browser.close();
server.close();
