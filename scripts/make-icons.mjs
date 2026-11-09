#!/usr/bin/env node
// Draws every Liftsmith icon from one mark (decision in AGENTS.md, "App icon and favicon").
//
// The mark is an anvil with a loaded barbell resting on it ("smith" + "lift"), in the brand's
// blue-to-violet gradient on the deep navy background, with the soft top glow every app screen has.
// One drawing feeds every platform, so they can't drift:
//   web       public/icon.svg (favicon), favicon.ico, apple-touch-icon.png, icon-192/512.png,
//             icon-maskable-512.png, icon-mono.svg (Safari pinned tab / monochrome)
//   Android   adaptive icon (vector background with the glow, foreground and a monochrome layer for
//             Android 13+ themed icons), legacy square and round PNGs, splash screens
//   iOS       AppIcon with light, dark and tinted images (iOS 18), splash
//   themes    the earned icons (themes.ts: forge, glacier, aurora, royal) on both platforms, each
//             with its own colours and the same dark, tinted and monochrome variants
// Run it after changing the mark: node scripts/make-icons.mjs (needs Playwright's Chromium and
// ImageMagick for favicon.ico).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const RES = path.join(ROOT, "android/app/src/main/res");
const XC = path.join(ROOT, "ios/App/App/Assets.xcassets");
const PUB = path.join(ROOT, "public");

// The mark, on a 1024 grid. Its bounding box is 206..804 by 196..794, centred on 505, 495.
const MARK = `
  <rect x="226" y="302" width="572" height="36" rx="18"/>
  <rect x="280" y="196" width="68" height="248" rx="20"/>
  <rect x="676" y="196" width="68" height="248" rx="20"/>
  <rect x="358" y="236" width="40" height="168" rx="14"/>
  <rect x="626" y="236" width="40" height="168" rx="14"/>
  <path d="M206 478C206 470 214 466 224 466C300 466 340 458 372 458L788 458Q804 458 804 474L804 534Q804 550 788 550C724 550 676 572 652 612L644 646L712 680Q726 688 726 704L726 778Q726 794 710 794L314 794Q298 794 298 778L298 704Q298 688 312 680L380 646L372 612C356 580 320 560 276 546C232 532 206 506 206 478Z"/>`;
const CX = 505;
const CY = 495;
// Distance from the mark's centre to its farthest corner (the plates' top corners).
const REACH = 392;

// Default: the app's own tokens (globals.css: --color-bg, --grad-a/b/c, --color-accent).
// Themes: the colours scripts/make-theme-icons.py used, matching THEMES in src/lib/themes.ts.
const PALETTES = {
  default: { bg: "#080b10", glow: "#4c8dff", stops: ["#5b9cff", "#7f8bff", "#9b86ff"] },
  forge: { bg: "#140d0a", glow: "#ff7a3d", stops: ["#ffb15c", "#ff8a45", "#ff5a2e"] },
  glacier: { bg: "#08121a", glow: "#5fd4ff", stops: ["#c8f2ff", "#84dcff", "#3fc4ff"] },
  aurora: { bg: "#0b0d18", glow: "#3ee0a8", stops: ["#3ee0a8", "#64a6d4", "#8b6bff"] },
  royal: { bg: "#120b1b", glow: "#e0a42a", stops: ["#ffe08a", "#f0c25a", "#e0a42a"] },
};
const TINT_STOPS = ["#ffffff", "#f2f2f2", "#d9d9d9"];

/** The mark scaled by `s` about its centre and moved to the middle of a 1024 canvas. */
function placed(s, fill) {
  return `<g fill="${fill}" transform="translate(512 512) scale(${s}) translate(${-CX} ${-CY})">${MARK}</g>`;
}

