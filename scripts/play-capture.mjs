// Step 1 of the Google Play listing art: real screens from the real app. It drives the static build through
// two and a half weeks of four-day training on a fake clock (like site-screenshots.mjs), then captures each
// screen raw, at phone size and at tablet size, into store/play/raw/. Step 2 (play-compose.mjs) frames them
// with captions. Run after a visible change to the screens the listing shows:
//   npm run build:static && node scripts/play-capture.mjs [base-url] && node scripts/play-compose.mjs
import fs from "node:fs";
import { chromium } from "playwright";

import { base } from "./helpers.mjs";

const OUT = "store/play/raw";
fs.mkdirSync(OUT, { recursive: true });

const server = await base();
// SwiftShader gives headless Chromium WebGL, so the 3D demo on the workout screen renders.
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const PHONE = { width: 390, height: 844 };
const TABLET = { width: 800, height: 1280 };
const DESKTOP = { width: 1280, height: 720 }; // Chromebook screenshots (16:9)
const ctx = await browser.newContext({
  viewport: PHONE,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  colorScheme: "dark",
  reducedMotion: "reduce",
});
const page = await ctx.newPage();
page.on("dialog", (d) => d.dismiss().catch(() => {}));

const DAY = 86_400_000;
// Taken on a Wednesday morning, mid-block, after four-day training weeks (Mon, Tue, Thu, Fri), the last one
// yesterday evening, so Today shows a streak, Progress has this week's sets and Recovery a mix of bands.
const today = new Date();
today.setHours(7, 30, 0, 0);
while (today.getDay() !== 3) today.setTime(today.getTime() - DAY);
const days = [];
for (let back = 24; back >= 1; back--) {
  const d = new Date(today.getTime() - back * DAY);
  d.setHours(17, 30, 0, 0);
  if ([1, 2, 4, 5].includes(d.getDay())) days.push(d);
}

async function shot(name, { full = false } = {}) {
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  console.log(`  ${OUT}/${name}.png`);
}

/** Scrolls so the first text matching `re` sits near the top, then captures the screen. */
async function shotAt(name, re) {
  const el = (typeof re === "string" ? page.getByText(re, { exact: true }) : page.getByText(re)).filter({ visible: true }).first();
  await el.waitFor();
  await el.evaluate((n) => window.scrollTo(0, n.getBoundingClientRect().top + window.scrollY - 24));
  await shot(name);
}

const taken = new Set();
async function workout({ late = false, last = false } = {}) {
  await page.getByRole("button", { name: "Start workout" }).click();
  await page.getByRole("button", { name: /Log (set|warm-up)/ }).waitFor();
  for (let i = 0; i < 60; i++) {
    if (await page.getByRole("button", { name: "Finish workout" }).isVisible()) break;
    const fb = page.getByRole("button", { name: "About right" });
    if (await fb.isVisible()) await fb.click();
    const barbell =
      late &&
      !taken.has("workout") &&
      (await page
        .getByText(/Each side/)
        .first()
        .isVisible()) &&
      (await page
        .getByText(/· Set \d+ of/)
        .first()
        .isVisible()) &&
      !(await page
        .getByText(/First time/)
        .first()
        .isVisible()); // a working set of a lift done before
    if (barbell) {
      await page.waitForTimeout(1200); // the 3D demo draws its first frames
      await shot("workout");
      taken.add("workout");
      const why = page.getByRole("button", { name: "Why?" }).first();
      if (await why.isVisible()) {
        await why.click();
        await page.waitForTimeout(500);
        await shot("why");
        await page.keyboard.press("Escape");
        await page.waitForTimeout(300);
      }
    }
    await page.clock.runFor(40_000);
    await page.getByRole("button", { name: /Log (set|warm-up)/ }).click();
    if (barbell) {
      await page.clock.runFor(35_000);
      await shot("rest");
    }
    await page.clock.runFor(150_000);
    const skip = page.getByRole("button", { name: "Skip rest" });
    if (await skip.isVisible()) await skip.click();
  }
  await page.getByRole("button", { name: "Finish workout" }).click();
  await page.getByText(/XP/).first().waitFor();
  if (last) {
    await page.waitForTimeout(1500);
    await shot("done");
  }
  await page.getByRole("button", { name: "Done", exact: true }).click();
}

