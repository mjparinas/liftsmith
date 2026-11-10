// Step 2 of the Google Play listing art: frames the raw screens from play-capture.mjs with a caption, and
// draws the 1024×500 feature graphic. Everything is HTML rendered by Playwright, in the app's own tokens and
// font, so the art follows the visual design system. Output in store/play/:
//   phone/NN-name.jpg     1080×1920 (9:16, the size Play needs for promotion)
//   tablet-7/NN-name.jpg  1080×1920
//   tablet-10/NN-name.jpg 1440×2560
//   feature-graphic.png   1024×500
// Captions live in SHOTS below and in docs/PLAY_LISTING.md; keep them the same.
//   node scripts/play-compose.mjs
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = "store/play";
const RAW = `${ROOT}/raw`;

export const PHONE_SHOTS = [
  ["today", "Your workout, already planned", "Built from your gym, your recovery and your training block"],
  ["today-plan", "Every exercise says why", "Recovery, weekly sets and last time, in plain words"],
  ["workout", "One tap logs the set", "Target weight, plates per side and a 3D demo of every lift"],
  ["why", "Why this weight?", "Tap to see the rule behind every number", "bottom"],
  ["rest", "The rest timer runs itself", "Load the next set's plates while you rest", "bottom"],
  ["recovery", "See what's recovered", "Every muscle, from your own sets"],
  ["progress", "Your coach says what to do next", "Spot stalls and short muscles early, fix them in one tap"],
  ["done", "PRs, levels and badges", "Every workout moves you forward"],
];
export const TABLET_SHOTS = [
  ["today-tablet", "Your workout, already planned", "Built from your gym, your recovery and your training block"],
  ["today-plan-tablet", "Every exercise says why", "Recovery, weekly sets and last time, in plain words"],
  ["recovery-tablet", "See what's recovered", "Every muscle, from your own sets"],
  ["progress-tablet", "Your coach says what to do next", "Spot stalls and short muscles early, fix them in one tap"],
  ["progress-dots-tablet", "One-rep max, DOTS and PRs", "Estimated from every set you log"],
  ["tdee-result-tablet", "Calories that keep up with you", "TDEE from your weigh-ins and how often you train"],
  ["achievements-tablet", "Quests, streaks and 150+ badges", "Streaks count weeks, so rest days never break them"],
];

const TOKENS = `
  :root { --bg:#080b10; --ink:#eef2f7; --muted:#94a1b2; --accent:#4c8dff; --violet:#a78bfa; --cyan:#38d6e8; --ember:#ff8a3d; --mint:#34d399; --line:#232d3a; }
  * { margin:0; box-sizing:border-box; }
  html, body { width:100%; height:100%; background:var(--bg); color:var(--ink); font-family:"Inter","Roboto",system-ui,sans-serif; -webkit-font-smoothing:antialiased; overflow:hidden; }
  .aurora { position:absolute; inset:0; background:
    radial-gradient(60% 40% at 15% 0%, rgba(76,141,255,.35), transparent 70%),
    radial-gradient(50% 35% at 90% 10%, rgba(167,139,250,.28), transparent 70%),
    radial-gradient(70% 40% at 50% 100%, rgba(56,214,232,.10), transparent 70%); }
  .grad { background:linear-gradient(100deg,#5b9cff,#9b86ff); -webkit-background-clip:text; background-clip:text; color:transparent; }
`;

