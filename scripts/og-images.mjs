// Social preview cards (public/og/**/*.jpg, 1200×630) and exercise stills (public/stills/<id>.webp) from the
// app's own 3D figure. The card list comes from ogCards() in src/lib/ogImages.ts, read from the build-only
// /stills/ page, so a new exercise, article or tool gets its card the next time this runs:
//   STILLS=1 npm run build:static && PW_CHROMIUM=/opt/pw-browsers/chromium node scripts/og-images.mjs
// Run it again after adding pages (seo.test.ts fails when a page's card is missing) or changing the figure.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

import { serve } from "./helpers.mjs";

const OG = "public/og";
const STILLS = "public/stills";
const W = 1200;
const H = 630;

const server = await serve();
const browser = await chromium.launch({
  ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}),
  // SwiftShader gives headless Chromium WebGL; the flag below makes the site treat it as a GPU.
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage();
await page.addInitScript(() => {
  window.__liftsmithForceWebGL = true;
});
await page.goto(`${server.url}/stills/`);
await page.waitForFunction(() => window.__still && window.__ogCards, null, { timeout: 30_000 });
const cards = await page.evaluate(() => window.__ogCards);

/** Each exercise's figure, drawn once: male and female in turn so both figures appear across the site. */
const figures = new Map();
const ids = [...new Set(cards.map((c) => c.exercise))];
const exerciseIds = cards.filter((c) => c.file.startsWith("exercises/")).map((c) => c.exercise);
for (const [i, id] of [...new Set([...exerciseIds, ...ids])].entries()) {
  const url = await page.evaluate(([id, body]) => window.__still(id, body, 900), [id, i % 2 ? "female" : "male"]);
  if (!url) throw new Error(`No figure for ${id}`);
  figures.set(id, Buffer.from(url.split(",")[1], "base64"));
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Splits a title into lines of at most `max` characters, at spaces. */
function wrap(text, max) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && (line + " " + word).length > max) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

function titleLines(title) {
  for (const [size, max] of [
    [68, 16],
    [58, 19],
    [50, 22],
    [44, 25],
  ]) {
    const lines = wrap(title, max);
    if (lines.length <= 4) return { size, lines };
  }
  return { size: 40, lines: wrap(title, 28).slice(0, 5) };
}

const logo = await sharp("public/icon.svg").resize(56, 56).png().toBuffer();

function background(card) {
  const { size, lines } = titleLines(card.title);
  const top = 236;
  const text = lines
    .map(
      (l, i) =>
        `<text x="72" y="${top + 24 + size * 0.8 + i * size * 1.12}" font-size="${size}" font-weight="800" fill="#f2f5fa">${esc(l)}</text>`,
    )
    .join("");
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="Inter, 'DejaVu Sans', sans-serif">
    <defs>
      <radialGradient id="g" cx="78%" cy="30%" r="60%"><stop offset="0" stop-color="#4c8dff" stop-opacity="0.32"/><stop offset="1" stop-color="#4c8dff" stop-opacity="0"/></radialGradient>
      <radialGradient id="v" cx="95%" cy="100%" r="50%"><stop offset="0" stop-color="#a78bfa" stop-opacity="0.18"/><stop offset="1" stop-color="#a78bfa" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="#0a0d12"/>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <rect width="${W}" height="${H}" fill="url(#v)"/>
    <text x="144" y="99" font-size="34" font-weight="800" fill="#f2f5fa">Liftsmith</text>
    <text x="72" y="${top - 30}" font-size="24" font-weight="700" letter-spacing="2" fill="#7fb0ff">${esc(card.kicker.toUpperCase())}</text>
    ${text}
    <text x="72" y="${H - 64}" font-size="24" fill="#9aa6b8">www.getliftsmith.com</text>
  </svg>`);
}

let n = 0;
for (const card of cards) {
  const fig = figures.get(card.exercise);
  const figure = await sharp(fig).resize(500, 560, { fit: "inside" }).toBuffer();
  const meta = await sharp(figure).metadata();
  const out = path.join(OG, card.file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp(background(card))
    .composite([
      { input: logo, left: 72, top: 60 },
      { input: figure, left: Math.round(910 - meta.width / 2), top: Math.round(H / 2 - meta.height / 2) },
    ])
    .jpeg({ quality: 72, mozjpeg: true })
    .toFile(out);
  n++;
}

// The still on each exercise page: the figure alone, on a transparent ground, 320 px (shown at 160).
fs.mkdirSync(STILLS, { recursive: true });
for (const id of new Set(exerciseIds))
  await sharp(figures.get(id))
    .resize(320, 320, { fit: "inside" })
    .webp({ quality: 60, alphaQuality: 60 })
    .toFile(path.join(STILLS, `${id}.webp`));

console.log(`${n} cards in ${OG}, ${new Set(exerciseIds).size} stills in ${STILLS}`);
await browser.close();
server.close();
