// Ready PDFs of every program's printable page (docs/decisions/printable-plans.md): public/pdf/<lang>/liftsmith-<id>.pdf,
// Letter in English and A4 in the other nine languages, each one page. The print page carries its sheet's fingerprint
// (data-sheet-hash), saved in public/pdf/manifest.json; programPrint.test.ts fails when a sheet changed and its PDF
// didn't, so a program's change reaches its PDF. Only stale or missing PDFs are drawn again (add --all for every one):
//   npm run build:static && node scripts/program-pdfs.mjs            (serves out/ itself, or pass a base URL)
// --email also draws the weekly tips email's picture in every language (public/email/<lang>/w/printable-plans.jpg,
// src/server/weekly/list.ts `art: "print"`): the dumbbell full body's sheet as it prints, 600 px wide (its credit
// names no other program or app, which the emails never do).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

import { base } from "./helpers.mjs";

const LANGS = ["en", "es", "fr", "de", "it", "ja", "pt", "ko", "pl", "tr"];
const OUT = "public/pdf";
const MANIFEST = path.join(OUT, "manifest.json");

const all = process.argv.includes("--all");
const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
const server = await base();
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const page = await browser.newPage();

// The programs, from the programs index's links.
await page.goto(`${server.url}/programs/`, { waitUntil: "load" });
const ids = await page.evaluate(() => [
  ...new Set([...document.querySelectorAll('a[href^="/programs/"]')].map((a) => a.getAttribute("href").split("/")[2]).filter(Boolean)),
]);
if (!ids.length) throw new Error("No programs found on /programs/");

let drawn = 0;
const pagesIn = (buf) => (buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
for (const lang of LANGS) {
  fs.mkdirSync(path.join(OUT, lang), { recursive: true });
  for (const id of ids) {
    const key = `${lang}/${id}`;
    const file = path.join(OUT, lang, `liftsmith-${id}.pdf`);
    await page.goto(`${server.url}${lang === "en" ? "" : `/${lang}`}/programs/${id}/print/`, { waitUntil: "load" });
    const hash = await page.getAttribute("[data-sheet-hash]", "data-sheet-hash");
    if (!hash) throw new Error(`${key}: no sheet on the print page`);
    if (!all && manifest[key] === hash && fs.existsSync(file)) continue;
    // The same fit the print window gets (public/print.js): a sheet too tall for one page is scaled down.
    await page.waitForFunction(() => typeof window.liftsmithFitSheet === "function");
    await page.evaluate(async () => {
      await document.fonts.ready;
      window.liftsmithFitSheet();
    });
    const pdf = await page.pdf({ format: lang === "en" ? "Letter" : "A4", printBackground: true, tagged: true, outline: false });
    const n = pagesIn(pdf);
    if (n !== 1) throw new Error(`${key}: the sheet printed on ${n} pages, not one`);
    fs.writeFileSync(file, pdf);
    manifest[key] = hash;
    drawn++;
    console.log(`${file} (${Math.round(pdf.length / 1024)} KB)`);
  }
}
if (process.argv.includes("--email")) {
  const shot = await browser.newPage({ viewport: { width: 760, height: 1100 }, deviceScaleFactor: 2 });
  for (const lang of LANGS) {
    await shot.goto(`${server.url}${lang === "en" ? "" : `/${lang}`}/programs/dumbbell-full-body/print/`, { waitUntil: "load" });
    await shot.evaluate(() => document.fonts.ready);
    const png = await shot.locator(".ps-sheet").screenshot();
    const file = `public/email/${lang}/w/printable-plans.jpg`;
    await sharp(png).resize({ width: 600 }).jpeg({ quality: 70, mozjpeg: true }).toFile(file);
    console.log(file);
  }
}
// Keys sorted, so the file only changes where a PDF did.
fs.writeFileSync(
  MANIFEST,
  `${JSON.stringify(Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`,
);
console.log(`${drawn} PDF${drawn === 1 ? "" : "s"} drawn, ${ids.length * LANGS.length - drawn} already current.`);
await browser.close();
server.close();
