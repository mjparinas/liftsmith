// The pictures in the weekly tips emails (src/server/weekly/): the real screen each email's button opens, in
// every app language. It drives the static build through two and a half weeks of four-day training on a fake clock
// (like play-capture.mjs), then opens every email's screen in each language and saves it small enough for email:
//   npm run build:static && node scripts/weekly-email-shots.mjs [base-url]
// Writes public/email/<lang>/w/<id>.jpg, 600 px wide (shown at 300 px, so sharp on high-density screens).
// ONLY=gym-setup,import retakes just those emails; LANGS=en,fr just those languages.
import fs from "node:fs";
import { createJiti } from "jiti";
import { chromium } from "playwright";
import sharp from "sharp";

import { base } from "./helpers.mjs";

const jiti = createJiti(import.meta.url, { alias: { "@": `${process.cwd()}/src` } });
const { WEEKLY } = await jiti.import(`${process.cwd()}/src/server/weekly/list.ts`);
const LANGS = (process.env.LANGS || "en,es,fr,de,it,ja,pt,ko,pl,tr").split(",");
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(",")) : null;
const catalogue = async (lang) => (await jiti.import(`${process.cwd()}/src/locales/${lang}.ts`))[lang];

/**
 * Where to scroll on a screen that several emails share, as a catalogue key (or keys, the first one found wins): the
 * line that should sit near the top. Emails without one show the top of the screen.
 */
const SCROLL = {
  likes: ["train.favourites"],
  "dyk-plan": ["train.rest"],
  blocks: ["settings.block"],
  splits: ["settings.program"],
  rest: ["settings.duringRest"],
  "dyk-workout": ["train.awake", "delight.ghost"],
  history: ["progress.history"],
  plateau: ["progress.next"],
  "goal-planner": ["gl.title", "pro.ft.goalPlanner"],
  "dyk-battery": ["settings.liteDemos"],
  accessibility: ["a11y.text"],
  adaptive: ["td.whyMuscles"],
  "short-on-time": ["td.length"],
  cardio: ["td.length"],
  "gym-finder": ["gym.near.title", "gym.near.find"],
  travel: ["gym.place"],
  watches: ["conn.garmin.title"],
  "heart-rate": ["conn.hr.title"],
  "labs-camera": ["lab.repCount.title"],
  "labs-coach": ["lab.barSpeed.title"],
  "labs-hands-off": ["lab.voiceLog.title"],
  "labs-gear": ["lab.sonos.title"],
  "form-cues": ["ff.title"],
  "auto-supersets": ["train.adapt"],
};
/**
 * What to tap before the picture (a catalogue key): the button that opens a sheet, or a switch that shows more, turned
 * back off afterwards so the next emails see the app as it was.
 */
const TAP = {
  "gym-finder": { role: "button", key: "gym.add" },
  "screenshot-share": { role: "button", key: "card.shot.open" },
  "labs-coach": { role: "switch", key: "lab.repCount.title", undo: true },
  "auto-supersets": { role: "switch", key: "train.ss", undo: true },
};
const tap = (T, e) => page.getByRole(TAP[e.id].role, { name: T[TAP[e.id].key] }).first().click();
/** Emails shown at desktop size, because they're about the computer. */
const WIDE = new Set(["desktop"]);

const server = await base();
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  colorScheme: "dark",
  reducedMotion: "reduce",
});
await ctx.addInitScript(() => {
  window.__liftsmithForceWebGL = true;
  const lang = localStorage.getItem("__playLang");
  if (lang) Object.defineProperty(navigator, "languages", { get: () => [lang] });
  // The phone context has a touch pointer; the desktop email pretends to have a mouse (layout.ts DESKTOP_QUERY).
  if (localStorage.getItem("__wide")) {
    const real = window.matchMedia.bind(window);
    window.matchMedia = (q) => (/pointer: fine/.test(q) ? { ...real("all"), matches: true, media: q } : real(q));
  }
});
const page = await ctx.newPage();
page.on("dialog", (d) => d.dismiss().catch(() => {}));