function frameHtml(img, title, sub, { tablet = false, pos = "top" } = {}) {
  const w = tablet ? 860 : 800;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${TOKENS}
    .cap { position:absolute; left:72px; right:72px; top:110px; text-align:center; }
    h1 { font-size:68px; line-height:1.05; font-weight:800; letter-spacing:-0.02em; }
    p { margin-top:26px; font-size:36px; line-height:1.3; color:var(--muted); }
    .dev { position:absolute; left:50%; top:${tablet ? 470 : 500}px; width:${w}px; transform:translateX(-50%);
      border-radius:${tablet ? 44 : 64}px; padding:${tablet ? 18 : 16}px; background:linear-gradient(160deg,#2a3443,#121821);
      box-shadow:0 0 0 2px #3a4656, 0 40px 120px rgba(0,0,0,.6), 0 0 160px rgba(76,141,255,.18); }
    .win { height:${tablet ? 1500 : 1470}px; overflow:hidden; border-radius:${tablet ? 28 : 50}px; }
    .dev img { display:block; width:100%; height:100%; object-fit:cover; object-position:${pos}; }
  </style></head><body><div class="aurora"></div>
    <div class="cap"><h1>${title}</h1><p>${sub}</p></div>
    <div class="dev"><div class="win"><img src="${img}"></div></div>
  </body></html>`;
}

function featureHtml(icon, shots) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${TOKENS}
    .l { position:absolute; left:64px; top:0; bottom:0; width:470px; display:flex; flex-direction:column; justify-content:center; }
    .brand { display:flex; align-items:center; gap:20px; }
    .brand img { width:88px; height:88px; border-radius:22px; box-shadow:0 0 0 1px #2a3443; }
    .brand b { font-size:56px; font-weight:800; letter-spacing:-0.02em; }
    h1 { margin-top:30px; font-size:44px; line-height:1.08; font-weight:800; letter-spacing:-0.02em; }
    p { margin-top:16px; font-size:22px; line-height:1.35; color:var(--muted); }
    .ph { position:absolute; width:250px; border-radius:30px; padding:8px; background:linear-gradient(160deg,#2a3443,#121821);
      box-shadow:0 0 0 1px #3a4656, 0 30px 80px rgba(0,0,0,.6); }
    .ph img { display:block; width:100%; border-radius:23px; }
  </style></head><body><div class="aurora"></div>
    <div class="l">
      <div class="brand"><img src="${icon}"><b>Liftsmith</b></div>
      <h1>Your next set,<br><span class="grad">already planned.</span></h1>
      <p>Adaptive strength workouts that explain every weight.</p>
    </div>
    <div class="ph" style="left:560px;top:120px;transform:rotate(-6deg)"><img src="${shots[0]}"></div>
    <div class="ph" style="left:760px;top:40px;transform:rotate(4deg)"><img src="${shots[1]}"></div>
  </body></html>`;
}

const url = (f) => "file://" + path.resolve(f);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
async function render(html, out, { width, height, scale = 1 }) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale });
  const page = await ctx.newPage();
  const tmp = path.resolve(`${ROOT}/.render.html`);
  fs.writeFileSync(tmp, html);
  await page.goto(url(tmp));
  await page.waitForLoadState("networkidle");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, ...(out.endsWith(".jpg") ? { type: "jpeg", quality: 92 } : {}) });
  await ctx.close();
  fs.rmSync(tmp);
  console.log(`  ${out}`);
}

const n = (i) => String(i + 1).padStart(2, "0");
for (const [i, [name, title, sub, pos]] of PHONE_SHOTS.entries()) {
  await render(frameHtml(url(`${RAW}/${name}.png`), title, sub, { pos }), `${ROOT}/phone/${n(i)}-${name}.jpg`, {
    width: 1080,
    height: 1920,
  });
}
for (const [i, [name, title, sub]] of TABLET_SHOTS.entries()) {
  const html = frameHtml(url(`${RAW}/${name}.png`), title, sub, { tablet: true });
  const base = name.replace(/-tablet$/, "");
  await render(html, `${ROOT}/tablet-7/${n(i)}-${base}.jpg`, { width: 1080, height: 1920 });
  await render(html, `${ROOT}/tablet-10/${n(i)}-${base}.jpg`, { width: 1080, height: 1920, scale: 4 / 3 });
}
const icon = fs.existsSync(`${ROOT}/icon-512.png`) ? `${ROOT}/icon-512.png` : "public/icon.svg";
await render(featureHtml(url(icon), [url(`${RAW}/today.png`), url(`${RAW}/workout.png`)]), `${ROOT}/feature-graphic.png`, {
  width: 1024,
  height: 500,
});
await browser.close();
