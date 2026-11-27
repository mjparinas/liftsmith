// Real app screenshots for the guides and blog posts (public/articles/app/<id>.webp, 780 px, plus a 540 px copy).
// Like site-screenshots.mjs it drives the real app through two and a half weeks of workouts on a fake clock, so every
// screen shows a lifter's history, then opens each screen in APP_SCREENS (src/lib/articleImages.ts) and photographs it.
// Re-run after a visible change to those screens, or with ONLY=<id>,<id> for a few:
//   npm run build:static && PW_CHROMIUM=/opt/pw-browsers/chromium node scripts/article-screens.mjs
import fs from "node:fs";
import path from "node:path";
import { createJiti } from "jiti";
import { chromium } from "playwright";
import sharp from "sharp";

import { base, onboard } from "./helpers.mjs";

const jiti = createJiti(import.meta.url, { alias: { "@": path.resolve("src") } });
const { APP_SCREENS } = await jiti.import(path.resolve("src/lib/articleImages.ts"));

const OUT = "public/articles/app";
const TMP = "e2e-shots/articles";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });
const only = process.env.ONLY ? new Set(process.env.ONLY.split(",")) : null;
const want = (id) => !only || only.has(id);

const server = await base();
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}),
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
});
const page = await ctx.newPage();
page.on("dialog", (d) => d.dismiss().catch(() => {}));

const DAY = 86_400_000;
// A Wednesday morning, mid-block, after two and a half weeks of four-day training (as in site-screenshots.mjs).
const today = new Date();
today.setHours(7, 30, 0, 0);
while (today.getDay() !== 3) today.setTime(today.getTime() - DAY);
const days = [];
for (let back = 17; back >= 1; back--) {
  const d = new Date(today.getTime() - back * DAY);
  d.setHours(17, 30, 0, 0);
  if ([1, 2, 4, 5].includes(d.getDay())) days.push(d);
}

const done = [];
async function shot(id) {
  if (!want(id)) return;
  await page.waitForTimeout(600);
  const png = `${TMP}/${id}.png`;
  await page.screenshot({ path: png });
  await sharp(png).webp({ quality: 78 }).toFile(`${OUT}/${id}.webp`);
  await sharp(png).resize({ width: 540 }).webp({ quality: 78 }).toFile(`${OUT}/${id}-540.webp`);
  done.push(id);
  console.log(`  ${OUT}/${id}.webp`);
}

/** Made-up answers for the screens that read our server: a friend's workout, a coach's clients, the community board
 * and the routine library. Nothing here is a real person. */
