// Screenshots of the main screens on a phone, for review.
//   npm run build && node scripts/shots.mjs [base] [out-dir]
// Serves out/ itself when no base URL is given.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium, devices } from "playwright";

const OUT = process.argv[3] || "shots";
fs.mkdirSync(OUT, { recursive: true });

function serve(dir) {
  const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".webmanifest": "application/manifest+json" };
  const srv = http.createServer((req, res) => {
    let p = path.join(dir, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
    if (!fs.existsSync(p)) p = path.join(dir, "404.html");
    res.writeHead(200, { "content-type": types[path.extname(p)] ?? "application/octet-stream" });
    fs.createReadStream(p).pipe(res);
  });
  return new Promise((r) => srv.listen(0, () => r({ srv, url: `http://localhost:${srv.address().port}` })));
}

const local = process.argv[2] ? null : await serve(path.resolve("out"));
const BASE = process.argv[2] || local.url;
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["Pixel 7"], deviceScaleFactor: Number(process.env.DSF || 2) });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
const shot = async (name) => {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${OUT}/${name}.png` });
};

await page.goto(`${BASE}/app/`);
await shot("01-onboarding");
await page.getByRole("button", { name: "Continue" }).click();
await page.getByRole("button", { name: /Commercial gym/ }).click();
await shot("02-onboarding-gym");
await page.getByRole("button", { name: "Continue" }).click();
await page.getByRole("button", { name: "Build my first workout" }).click();
await shot("03-today");
await page.screenshot({ path: `${OUT}/03b-today-full.png`, fullPage: true });
await page.getByRole("button", { name: "Start workout" }).click();
await shot("04-workout");
await page.getByRole("button", { name: /Log set/ }).click();
await shot("05-rest");
await page.getByRole("button", { name: "Skip rest" }).click();
for (let i = 0; i < 6; i++) {
  await page.getByRole("button", { name: /Log set/ }).click();
  await page.getByRole("button", { name: "Skip rest" }).click().catch(() => {});
}
await shot("06-workout-later");
await page.getByRole("button", { name: "Swap exercise" }).click();
await shot("07-swap");
await page.keyboard.press("Escape");
await page.mouse.click(10, 10);
await page.getByRole("button", { name: "End", exact: true }).click();
await page.getByRole("button", { name: "Finish and save" }).click();
await page.waitForTimeout(800);
await shot("08-done");
await page.getByRole("button", { name: "Done" }).click();
await page.getByRole("button", { name: "Recovery" }).click();
await shot("09-recovery");
await page.getByRole("button", { name: "Progress" }).click();
await shot("10-stats");
await page.getByRole("button", { name: "Gyms" }).click();
await page.screenshot({ path: `${OUT}/11-gym-full.png`, fullPage: true });

await browser.close();
local?.srv.close();
if (errors.length) {
  console.error("Console errors:\n" + errors.join("\n"));
  process.exit(1);
}
console.log(`Saved to ${OUT}/`);