function defs(p, stops = p.stops) {
  return `<defs>
    <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="206" y1="196" x2="804" y2="794">
      <stop offset="0" stop-color="${stops[0]}"/><stop offset=".55" stop-color="${stops[1]}"/><stop offset="1" stop-color="${stops[2]}"/>
    </linearGradient>
    <radialGradient id="glow" gradientUnits="userSpaceOnUse" cx="512" cy="0" r="920">
      <stop offset="0" stop-color="${p.glow}" stop-opacity=".34"/><stop offset="1" stop-color="${p.glow}" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
}

/**
 * One icon as SVG on a 1024 canvas.
 * kind: full (background and mark), mark (mark only, transparent), tint (grey mark, transparent),
 * mono (white mark, transparent). `scale` shrinks the mark for safe zones; `radius` rounds the corners.
 */
function svg(p, { kind = "full", scale = 1, radius = 0 } = {}) {
  const bg =
    kind === "full"
      ? `<rect width="1024" height="1024" rx="${radius}" fill="${p.bg}"/><rect width="1024" height="1024" rx="${radius}" fill="url(#glow)"/>`
      : "";
  const fill = kind === "mono" ? "#ffffff" : "url(#g)";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">${defs(p, kind === "tint" ? TINT_STOPS : p.stops)}${bg}${placed(scale, fill)}</svg>`;
}

/** Splash: the mark small in the middle of a plain background, any aspect ratio. */
function splash(p, w, h) {
  const s = (Math.min(w, h) * 0.26) / 598;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${defs(p)}<rect width="${w}" height="${h}" fill="${p.bg}"/><g transform="translate(${w / 2} ${h / 2}) scale(${s}) translate(${-CX} ${-CY})"><g fill="url(#g)">${MARK}</g></g></svg>`;
}

// Android adaptive icons: 108 dp canvas, of which the launcher always shows the middle 66 dp circle.
const SAFE = (33 / 108) * 1024; // safe radius on a 1024 canvas
const FG_SCALE = (SAFE * 0.9) / REACH;
// Web maskable icons keep a centre circle of 40% radius.
const MASKABLE_SCALE = (0.4 * 1024 * 0.96) / REACH;
const DENSITY = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

let page;
async function png(svgText, file, size, { opaque = false } = {}) {
  const [w, h] = Array.isArray(size) ? size : [size, size];
  await page.setViewportSize({ width: w, height: h });
  const inner = svgText.replace(/width="\d+" height="\d+"/, `width="${w}" height="${h}"`);
  await page.setContent(`<html><body style="margin:0;background:transparent">${inner}</body></html>`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, omitBackground: !opaque, clip: { x: 0, y: 0, width: w, height: h } });
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

/** The adaptive icon's background: the theme colour with the top glow, as a vector (sharp at any size). */
function backgroundXml(p) {
  const hex = (c, a) => `#${a}${c.slice(1)}`;
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- Drawn by scripts/make-icons.mjs -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:aapt="http://schemas.android.com/aapt"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path android:pathData="M0,0h108v108h-108z" android:fillColor="${p.bg}" />
    <path android:pathData="M0,0h108v108h-108z">
        <aapt:attr name="android:fillColor">
            <gradient android:type="radial" android:centerX="54" android:centerY="0" android:gradientRadius="97"
                android:startColor="${hex(p.glow, "57")}" android:endColor="${hex(p.glow, "00")}" />
        </aapt:attr>
    </path>
</vector>
`;
}

function adaptiveXml(name) {
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- Drawn by scripts/make-icons.mjs -->
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/${name}_background"/>
    <foreground android:drawable="@mipmap/${name}_foreground"/>
    <monochrome android:drawable="@mipmap/${name}_monochrome"/>
</adaptive-icon>
`;
}

function iosContents(prefix) {
  const img = (file, appearance) => ({
    ...(appearance ? { appearances: [{ appearance: "luminosity", value: appearance }] } : {}),
    filename: `${prefix}${file}`,
    idiom: "universal",
    platform: "ios",
    size: "1024x1024",
  });
  return (
    JSON.stringify(
      { images: [img(".png"), img("-dark.png", "dark"), img("-tinted.png", "tinted")], info: { author: "xcode", version: 1 } },
      null,
      2,
    ) + "\n"
  );
}

