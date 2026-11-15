// No two cards touch (Melvin, 2026-11-15: "ensure that there are no cards touching, there should be a gap").
// Visits every app screen on a phone and a desktop window, in dark and light, and a sample of each kind of
// website page, and fails when two card-like boxes (a border, rounded corners) sit edge to edge with less than
// 4 px between them. Usage: node scripts/e2e-gaps.mjs [base-url]  (after npm run build:static)
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

import { base, onboard, stubSignIn, watchErrors } from "./helpers.mjs";

const server = await base();
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const problems = [];

/** Runs in the page: pairs of card-like boxes closer than 4 px, side by side or stacked. */
function touching() {
  const cards = [];
  for (const el of document.querySelectorAll("body *")) {
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none" || s.position === "fixed" || s.position === "absolute") continue;
    const bw = parseFloat(s.borderTopWidth) + parseFloat(s.borderBottomWidth) + parseFloat(s.borderLeftWidth);
    if (bw < 2 || s.borderTopStyle === "none") continue;
    if (parseFloat(s.borderTopLeftRadius) < 10) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 80 || r.height < 36) continue;
    cards.push({ el, r });
  }
  const name = (el) => {
    const t = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
    return `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 4).join(".")} "${t}"`;
  };
  const out = [];
  for (let i = 0; i < cards.length; i++) {
    for (let j = 0; j < cards.length; j++) {
      if (i === j) continue;
      const a = cards[i];
      const b = cards[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const overlapX = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const overlapY = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      const dy = b.r.top - a.r.bottom;
      const dx = b.r.left - a.r.right;
      const stacked = dy > -1.5 && dy < 4 && overlapX > 0.3 * Math.min(a.r.width, b.r.width);
      const beside = dx > -1.5 && dx < 4 && overlapY > 0.3 * Math.min(a.r.height, b.r.height);
      if (stacked || beside)
        out.push(`${stacked ? "stacked" : "beside"} ${Math.round(stacked ? dy : dx)}px: ${name(a.el)} | ${name(b.el)}`);
    }
  }
  return out;
}

async function check(page, label) {
  await page.waitForTimeout(500);
  const found = await page.evaluate(touching);
  for (const f of found) problems.push(`${label}: ${f}`);
}

const SCREENS = [
  "#/today",
  "#/muscles",
  "#/health",
  "#/progress",
  "#/friends",
  "#/awards",
  "#/settings",
  "#/gyms",
  "#/recap",
  "#/photos",
  "#/programs",
  "#/injuries",
  "#/workout-preferences",
  "#/tools",
  "#/pro",
  "#/account",
  "#/connections",
  "#/stretching",
  "#/routine",
  "#/coaching",
  "#/exercises",
  "#/log",
  "#/feedback",
  "#/gymadd",
];