/** A believable lifter: some experience, 80 kg, 32, male, with known numbers, so the weights look real. */
async function setup() {
  await page.locator("#setup-name").fill("Sam");
  await page.getByRole("button", { name: /Some experience/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Commercial gym/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("textbox", { name: "Body weight" }).fill("80");
  await page.locator("#setup-age").fill("32");
  await page.getByRole("button", { name: "Male", exact: true }).click();
  await page.getByRole("button", { name: /I know my numbers/ }).click();
  for (const [lift, w, r] of [
    ["Back squat", 130, 5],
    ["Bench press", 95, 5],
    ["Deadlift", 160, 5],
    ["Overhead press", 57.5, 5],
  ]) {
    await page.getByRole("textbox", { name: `${lift} weight` }).fill(String(w));
    await page.getByRole("textbox", { name: `${lift} reps` }).fill(String(r));
  }
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByText("Today's workout").waitFor();
}

const nav = (tab) => page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: tab, exact: true }).click();

try {
  await page.clock.install({ time: days[0].getTime() - 3600_000 });
  await page.goto(`${server.url}/app/`);
  await setup();
  for (let i = 0; i < days.length; i++) {
    await page.clock.setSystemTime(days[i]);
    await page.reload();
    await page.getByText("Today's workout").waitFor();
    await workout({ late: i >= days.length - 4, last: i === days.length - 1 });
  }
  await page.clock.setSystemTime(today);
  await page.reload();
  await page.getByText("Today's workout").waitFor();

  for (const [vp, sfx] of [
    [PHONE, ""],
    [TABLET, "-tablet"],
    [DESKTOP, "-desktop"],
  ]) {
    await page.setViewportSize(vp);
    await page.evaluate(() => {
      location.hash = "#/today";
      window.scrollTo(0, 0);
    });
    await page.getByText("Today's workout").waitFor();
    await shot(`today${sfx}`);
    await shotAt(`today-plan${sfx}`, /exercises · about/i);
    await nav("Body");
    await shot(`recovery${sfx}`);
    await nav("Progress");
    await shot(`progress${sfx}`);
    await shotAt(`progress-1rm${sfx}`, /^Estimated one-rep max/);
    await shotAt(`progress-strength${sfx}`, /^Strength score/);
    await shotAt(`progress-dots${sfx}`, /^DOTS score/);
    const all = page.getByRole("button", { name: /^Show all/ });
    if (await all.isVisible()) await all.click();
    const lift = page.locator("button[aria-haspopup=dialog]", { hasText: "Back squat" }).first();
    await lift.scrollIntoViewIfNeeded();
    await lift.click();
    await page.waitForTimeout(500);
    await shot(`onerm${sfx}`);
    await page.keyboard.press("Escape");
    await page.evaluate(() => {
      location.hash = "#/tools/tdee";
      window.scrollTo(0, 0);
    });
    const height = page.getByRole("textbox", { name: /Height/ });
    if (!(await height.inputValue())) await height.fill("180");
    await page.waitForTimeout(400);
    await shot(`tdee${sfx}`);
    await shotAt(`tdee-result${sfx}`, /^Activity/);
    await page.evaluate(() => {
      location.hash = "#/achievements";
      window.scrollTo(0, 0);
    });
    await shot(`achievements${sfx}`);
  }

  // One-handed controls (right hand), then today's workout at phone and tablet size.
  await page.setViewportSize(PHONE);
  await page.evaluate(() => {
    location.hash = "#/settings";
    window.scrollTo(0, 0);
  });
  await page.getByRole("button", { name: "Right hand", exact: true }).click();
  await shotAt("settings-a11y", /^One-handed controls/);
  await page.evaluate(() => {
    location.hash = "#/today";
    window.scrollTo(0, 0);
  });
  await page.getByRole("button", { name: "Start workout" }).click();
  await page.getByRole("button", { name: /Log (set|warm-up)/ }).waitFor();
  for (let i = 0; i < 6 && (await page.getByRole("button", { name: /Log warm-up/ }).isVisible()); i++) {
    await page.getByRole("button", { name: /Log warm-up/ }).click();
    await page.clock.runFor(70_000);
    const skip = page.getByRole("button", { name: "Skip rest" });
    if (await skip.isVisible()) await skip.click();
  }
  await page.waitForTimeout(1200);
  await shot("onehand");
  await page.setViewportSize(TABLET);
  await page.waitForTimeout(1200);
  await shot("workout-tablet");
  await page.setViewportSize(DESKTOP);
  await page.waitForTimeout(1200);
  await shot("workout-desktop");
  if (!taken.has("workout")) throw new Error("no barbell set in the last four workouts to photograph");
} catch (e) {
  console.error(e);
  await page.screenshot({ path: `${OUT}/failure.png` }).catch(() => {});
  process.exitCode = 1;
}
await browser.close();
server.close();