async function androidSet(name, p, { legacy }) {
  for (const [dens, k] of Object.entries(DENSITY)) {
    const dir = path.join(RES, `mipmap-${dens}`);
    await png(svg(p, { kind: "mark", scale: FG_SCALE }), path.join(dir, `${name}_foreground.png`), 108 * k);
    await png(svg(p, { kind: "mono", scale: FG_SCALE }), path.join(dir, `${name}_monochrome.png`), 108 * k);
    if (legacy) {
      // Android 7 (API 24-25) has no adaptive icons: a rounded square and a circle.
      await png(svg(p, { scale: 0.8, radius: 180 }), path.join(dir, `${name}.png`), 48 * k);
      await png(svg(p, { scale: 0.74, radius: 512 }), path.join(dir, `${name}_round.png`), 48 * k);
    }
  }
  write(path.join(RES, `drawable/${name}_background.xml`), backgroundXml(p));
  write(path.join(RES, `mipmap-anydpi-v26/${name}.xml`), adaptiveXml(name));
}

async function iosSet(dir, prefix, p) {
  const d = path.join(XC, dir);
  for (const f of fs.readdirSync(d)) if (f.endsWith(".png")) fs.rmSync(path.join(d, f));
  // iOS masks the corners itself, so the image is a full square with no transparency.
  await png(svg(p, { scale: 1.0 }), path.join(d, `${prefix}.png`), 1024, { opaque: true });
  // Dark: iOS draws its own dark background behind a transparent image.
  await png(svg(p, { kind: "mark", scale: 1.0 }), path.join(d, `${prefix}-dark.png`), 1024);
  // Tinted: a grey image that iOS tints with the user's colour.
  await png(svg(p, { kind: "tint", scale: 1.0 }), path.join(d, `${prefix}-tinted.png`), 1024);
  write(path.join(d, "Contents.json"), iosContents(prefix));
}

async function main() {
  // PW_CHROMIUM: a Chromium binary when the installed Playwright has no browser of its own.
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  page = await browser.newPage();
  const p = PALETTES.default;

  // Web.
  write(path.join(PUB, "icon.svg"), svg(p, { radius: 224 }).replace(/ width="1024" height="1024"/, "") + "\n");
  write(path.join(PUB, "icon-mono.svg"), svg(p, { kind: "mono" }).replace(/ width="1024" height="1024"/, "").replace("#ffffff", "#000000") + "\n");
  await png(svg(p), path.join(PUB, "apple-touch-icon.png"), 180, { opaque: true });
  await png(svg(p, { radius: 224 }), path.join(PUB, "icon-192.png"), 192);
  await png(svg(p, { radius: 224 }), path.join(PUB, "icon-512.png"), 512);
  await png(svg(p, { scale: MASKABLE_SCALE }), path.join(PUB, "icon-maskable-512.png"), 512, { opaque: true });
  const tmp = fs.mkdtempSync(path.join(ROOT, ".icons-"));
  try {
    const sizes = [16, 32, 48];
    for (const s of sizes) await png(svg(p, { radius: 224, scale: 1.12 }), path.join(tmp, `${s}.png`), s);
    execFileSync("convert", [...sizes.map((s) => path.join(tmp, `${s}.png`)), path.join(PUB, "favicon.ico")]);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  // Android and iOS, the default icon and each earned theme icon.
  await androidSet("ic_launcher", p, { legacy: true });
  write(path.join(RES, "mipmap-anydpi-v26/ic_launcher_round.xml"), adaptiveXml("ic_launcher"));
  await iosSet("AppIcon.appiconset", "icon", p);
  for (const [name, tp] of Object.entries(PALETTES)) {
    if (name === "default") continue;
    await androidSet(`ic_launcher_${name}`, tp, { legacy: false });
    await iosSet(`AppIcon-${name}.appiconset`, "icon", tp);
  }

  // Splash screens: the same files Capacitor made, redrawn in the brand colours.
  for (const dir of fs.readdirSync(RES)) {
    const f = path.join(RES, dir, "splash.png");
    if (!dir.startsWith("drawable") || !fs.existsSync(f)) continue;
    const [w, h] = execFileSync("identify", ["-format", "%w %h", f]).toString().split(" ").map(Number);
    await png(splash(p, w, h), f, [w, h], { opaque: true });
  }
  for (const f of fs.readdirSync(path.join(XC, "Splash.imageset"))) {
    if (f.endsWith(".png")) await png(splash(p, 2732, 2732), path.join(XC, "Splash.imageset", f), 2732, { opaque: true });
  }
  await browser.close();
}

await main();