async function app(layout, theme) {
  const desk = layout === "desktop";
  const ctx = await browser.newContext(
    desk
      ? { viewport: { width: 1366, height: 900 }, reducedMotion: "reduce" }
      : { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" },
  );
  await stubSignIn(ctx);
  await ctx.addInitScript((t) => {
    try {
      localStorage.setItem("liftsmith.theme", t);
    } catch {}
  }, theme);
  const page = await ctx.newPage();
  const errors = [];
  watchErrors(page, errors);
  await page.goto(`${server.url}/app/`);
  await onboard(page);
  await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
  const label = `${layout} ${theme}`;
  for (const hash of SCREENS) {
    await page.evaluate((h) => (location.hash = h), hash);
    await check(page, `${label} ${hash}`);
    // Settings' sub-screens are rows that open their own pages.
  }
  // A workout: the set, then rest, then the Done screen.
  await page.goto(`${server.url}/app/#/today`);
  await page.getByRole("button", { name: "Start workout" }).click();
  await page
    .getByRole("button", { name: /^Log (set|warm-up)/ })
    .waitFor({ timeout: 8000 })
    .catch(async (e) => {
      await page.screenshot({ path: "/tmp/claude-0/gap-fail.png" });
      throw e;
    });
  await check(page, `${label} workout`);
  await page.getByRole("button", { name: /^Log (set|warm-up)/ }).click();
  await check(page, `${label} rest`);
  for (let i = 0; i < 60; i++) {
    if (await page.getByRole("button", { name: "Finish workout" }).isVisible()) break;
    const fb = page.getByRole("button", { name: "About right" });
    if (await fb.isVisible()) await fb.click();
    const skip = page.getByRole("button", { name: "Skip rest" });
    if (await skip.isVisible()) await skip.click();
    await page.getByRole("button", { name: /^Log (set|warm-up)/ }).click();
  }
  await page.getByRole("button", { name: "Finish workout" }).click();
  await page.waitForTimeout(1500);
  await check(page, `${label} done`);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  for (const hash of ["#/today", "#/progress", "#/awards", "#/recap"]) {
    await page.evaluate((h) => (location.hash = h), hash);
    await check(page, `${label} after ${hash}`);
  }
  await ctx.close();
}

/** One page of each kind on the website: the first page found under each top-level folder of out/. */
function sitePages() {
  const out = path.resolve("out");
  const pages = ["/"];
  for (const d of fs.readdirSync(out, { withFileTypes: true })) {
    if (!d.isDirectory() || ["_next", "app", "admin", "mediapipe", "embed"].includes(d.name)) continue;
    const dir = path.join(out, d.name);
    if (fs.existsSync(path.join(dir, "index.html"))) pages.push(`/${d.name}/`);
    const sub = fs
      .readdirSync(dir, { withFileTypes: true })
      .find((s) => s.isDirectory() && fs.existsSync(path.join(dir, s.name, "index.html")));
    if (sub) pages.push(`/${d.name}/${sub.name}/`);
  }
  return pages;
}

async function site(layout) {
  const desk = layout === "desktop";
  const ctx = await browser.newContext(
    desk ? { viewport: { width: 1366, height: 900 } } : { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true },
  );
  await stubSignIn(ctx);
  const page = await ctx.newPage();
  for (const p of sitePages()) {
    await page.goto(`${server.url}${p}`);
    await check(page, `site ${layout} ${p}`);
  }
  // Pages the server draws per request (gym, profile, standards, trainer pages), saved as files by hand.
  const extra = process.env.EXTRA_HTML;
  if (extra) {
    for (const f of fs.readdirSync(extra).filter((n) => n.endsWith(".html"))) {
      await page.goto(`file://${path.resolve(extra, f)}`);
      await check(page, `server ${layout} ${f}`);
    }
  }
  await ctx.close();
}

const ADMIN_TABS = [
  "Overview",
  "To Do",
  "Inbox",
  "Reports",
  "Gyms",
  "Traffic",
  "Acquisition",
  "Funnel",
  "Retention",
  "Engagement",
  "Devices",
  "Revenue",
  "Codes",
  "Users",
  "Installs",
  "Flags",
  "Automations",
  "System",
  "Log",
];

/** The admin panel needs a staff session, so it's checked while its answers are on the way: each tab's skeleton
 * is drawn in the shape of the tab (Skeletons.tsx). */
async function admin(layout) {
  // The panel is in the server build only (page.api.tsx): pass ADMIN_URL=http://localhost:3000 with npm run dev.
  if (!process.env.ADMIN_URL) return;
  const desk = layout === "desktop";
  const ctx = await browser.newContext(
    desk ? { viewport: { width: 1366, height: 900 } } : { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true },
  );
  await ctx.route("**/api/**", () => {});
  const page = await ctx.newPage();
  for (const tab of ADMIN_TABS) {
    await page.goto(`${process.env.ADMIN_URL ?? server.url}/admin/?tab=${encodeURIComponent(tab)}`);
    await check(page, `admin ${layout} ${tab}`);
  }
  await ctx.close();
}

for (const layout of ["phone", "desktop"]) {
  await admin(layout);
  if (!process.env.SITE_ONLY) for (const theme of ["dark", "light"]) await app(layout, theme);
  await site(layout);
}
await browser.close();
server.close();
const unique = [...new Set(problems)];
if (unique.length) {
  console.log(unique.join("\n"));
  console.log(`\n${unique.length} touching pairs`);
  process.exit(1);
}
console.log("No touching cards");
