// axe-core WCAG 2.2 A/AA on every screen, failing on serious and critical problems. Then the
// accessibility settings (colour-blind safe colours, more contrast, the largest text), Windows-style
// forced colours, and a keyboard-only run: every stop has a visible focus ring, a workout can be
// started and a set logged without a pointer, and sheets close on Escape with focus returned.
//   npm run build:static && node scripts/e2e-a11y.mjs [base-url]
import AxeBuilder from "@axe-core/playwright";
import { chromium, devices } from "playwright";

import { base, finish, onboard, stubSignIn } from "./helpers.mjs";

const server = await base();
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const ctx = await browser.newContext({ ...devices["Pixel 7"] });
await stubSignIn(ctx);
const page = await ctx.newPage();
const fail = [];
const scan = async (where, skip = []) => {
  // Let entry animations finish before checking contrast: a card still fading in reads as low contrast.
  // A fixed wait was too short on slow CI machines. Looping animations are left alone.
  // Wait a moment first so animations started by the click have begun, then for them to finish.
  await page.waitForTimeout(300);
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    ),
  );
  await page.waitForTimeout(100);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).disableRules(skip).analyze();
  for (const v of r.violations.filter((v) => v.impact === "serious" || v.impact === "critical")) {
    fail.push(
      `${where}: ${v.id} (${v.impact}) ${v.help} — ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(" ") + (process.env.A11Y_DETAIL ? ` [${n.any?.[0]?.message}] ${n.html.slice(0, 160)}` : ""))
        .join(", ")}`,
    );
  }
};
try {
  await page.goto(`${server.url}/`);
  await scan("home");
  await page.goto(`${server.url}/app/`);
  await scan("welcome");
  await page.getByRole("button", { name: "I already have an account" }).click();
  await page.getByRole("dialog").waitFor();
  await scan("welcome sign-in");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Get started" }).click();
  await scan("onboarding");
  await page.getByRole("button", { name: "Back" }).click();
  await onboard(page);
  await scan("today");
  await page.getByRole("button", { name: "Start workout" }).click();
  await page.getByRole("button", { name: /Log (set|warm-up)/ }).waitFor();
  await scan("workout");
  // Skip the warm-ups so the saved workout has a working set.
  const skipWarm = page.getByRole("button", { name: "Skip warm-up" });
  if (await skipWarm.isVisible()) await skipWarm.click();
  await page.getByRole("button", { name: /Log (set|warm-up)/ }).click();
  await scan("rest");
  await page.getByRole("button", { name: "Plate math" }).click();
  await scan("rest plate math");
  await page.getByRole("button", { name: "Breathe" }).click();
  await scan("rest breathing");
  await page.getByRole("button", { name: "End", exact: true }).click();
  await page.getByRole("button", { name: "Finish and save" }).click();
  await page.getByRole("button", { name: /You earned a crate/ }).click();
  await scan("done");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "🔥 Warm up first" }).click();
  await scan("warm-up");
  await page.mouse.click(10, 10); // tap outside the sheet to close it
  for (const tab of ["Body", "Progress", "Awards", "Gyms"]) {
    await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: tab, exact: true }).click();
    await scan(tab);
    if (tab === "Body") {
      // The health twin (Body › Health) and one metric's detail sheet.
      await page.getByTestId("body-health").click();
      await page.getByTestId("twin-weight").waitFor();
      await scan("body health");
      await page.getByTestId("twin-weight").click();
      await page.getByRole("dialog").waitFor();
      await scan("body health detail");
      await page.keyboard.press("Escape");
      // Fitness age and how it's worked out.
      await page.getByTestId("fitness-age").getByRole("button", { name: "How is this worked out?" }).click();
      await page.getByRole("dialog").waitFor();
      await scan("fitness age how");
      await page.keyboard.press("Escape");
      await page.getByTestId("body-muscles").click();
    }
  }
  // Delightful extras: recap and body/photos.
  await page.goto(`${server.url}/app/#/recap`);
  await page.getByRole("heading", { level: 1 }).waitFor();
  await scan("recap");
  await page.goto(`${server.url}/app/#/photos`);
  await page.getByRole("heading", { name: "Body and photos" }).waitFor();
  await scan("photos");
  // The web dashboard and a share link, with the workout just saved.
  await page.goto(`${server.url}/me/`);
  await page.getByRole("heading", { name: /training/ }).waitFor();
  for (const tab of ["Overview", "Calendar", "Lifts", "History", "Awards", "Log a workout", "Share"]) {
    await page.getByRole("link", { name: tab, exact: true }).click();
    await scan(`dashboard ${tab}`);
  }
  const link = await page.getByLabel("Your link").inputValue();
  await page.goto(link);
  await page.getByRole("article", { name: "Shared training summary" }).waitFor();
  await scan("shared summary");
  await page.goto(`${server.url}/app/#/programs`);
  await page.getByRole("heading", { name: "Programs" }).waitFor();
  await scan("programs");
  await page.getByRole("button", { name: /Tiered progression/ }).click();
  await page.getByRole("dialog").waitFor();
  await scan("program detail");
  await page.getByRole("button", { name: "Start this program" }).click();
  await page.getByText(/Tiered progression · Day 1/).waitFor();
  await scan("today on a program");
  await page.goto(`${server.url}/app/#/training`);
  await page.getByRole("heading", { name: "Workout preferences" }).waitFor();
  await scan("workout preferences");
  // A shared routine link (routineShare.ts): "Push day", bench press, then a lateral raise and pushdown superset.
  await page.goto(`${server.url}/app/#/routine/r1~UHVzaCBkYXk~bench-press.4~lateral-raise.3.s~cable-pushdown.3`);
  await page.getByRole("heading", { name: "Push day" }).waitFor();
  await scan("shared routine");
  // Stretching: the library, a stretch's demo sheet, a rest-day routine and the player.
  await page.goto(`${server.url}/app/#/stretch`);
  await page.getByTestId("stretch-list").waitFor();
  await page.getByRole("button", { name: "Pick Pigeon" }).click();
  await scan("stretch library");
  await page.getByRole("button", { name: /^Cobra/ }).click();
  await page.getByRole("dialog").waitFor();
  await scan("stretch demo");
  await page.keyboard.press("Escape");
  await page.goto(`${server.url}/app/#/stretch/rest`);
  await page.getByTestId("stretch-routine").waitFor();
  await scan("stretch routine");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("timer").waitFor();
  await scan("stretch player");
  // Tools › TDEE without stats (it links to Your stats), Your stats filled in with bump buttons, then TDEE
  // reading them, and the public calculator page.
  await page.goto(`${server.url}/app/#/tools/tdee`);
  await page.getByRole("heading", { name: "TDEE calculator" }).waitFor();
  await page.getByRole("button", { name: /Add your stats/ }).waitFor();
  await scan("tdee, stats missing");
  await page.getByRole("button", { name: /Add your stats/ }).click();
  await page.getByRole("button", { name: "Male", exact: true }).click();
  await page.getByRole("button", { name: "More age" }).click();
  await page.getByRole("button", { name: "More height" }).click();
  await scan("your stats");
  await page.goto(`${server.url}/app/#/tools/tdee`);
  await page.getByTestId("tdee-value").waitFor();
  await scan("tdee");
  await page.goto(`${server.url}/tools/tdee-calculator/`);
  await page.getByTestId("tdee-value").waitFor();
  await scan("tdee public page");
  // The public SEO pages: one of each kind (exercise with its 3D demo, alternatives, muscle, pair, equipment,
  // guide, blog post and index, calculators), then the pricing, help, contact, terms, what's new, status, about and
  // accessibility pages. The static build has no API, so the status page's health check is answered here.
  await page.route("**/api/health/", (r) => r.fulfill({ json: { ok: true } }));
  for (const path of [
    "/exercises/",
    "/exercises/bench-press/",
    "/exercises/bench-press/alternatives/",
    "/muscles/chest/",
    "/muscles/chest/dumbbells/",
    "/equipment/barbell/",
    "/guides/reps-in-reserve/",
    "/blog/",
    "/blog/how-long-to-rest-between-sets/",
    "/tools/plate-calculator/",
    "/tools/one-rep-max-calculator/",
    "/compare/",
    "/compare/fitbod/",
    "/alternatives/fitbod/",
    "/trust/",
    "/pricing/",
    "/help/",
    "/contact/",
    "/terms/",
    "/whats-new/",
    "/status/",
    "/about/",
    "/accessibility/",
  ]) {
    await page.goto(`${server.url}${path}`);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await scan(`site ${path}`);
  }
  await page.goto(`${server.url}/app/#/pro`);
  await page.getByRole("heading", { name: "Liftsmith Pro" }).waitFor();
  await scan("pro");
  await page.goto(`${server.url}/app/#/account`);
  await page.getByRole("heading", { name: "Account and sync" }).waitFor();
  await page.getByRole("button", { name: "Continue with email" }).click();
  await scan("account");
  await page.goto(`${server.url}/app/#/connections`);
  await page.getByRole("heading", { name: "Connected apps" }).waitFor();
  await scan("connections");
  await page.goto(`${server.url}/app/#/settings`);
  await scan("settings");
  // Every group page of Settings, and Labs (2026-11-10).
  for (const group of ["training", "workout", "reminders", "look", "body", "data", "labs"]) {
    await page.goto(`${server.url}/app/#/settings/${group}`);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await scan(`settings ${group}`);
  }
  await page.goto(`${server.url}/app/#/settings/body`);
  await page.getByRole("button", { name: "Set up" }).click();
  await scan("cycle consent");
  await page.getByRole("button", { name: "I agree, turn it on" }).click();
  await page.getByRole("button", { name: "Period started today" }).click();
  await scan("cycle on");
  await page.goto(`${server.url}/app/#/settings/training`);
  await page.getByRole("button", { name: "Injuries and sore spots" }).click();
  await page.getByRole("button", { name: "Log an injury" }).click();
  await scan("injury picker");
  await page.getByRole("button", { name: "Knee" }).click();
  await scan("pain rating");
  const rate = page.getByRole("dialog", { name: "How bad is it right now?" });
  await rate.getByRole("slider", { name: "Pain from 0 to 10" }).fill("6");
  await rate.getByRole("button", { name: "Save rating" }).click();
  await scan("injuries");
  await page.getByRole("button", { name: "Lighter" }).first().click();
  await scan("injury risk warning");
  await page.getByRole("button", { name: /Keep skipping/ }).click();
  await page.goto(`${server.url}/app/#/settings`);
  await page.getByRole("button", { name: "Send feedback or report a bug" }).click();
  await page.getByRole("button", { name: "See what's included" }).click();
  await scan("feedback");
  await page.getByLabel("Message").fill("The rest timer skipped a beat");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.getByRole("heading", { name: /Saved, it'll send|Thanks/ }).waitFor();
  await scan("feedback sent");
  // Light mode: every main screen again, so the light tokens pass contrast too.
  await page.goto(`${server.url}/app/#/settings/look`);
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === "light");
  await scan("light settings look");
  await page.goto(`${server.url}/app/#/settings`);
  await scan("light settings");
  await page.getByRole("button", { name: "‹ Today" }).click();
  await scan("light today");
  for (const tab of ["Body", "Progress", "Awards", "Gyms"]) {
    await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: tab, exact: true }).click();
    await scan(`light ${tab}`);
  }
  await page.getByRole("button", { name: "Today" }).click();
  await page.getByRole("button", { name: "Start workout" }).click();
  await page.getByRole("button", { name: /Log (set|warm-up)/ }).waitFor();
  await scan("light workout");
  await page.goto(`${server.url}/me/`);
  await page.getByRole("heading", { name: /training/ }).waitFor();
  for (const tab of ["Overview", "Lifts"]) {
    await page.getByRole("link", { name: tab, exact: true }).click();
    await scan(`light dashboard ${tab}`);
  }
  // Accessibility settings: colour-blind safe colours and more contrast, in both themes.
  await page.goto(`${server.url}/app/#/settings/look`);
  await page.getByRole("group", { name: "Colours" }).getByRole("button", { name: "Colour-blind safe" }).click();
  await page.getByRole("group", { name: "Contrast" }).getByRole("button", { name: "More" }).click();
  await page.waitForFunction(() => document.documentElement.dataset.cvd === "on" && document.documentElement.dataset.contrast === "more");
  await scan("light settings, colour-blind safe, more contrast");
  for (const tab of ["recovery", "stats"]) {
    await page.goto(`${server.url}/app/#/${tab}`);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await scan(`light ${tab}, colour-blind safe, more contrast`);
    // The recovery map and its legend mark bands with patterns too, so they don't rely on colour alone.
    if (tab === "recovery" && !(await page.locator("[data-mark]").count())) fail.push("recovery map: no dot or stripe marks");
  }
  await page.goto(`${server.url}/app/#/settings/look`);
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === "dark");
  for (const tab of ["today", "recovery"]) {
    await page.goto(`${server.url}/app/#/${tab}`);
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    await scan(`dark ${tab}, colour-blind safe, more contrast`);
  }
  // One-handed controls: the bump buttons docked beside Log set (a workout is still open from above).
  await page.goto(`${server.url}/app/#/settings/workout`);
  await page.getByRole("group", { name: "One-handed controls" }).getByRole("button", { name: "Right hand" }).click();
  await page.goto(`${server.url}/app/#/workout`);
  await page.getByRole("group", { name: "Adjust this set" }).waitFor();
  await scan("one-handed workout");
  // Forced colours (Windows High Contrast and similar).
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto(`${server.url}/app/#/today`);
  await page.getByRole("heading", { level: 1 }).first().waitFor();
  // axe can't compute contrast under forced colours (the system picks them), so that rule is left out here.
  await scan("forced colours today", ["color-contrast"]);
  await page.emulateMedia({ forcedColors: "none" });
} catch (e) {
  fail.push(String(e));
}
await ctx.close();

