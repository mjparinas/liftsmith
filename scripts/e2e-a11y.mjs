// axe-core WCAG 2.2 A/AA on every screen, failing on serious and critical problems.
//   npm run build:static && node scripts/e2e-a11y.mjs [base-url]
import AxeBuilder from "@axe-core/playwright";
import { chromium, devices } from "playwright";
import { base, finish, onboard } from "./helpers.mjs";

const server = await base();
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["Pixel 7"] });
const page = await ctx.newPage();
const fail = [];
const scan = async (where) => {
  // Let entry animations finish before checking contrast: a card still fading in reads as low contrast.
  // A fixed wait was too short on slow CI machines. Looping animations are left alone.
  // Wait a moment first so animations started by the click have begun, then for them to finish.
  await page.waitForTimeout(300);
  await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))));
  await page.waitForTimeout(100);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  for (const v of r.violations.filter((v) => v.impact === "serious" || v.impact === "critical")) {
    fail.push(`${where}: ${v.id} (${v.impact}) ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(" ") + (process.env.A11Y_DETAIL ? ` [${n.any?.[0]?.message}] ${n.html.slice(0, 160)}` : "")).join(", ")}`);
  }
};
try {
  await page.goto(`${server.url}/`);
  await scan("home");
  await page.goto(`${server.url}/app/`);
  await scan("onboarding");
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
  await page.getByRole("button", { name: "End" }).click();
  await page.getByRole("button", { name: "Finish and save" }).click();
  await page.getByRole("button", { name: /You earned a crate/ }).click();
  await scan("done");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "🔥 Warm up first" }).click();
  await scan("warm-up");
  await page.mouse.click(10, 10); // tap outside the sheet to close it
  for (const tab of ["Recovery", "Progress", "Awards", "Gyms"]) {
    await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: tab, exact: true }).click();
    await scan(tab);
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
  for (const tab of ["Overview", "Calendar", "Lifts", "History", "Achievements", "Log a workout", "Share"]) {
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
  await page.goto(`${server.url}/app/#/settings`);
  await scan("settings");
  await page.getByRole("button", { name: "Set up" }).click();
  await scan("cycle consent");
  await page.getByRole("button", { name: "I agree, turn it on" }).click();
  await page.getByRole("button", { name: "Period started today" }).click();
  await scan("cycle on");
  await page.getByRole("button", { name: "Send feedback or report a bug" }).click();
  await page.getByRole("button", { name: "See what's included" }).click();
  await scan("feedback");
  await page.getByLabel("Message").fill("The rest timer skipped a beat");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.getByRole("heading", { name: /Saved, it'll send|Thanks/ }).waitFor();
  await scan("feedback sent");
  // Light mode: every main screen again, so the light tokens pass contrast too.
  await page.goto(`${server.url}/app/#/settings`);
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === "light");
  await scan("light settings");
  await page.getByRole("button", { name: "‹ Today" }).click();
  await scan("light today");
  for (const tab of ["Recovery", "Progress", "Awards", "Gyms"]) {
    await page.getByRole("button", { name: tab }).click();
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
} catch (e) {
  fail.push(String(e));
}
await browser.close();
server.close();
finish("accessibility", fail);