const DAY = 86_400_000;
const today = new Date();
today.setHours(7, 30, 0, 0);
while (today.getDay() !== 3) today.setTime(today.getTime() - DAY);
const days = [];
for (let back = 24; back >= 1; back--) {
  const d = new Date(today.getTime() - back * DAY);
  d.setHours(17, 30, 0, 0);
  if ([1, 2, 4, 5].includes(d.getDay())) days.push(d);
}

async function setup() {
  await page.getByRole("button", { name: "Get started" }).click();
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

async function workout() {
  await page.getByRole("button", { name: "Start workout" }).click();
  await page.getByRole("button", { name: /Log (set|warm-up)/ }).waitFor();
  for (let i = 0; i < 60; i++) {
    if (await page.getByRole("button", { name: "Finish workout" }).isVisible()) break;
    const fb = page.getByRole("button", { name: "About right" });
    if (await fb.isVisible()) await fb.click();
    await page.clock.runFor(40_000);
    await page.getByRole("button", { name: /Log (set|warm-up)/ }).click();
    await page.clock.runFor(150_000);
    const skip = page.getByRole("button", { name: "Skip rest" });
    if (await skip.isVisible()) await skip.click();
  }
  await page.getByRole("button", { name: "Finish workout" }).click();
  await page.getByText(/XP/).first().waitFor();
  await page.getByRole("button", { name: "Done", exact: true }).click();
}

/** Scrolls the first visible line of any of these catalogue keys near the top; false when none is on screen. */
async function scrollTo(T, keys) {
  for (const key of keys) {
    const v = T[key];
    if (!v) continue;
    const text = (typeof v === "string" ? v : v.other).replace(/\{\w+\}.*$/, "").trim();
    if (!text) continue;
    const el = page.getByText(text, { exact: false }).filter({ visible: true }).first();
    if (!(await el.count())) continue;
    await el.evaluate((n) => {
      n.scrollIntoView({ block: "start" });
      window.scrollBy(0, -24);
    });
    return true;
  }
  return false;
}

try {
  await page.clock.install({ time: days[0].getTime() - 3600_000 });
  await page.goto(`${server.url}/app/`);
  await setup();
  for (const d of days) {
    await page.clock.setSystemTime(d);
    await page.reload();
    await page.getByText("Today's workout").waitFor();
    await workout();
  }
  await page.clock.setSystemTime(today);
  for (const lang of LANGS) {
    const T = await catalogue(lang);
    await page.evaluate((l) => localStorage.setItem("__playLang", l), lang);
    await page.reload();
    await page.waitForLoadState("networkidle");
    const out = `public/email/${lang}/w`;
    fs.mkdirSync(out, { recursive: true });
    for (const e of WEEKLY) {
      if ((ONLY && !ONLY.has(e.id)) || e.shot === false) continue;
      const wide = WIDE.has(e.id);
      if (wide) {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.evaluate(() => localStorage.setItem("__wide", "1"));
        await page.reload();
        await page.waitForLoadState("networkidle");
      }
      await page.evaluate((r) => {
        location.hash = `#/${r}`;
        window.scrollTo(0, 0);
      }, e.route);
      await page.waitForTimeout(1200);
      if (TAP[e.id]) {
        await tap(T, e);
        await page.waitForTimeout(800);
      }
      if (SCROLL[e.id] && !(await scrollTo(T, SCROLL[e.id]))) console.warn(`  ${lang} ${e.id}: nothing to scroll to`);
      await page.waitForTimeout(300);
      const png = await page.screenshot();
      await sharp(png)
        .resize({ width: wide ? 900 : 600 })
        .jpeg({ quality: 70, mozjpeg: true })
        .toFile(`${out}/${e.id}.jpg`);
      console.log(`  ${out}/${e.id}.jpg`);
      // A sheet stays open across a hash change, so start the next email from a fresh page.
      if (TAP[e.id]?.undo) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await tap(T, e);
      }
      if (TAP[e.id]) {
        await page.reload();
        await page.waitForLoadState("networkidle");
      }
      if (wide) {
        await page.evaluate(() => localStorage.removeItem("__wide"));
        await page.setViewportSize({ width: 390, height: 844 });
        await page.reload();
        await page.waitForLoadState("networkidle");
      }
    }
  }
} catch (e) {
  console.error(e);
  await page.screenshot({ path: "weekly-shots-failure.png" }).catch(() => {});
  process.exitCode = 1;
}
await browser.close();
server.close();