// Keyboard only, with the largest text on a common narrow phone (360 px).
const kctx = await browser.newContext({
  ...(devices["Galaxy S24"] ?? devices["Pixel 7"]),
  viewport: { width: 360, height: 780 },
  hasTouch: false,
  isMobile: false,
});
await stubSignIn(kctx);
const kp = await kctx.newPage();
try {
  await kp.goto(`${server.url}/app/`);
  await onboard(kp);
  await kp.goto(`${server.url}/app/#/settings/look`);
  await kp.getByRole("group", { name: "Text size" }).getByRole("button", { name: "Largest" }).click();
  await kp.waitForFunction(() => document.documentElement.style.fontSize === "150%");
  const sideways = async (where) => {
    const w = await kp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (w > 1) fail.push(`largest text: ${where} scrolls sideways by ${w}px`);
  };
  await sideways("settings");
  for (const tab of ["recovery", "stats", "achievements", "gym", "today"]) {
    await kp.goto(`${server.url}/app/#/${tab}`);
    await kp.getByRole("heading", { level: 1 }).first().waitFor();
    await sideways(tab);
  }
  // Tab to Start workout. Every stop on the way must show a focus ring.
  const press = async (key, what, max = 80) => {
    for (let i = 0; i < max; i++) {
      await kp.keyboard.press("Tab");
      const f = await kp.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const ring = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2) || cs.boxShadow !== "none";
        const r = el.getBoundingClientRect();
        return {
          name: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40),
          ring,
          seen: r.width > 0 && r.height > 0,
        };
      });
      if (f && f.seen && !f.ring) fail.push(`keyboard: no visible focus ring on "${f.name}"`);
      if (f && what.test(f.name)) {
        await kp.keyboard.press(key);
        return true;
      }
    }
    fail.push(`keyboard: couldn't reach ${what} with Tab`);
    return false;
  };
  if (await press("Enter", /^Start workout/)) {
    await kp.getByRole("button", { name: /Log (set|warm-up)/ }).waitFor();
    await sideways("workout");
    if (await press("Enter", /^Log (set|warm-up)/)) {
      await kp.getByRole("timer").waitFor();
      await sideways("rest");
    }
  }
  // A sheet: focus moves in, Tab stays in, Escape closes it and focus comes back.
  await kp.getByRole("button", { name: "End", exact: true }).focus();
  await kp.keyboard.press("Enter");
  const dialog = kp.getByRole("dialog");
  await dialog.waitFor();
  const inside = await kp.evaluate(() => !!document.activeElement?.closest("[role=dialog]"));
  if (!inside) fail.push("keyboard: focus didn't move into the sheet");
  for (let i = 0; i < 12; i++) await kp.keyboard.press("Tab");
  const stillInside = await kp.evaluate(() => !!document.activeElement?.closest("[role=dialog]"));
  if (!stillInside) fail.push("keyboard: Tab left the open sheet");
  await kp.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
  const back = await kp.evaluate(() => document.activeElement?.textContent?.trim());
  if (back !== "End") fail.push(`keyboard: focus went to "${back}" after closing the sheet, not back to End`);
} catch (e) {
  fail.push(`keyboard and large text: ${String(e)}`);
}
await browser.close();
server.close();
finish("accessibility", fail);
