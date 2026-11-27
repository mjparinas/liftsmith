// Pinterest pins and short clips from the app's own 3D figures (docs/decisions/pinterest.md). For each exercise it draws
// a tall pin (1000×1500 JPEG) and a 15-second vertical clip (1080×1920 MP4, H.264, no sound) on the build-only
// /pin-studio/ page (PinStudio.tsx), both showing three of the exercise's form cues and its page's address.
//
//   STILLS=1 npm run build:static
//   PW_CHROMIUM=/opt/pw-browsers/chromium node scripts/pins.mjs bench-press deadlift   # local: files in e2e-shots/pins/
//   node scripts/pins.mjs --upload --count 14     # the "Pins" workflow: the next 14 exercises, uploaded to the queue
//
// --upload asks www.getliftsmith.com which exercises already have pins, makes the next ones in pinOrder() (well-known
// lifts first), and hands each over through /api/pins/studio/ with the run's GitHub OIDC token (no secret needed).
// Needs ffmpeg.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

import { serve } from "./helpers.mjs";

const args = process.argv.slice(2);
const upload = args.includes("--upload");
const count = Number(args[args.indexOf("--count") + 1]) || 14;
const named = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--count");
const SITE = (process.env.PINS_SITE || "https://www.getliftsmith.com").replace(/\/$/, "");
const OUT = "e2e-shots/pins";
const FPS = 30;
const SECONDS = 15;

/** A fresh GitHub OIDC token for our audience (each lasts a few minutes, so one per call). */
async function oidc() {
  const url = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
  const token = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!url || !token) throw new Error("--upload runs in the Pins workflow (it needs permissions: id-token: write)");
  const r = await fetch(`${url}&audience=${encodeURIComponent(`${SITE}/pins`)}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`OIDC token: ${r.status}`);
  return (await r.json()).value;
}

async function studio(body) {
  const r = await fetch(`${SITE}/api/pins/studio/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await oidc()}` },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${body.action}: ${r.status} ${j.error ?? ""}`);
  return j;
}

const server = await serve();
const browser = await chromium.launch({
  ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}),
  // SwiftShader gives headless Chromium WebGL; the flag below makes the site treat it as a GPU (as og-images.mjs).
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.addInitScript(() => {
  window.__liftsmithForceWebGL = true;
});
await page.goto(`${server.url}/pin-studio/`);
await page.waitForFunction(() => window.__pinLoad && window.__pinOrder, null, { timeout: 30_000 });
const order = await page.evaluate(() => window.__pinOrder);

let todo;
if (named.length) todo = named;
else if (upload) {
  const state = await studio({ action: "made" });
  const made = new Set(state.made);
  // Each exercise makes two pins; stop at three weeks' worth waiting (pins.ts toMake), so the queue never piles up.
  const room = Math.max(0, Math.min(count, Math.ceil((21 * state.perDay - state.queued) / 2)));
  if (room < count) console.log(`${state.queued} pins already waiting at ${state.perDay} a day: making ${room}`);
  todo = order.filter((id) => !made.has(id)).slice(0, room);
} else todo = order.slice(0, count);
console.log(`Making ${todo.length}: ${todo.join(", ")}`);

/** Pipes JPEG frames into ffmpeg; resolves when the MP4 is written. */
function encoder(out) {
  const ff = spawn(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-"].concat([
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "24",
      "-pix_fmt",
      "yuv420p",
      "-r",
      String(FPS),
      "-movflags",
      "+faststart",
      out,
    ]),
    { stdio: ["pipe", "ignore", "inherit"] },
  );
  const done = new Promise((resolve, reject) => ff.on("close", (c) => (c === 0 ? resolve() : reject(new Error(`ffmpeg ${c}`)))));
  return {
    write: (buf) => new Promise((r) => (ff.stdin.write(buf) ? r() : ff.stdin.once("drain", r))),
    end: () => {
      ff.stdin.end();
      return done;
    },
  };
}

fs.mkdirSync(OUT, { recursive: true });
let made = 0;
for (const [i, id] of todo.entries()) {
  const body = i % 2 ? "female" : "male";
  const dir = path.join(OUT, id);
  fs.mkdirSync(dir, { recursive: true });
  const files = { image: path.join(dir, "pin.jpg"), video: path.join(dir, "clip.mp4"), cover: path.join(dir, "cover.jpg") };

  await page.setViewportSize({ width: 1000, height: 1500 });
  const pin = await page.evaluate(([id, body]) => window.__pinLoad(id, body, "pin"), [id, body]);
  if (!pin) {
    console.log(`  ${id}: no pin (no figure or fewer than three cues)`);
    continue;
  }
  fs.writeFileSync(files.image, await page.screenshot({ type: "jpeg", quality: 86 }));

  await page.setViewportSize({ width: 1080, height: 1920 });
  await page.evaluate(([id, body]) => window.__pinLoad(id, body, "clip"), [id, body]);
  const enc = encoder(files.video);
  for (let f = 0; f < FPS * SECONDS; f++) {
    const t = f / FPS;
    await page.evaluate((t) => window.__pinFrame(t), t);
    const shot = await page.screenshot({ type: "jpeg", quality: 90 });
    await enc.write(shot);
    // The cover: every cue and the address on screen, the figure mid-rep.
    if (f === FPS * 13) fs.writeFileSync(files.cover, shot);
  }
  await enc.end();
  console.log(`  ${id}: ${(fs.statSync(files.video).size / 1e6).toFixed(1)} MB clip`);

  if (upload) {
    const { put } = await import("@vercel/blob/client");
    const t = await studio({ action: "start", exercise: id });
    const send = async (file, slot, type) =>
      (await put(slot.path, fs.readFileSync(file), { access: "public", token: slot.token, contentType: type })).url;
    const image = await send(files.image, t.image, "image/jpeg");
    const video = await send(files.video, t.video, "video/mp4");
    const cover = await send(files.cover, t.cover, "image/jpeg");
    await studio({ action: "finish", exercise: id, image, video, cover });
    console.log(`  ${id}: queued`);
  }
  made++;
}

console.log(`${made} pins and clips${upload ? " queued" : ` in ${OUT}`}`);
await browser.close();
server.close();
