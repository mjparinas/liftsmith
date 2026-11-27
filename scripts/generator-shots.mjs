// The weekly tips email's picture of the website's workout generator (docs/decisions/workout-generator.md): the
// example workout on /tools/workout-generator/ in every language, saved like the app screens weekly-email-shots.mjs
// takes (600 px wide JPEG). Needs a running server with the API routes: npm run dev, then
//   node scripts/generator-shots.mjs [base-url]
// Writes public/email/<lang>/w/workout-generator.jpg.
import { chromium } from "playwright";
import sharp from "sharp";

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const LANGS = (process.env.LANGS || "en,es,fr,de,it,ja,pt,ko,pl,tr").split(",");

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, colorScheme: "dark" });
for (const lang of LANGS) {
  await page.goto(`${BASE}${lang === "en" ? "" : `/${lang}`}/tools/workout-generator/`, { waitUntil: "networkidle", timeout: 120_000 });
  const card = page.locator("#gen-workout");
  const box = await card.boundingBox();
  const png = await page.screenshot({
    fullPage: true,
    clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 860) },
  });
  await sharp(png).resize({ width: 600 }).jpeg({ quality: 70, mozjpeg: true }).toFile(`public/email/${lang}/w/workout-generator.jpg`);
  console.log(lang);
}
await browser.close();