async function standIns(page) {
  const now = Date.now();
  const post = (id, handle, name, avatar, caption, ex) => ({
    id,
    handle,
    name,
    at: now - 3_600_000,
    likes: 4,
    liked: false,
    comments: 2,
    mine: false,
    avatar,
    caption,
    audience: "all",
    partners: [],
    tagged: false,
    body: { v: 1, seconds: 3300, sets: 16, volume: 6400, prs: 1, muscles: ex.muscles, exercises: ex.list },
  });
  const posts = [
    post("p1", "blair", "Blair", "av-mascot", "New bench best, felt smooth.", {
      muscles: ["chest", "triceps"],
      list: [
        {
          id: "bench-press",
          name: "Bench press",
          sets: 3,
          w: 100,
          r: 5,
          pr: true,
          log: [
            { w: 95, r: 5 },
            { w: 100, r: 5 },
          ],
        },
      ],
    }),
    post("p2", "casey", "Casey", "av-leaf", "Leg day done.", {
      muscles: ["quads", "glutes"],
      list: [{ id: "back-squat", name: "Back squat", sets: 4, w: 120, r: 6, pr: false, log: [{ w: 120, r: 6 }] }],
    }),
  ];
  const social = {
    me: {
      profile: {
        handle: "alex",
        name: "Alex",
        open: false,
        autoPost: false,
        weights: true,
        public: false,
        push: {},
        avatar: "",
        audience: "all",
        showLifts: true,
        lifts: [],
      },
      followers: 3,
      following: 4,
      requests: 0,
      unread: 0,
    },
    feed: { posts, more: false },
    discover: { posts, more: false },
    training: { people: [] },
    suggest: { people: [] },
    invites: { friends: [], joined: null, months: 0, perYear: 12, needed: 3, until: null, reward: true },
  };
  await page.route("**/api/social/", (r) => r.fulfill({ json: social[JSON.parse(r.request().postData() ?? "{}").op] ?? { ok: true } }));
  await page.route("**/api/sync/", (r) => r.fulfill({ json: { cursor: 0, events: [], deleted: [], records: [], more: false } }));
  const coach = {
    invite: { code: "ABCD2345", expiresAt: now + 7 * 86_400_000 },
    clients: [
      { id: "c1", name: "Alex", since: now - 30 * 86_400_000 },
      { id: "c2", name: "Jordan", since: now - 60 * 86_400_000 },
      { id: "c3", name: "Sam", since: now - 12 * 86_400_000 },
    ],
    coaches: [],
    plans: [],
    notes: [],
    unread: { c1: 1 },
    setup: {},
    forms: [],
    checkins: [],
    slots: [],
    sessions: { booked: [], open: [] },
    pay: null,
    coach: true,
    role: "trainer",
  };
  await page.route("**/api/coach/**", (r) => {
    const q = new URL(r.request().url()).searchParams;
    if (r.request().method() === "GET" && q.has("schedule")) return r.fulfill({ json: { scope: q.get("schedule"), days: [] } });
    if (r.request().url().includes("/reviews/"))
      return r.fulfill({ json: { rating: { count: 0, average: null, outcome: null }, reviews: [] } });
    return r.fulfill({ json: r.request().method() === "GET" && !q.size ? coach : { ok: true } });
  });
  await page.route("**/api/teams/**", (r) => r.fulfill({ json: { school: null, codeSent: false, teams: [], joined: [], members: {} } }));
  await page.route("**/api/programs/**", (r) =>
    r.fulfill({ json: { mine: [], listed: [], owned: [], pay: { ready: false, currency: null } } }),
  );
  const idea = (id, kind, title, status, votes) => ({
    id,
    kind,
    title,
    body: "",
    status,
    votes,
    comments: 3,
    name: "Blair",
    handle: "blair",
    createdAt: now - 5 * 86_400_000,
    statusAt: now - 86_400_000,
  });
  const board = {
    posts: [
      idea("AbCdEfGh1234", "idea", "Rest timer on my watch face", "planned", 41),
      idea("AbCdEfGh1235", "idea", "Plate math for a 15 kg bar", "progress", 18),
      idea("AbCdEfGh1236", "idea", "Superset two machines", "review", 7),
      idea("AbCdEfGh1237", "bug", "Rest sound plays twice", "shipped", 5),
    ],
    voted: ["AbCdEfGh1234"],
    following: [],
  };
  await page.route(
    (u) => u.pathname.startsWith("/api/community/"),
    (r) => r.fulfill({ json: new URL(r.request().url()).searchParams.has("changelog") ? { updates: [] } : board }),
  );
  const routine = (id, title, about, goal, level, minutes, saves, average, count) => ({
    id,
    title,
    about,
    goal,
    level,
    equipment: ["barbell", "dumbbell"],
    minutes,
    code: "r1~TGVnIGRheQ~back-squat.4",
    by: "Blair",
    saves,
    rating: { average, count },
    createdAt: now - 20 * 86_400_000,
    updatedAt: now - 2 * 86_400_000,
  });
  const routines = [
    routine(
      "Lib0001",
      "Push day, chest first",
      "Bench, incline and dips, then shoulders and triceps.",
      "muscle",
      "intermediate",
      55,
      214,
      4.7,
      31,
    ),
    routine(
      "Lib0002",
      "Glutes and hamstrings",
      "Hip thrusts and Romanian deadlifts with a short finisher.",
      "muscle",
      "any",
      45,
      160,
      4.8,
      22,
    ),
    routine("Lib0003", "Full body in 30 minutes", "Squat, press, row and a carry.", "fitness", "beginner", 30, 98, 4.5, 12),
  ];
  await page.route("**/api/library/**", (r) =>
    r.fulfill({
      json: new URL(r.request().url()).searchParams.has("id") ? { routine: { ...routines[0], myStars: 0, saved: false } } : { routines },
    }),
  );
  await page.evaluate(() =>
    localStorage.setItem("liftsmith.account", JSON.stringify({ token: "t", id: "a", email: null, providers: ["email"], via: "email" })),
  );
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
      (last ||
        (await page
          .getByText(/Each side/)
          .first()
          .isVisible())) &&
      (await page
        .getByText(/· Set \d+ of/)
        .first()
        .isVisible());
    if (barbell) {
      await shot("workout");
      taken.add("workout");
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
  await page.clock.setSystemTime(today);
  await page.reload();
  await page.getByText("Today's workout").waitFor();
  // Your stats (sex, age, height), so the calculators show answers instead of asking for them.
  await page.evaluate(() => (location.hash = "#/tools/tdee"));
  await page.getByRole("button", { name: /Add your stats/ }).click();
  await page.getByRole("button", { name: "Male", exact: true }).click();
  await page.getByRole("button", { name: "More age" }).click();
  await page.getByRole("button", { name: "More height" }).click();
  // Screens that read our server are taken last, signed in against stand-ins (as in e2e-a11y.mjs).
  const online = new Set(["friends", "coaching", "community", "library"]);
  const open = async (s) => {
    await page.evaluate((h) => (location.hash = h), "#/today");
    await page.waitForTimeout(300);
    await page.evaluate((h) => (location.hash = h), s.hash);
    await page.waitForTimeout(900);
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(s.id);
  };
  for (const s of APP_SCREENS) if (s.hash && want(s.id) && !online.has(s.id)) await open(s);
  await standIns(page);
  await page.evaluate(() => (location.hash = "#/today"));
  await page.reload();
  await page.getByText("Today's workout").waitFor();
  for (const s of APP_SCREENS) if (s.hash && want(s.id) && online.has(s.id)) await open(s);
} catch (e) {
  console.error(e);
  await page.screenshot({ path: `${TMP}/failure.png` }).catch(() => {});
  process.exitCode = 1;
}
const missing = APP_SCREENS.filter((s) => want(s.id) && !done.includes(s.id)).map((s) => s.id);
if (missing.length) {
  console.error(`No screenshot for ${missing.join(", ")}`);
  process.exitCode = 1;
}
await browser.close();
server.close();
