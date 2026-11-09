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
  await page.waitForTimeout(400); // let entry animations settle before checking contrast
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  for (const v of r.violations.filter((v) => v.impact === "serious" || v.impact === "critical")) {
    fail.push(`${where}: ${v.id} (${v.impact}) ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`);
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
  await page.getByRole("button", { name: /Log set/ }).waitFor();
  await scan("workout");
  await page.getByRole("button", { name: /Log set/ }).click();
  await scan("rest");
  await page.getByRole("button", { name: "End" }).click();
  await page.getByRole("button", { name: "Finish and save" }).click();
  await page.getByRole("button", { name: "Done" }).click();
  for (const tab of ["Recovery", "Progress", "Gyms"]) {
    await page.getByRole("button", { name: tab }).click();
    await scan(tab);
  }
  // The web dashboard and a share link, with the workout just saved.
  await page.goto(`${server.url}/me/`);
  await page.getByRole("heading", { name: /training/ }).waitFor();
  for (const tab of ["Overview", "Calendar", "Lifts", "History", "Trophies", "Log a workout", "Share"]) {
    await page.getByRole("link", { name: tab, exact: true }).click();
    await scan(`dashboard ${tab}`);
  }
  const link = await page.getByLabel("Your link").inputValue();
  await page.goto(link);
  await page.getByRole("article", { name: "Shared training summary" }).waitFor();
  await scan("shared summary");
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
} catch (e) {
  fail.push(String(e));
}
await browser.close();
server.close();
finish("accessibility", fail);
