// Full playthrough: first run, a workout with rest, swaps and feedback, finish, and every tab.
//   npm run build:static && node scripts/e2e.mjs [base-url] [out-dir]
//   DEVICE="iPhone 16" runs it on another device from scripts/devices.mjs (default Pixel 7)
import fs from "node:fs";
import { closeAll, open } from "./devices.mjs";
import { base, check, finish, onboard, watchErrors } from "./helpers.mjs";

const OUT = process.argv[3] || "e2e-shots";
fs.mkdirSync(OUT, { recursive: true });
const server = await base();
const DEVICE = process.env.DEVICE || "Pixel 7";
const target = await open(DEVICE);
if (!target) {
  server.close();
  process.exit(0);
}
const ctx = await target.browser.newContext(target.opts);
const page = await ctx.newPage();
const errors = [];
const fail = [];
watchErrors(page, errors);
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });

try {
  await page.goto(`${server.url}/app/`);
  await onboard(page);
  await shot("today");
  check((await page.getByRole("listitem").count()) >= 3, "Today lists at least three exercises", fail);

  // The length slider re-plans.
  const before = await page.getByText(/exercises · about/).textContent();
  await page.locator("#len").fill("90");
  const after = await page.getByText(/exercises · about/).textContent();
  check(before !== after, "Moving the length slider changes the plan", fail);
  await page.locator("#len").fill("30");

  await page.getByRole("button", { name: "Start workout" }).click();
  await page.getByRole("button", { name: /Log set/ }).waitFor();
  await shot("workout");

  await page.getByRole("button", { name: /Log set/ }).click();
  check(await page.getByText("Rest", { exact: true }).isVisible(), "Rest timer starts after logging a set", fail);
  await page.getByRole("button", { name: "+30 s" }).click();
  await shot("rest");
  await page.getByRole("button", { name: "Skip rest" }).click();

  await page.getByRole("button", { name: "Swap exercise" }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Swap$/ }).first().click();
  check(await page.getByRole("button", { name: /Log set/ }).isVisible(), "Workout continues after a swap", fail);

  // Log every remaining set.
  for (let i = 0; i < 40; i++) {
    if (await page.getByRole("button", { name: "Finish workout" }).isVisible()) break;
    const fb = page.getByRole("button", { name: "About right" });
    if (await fb.isVisible()) await fb.click();
    const skip = page.getByRole("button", { name: "Skip rest" });
    if (await skip.isVisible()) await skip.click();
    await page.getByRole("button", { name: /Log set/ }).click();
  }
  check(await page.getByRole("button", { name: "Finish workout" }).isVisible(), "All sets can be logged", fail);
  await page.getByRole("button", { name: "Finish workout" }).click();
  await page.getByText(/XP/).first().waitFor();
  await shot("done");
  await page.getByRole("button", { name: "Done" }).click();

  for (const tab of ["Recovery", "Progress", "Gyms"]) {
    await page.getByRole("button", { name: tab }).click();
    await page.waitForTimeout(200);
    await shot(tab.toLowerCase());
  }
  await page.getByRole("button", { name: "Progress" }).click();
  check((await page.getByText(/No workouts yet/).count()) === 0, "Progress shows the workout", fail);

  // Data lasts a reload.
  await page.reload();
  await page.getByRole("button", { name: "Progress" }).click();
  check((await page.getByText(/No workouts yet/).count()) === 0, "History survives a reload", fail);

  // Shortcuts: the web manifest's "Start workout" link starts today's workout, and "Log set" logs one.
  await page.goto(`${server.url}/app/?do=start`);
  await page.getByRole("button", { name: /Log set/ }).waitFor();
  check(!page.url().includes("do="), "The shortcut link is cleared after it runs", fail);
  await page.goto(`${server.url}/app/?do=log`);
  await page.getByRole("button", { name: /Skip/ }).waitFor();
} catch (e) {
  fail.push(String(e));
  await shot("failure").catch(() => {});
}
await closeAll();
server.close();
finish(`playthrough on ${DEVICE}`, [...fail, ...errors]);
