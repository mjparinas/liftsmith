// The Google Play promo video (store/play/promo-video.mp4, 1920×1080, about 30 s, no audio): a title card,
// one scene per storyboard beat built from the real screens in store/play/raw, and an end card. Scenes are
// HTML rendered by Playwright, then ffmpeg adds a slow push-in and crossfades. The storyboard is in
// docs/PLAY_LISTING.md; keep SCENES the same. Play takes the video as a YouTube link, so upload the file to
// YouTube (unlisted is fine) and paste the link in Play Console.
//   node scripts/play-capture.mjs && node scripts/play-video.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = "store/play";
const RAW = `${ROOT}/raw`;
const TMP = "e2e-shots/play-video";
fs.mkdirSync(TMP, { recursive: true });

// [raw screen, kicker, headline, line, image position]
const SCENES = [
  ["today", "Plan", "Your workout, already planned", "From your gym's equipment, your recovery and your training block.", "top"],
  ["today-plan", "Explain", "Every exercise says why", "Recovery, weekly sets and last time, in plain words.", "top"],
  ["workout", "Lift", "One tap logs the set", "Target weight, plates per side and a 3D demo of the lift.", "top"],
  ["rest", "Rest", "The timer runs itself", "Load the next set's plates while you rest.", "bottom"],
  ["why", "Trust", "Why this weight?", "Every number shows the rule behind it.", "bottom"],
  ["recovery", "Recover", "See what's recovered", "Every muscle, from your own sets.", "top"],
  ["progress", "Improve", "Your coach says what to do next", "Stalls and short muscles, fixed in one tap.", "top"],
  ["done", "Celebrate", "PRs, levels and badges", "Every workout moves you forward.", "top"],
];
const SCENE_S = 3.6;
const CARD_S = 3;
const FADE = 0.5;

const TOKENS = `
  * { margin:0; box-sizing:border-box; }
  html, body { width:100%; height:100%; background:#080b10; color:#eef2f7; font-family:"Inter","Roboto",system-ui,sans-serif; -webkit-font-smoothing:antialiased; overflow:hidden; }
  .aurora { position:absolute; inset:0; background:
    radial-gradient(50% 50% at 10% 0%, rgba(76,141,255,.35), transparent 70%),
    radial-gradient(40% 45% at 95% 15%, rgba(167,139,250,.28), transparent 70%),
    radial-gradient(60% 40% at 50% 110%, rgba(56,214,232,.12), transparent 70%); }
  .grad { background:linear-gradient(100deg,#5b9cff,#9b86ff); -webkit-background-clip:text; background-clip:text; color:transparent; }
`;
const url = (f) => "file://" + path.resolve(f);

const scene = (img, kicker, title, line, pos) => `<!doctype html><html><head><meta charset="utf-8"><style>${TOKENS}
  .t { position:absolute; left:150px; top:0; bottom:0; width:820px; display:flex; flex-direction:column; justify-content:center; }
  .k { font-size:30px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; }
  h1 { margin-top:22px; font-size:88px; line-height:1.04; font-weight:800; letter-spacing:-0.025em; }
  p { margin-top:30px; font-size:38px; line-height:1.35; color:#94a1b2; }
  .dev { position:absolute; right:190px; top:90px; width:520px; padding:12px; border-radius:46px; background:linear-gradient(160deg,#2a3443,#121821);
    box-shadow:0 0 0 2px #3a4656, 0 40px 120px rgba(0,0,0,.6), 0 0 160px rgba(76,141,255,.2); }
  .win { height:1100px; overflow:hidden; border-radius:36px; }
  .win img { display:block; width:100%; height:100%; object-fit:cover; object-position:${pos}; }
</style></head><body><div class="aurora"></div>
  <div class="t"><div class="k grad">${kicker}</div><h1>${title}</h1><p>${line}</p></div>
  <div class="dev"><div class="win"><img src="${img}"></div></div>
</body></html>`;

const card = (icon, title, line) => `<!doctype html><html><head><meta charset="utf-8"><style>${TOKENS}
  .c { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
  .brand { display:flex; align-items:center; gap:28px; }
  .brand img { width:130px; height:130px; border-radius:32px; box-shadow:0 0 0 1px #2a3443; }
  .brand b { font-size:96px; font-weight:800; letter-spacing:-0.025em; }
  h1 { margin-top:48px; font-size:80px; font-weight:800; letter-spacing:-0.025em; }
  p { margin-top:26px; font-size:38px; color:#94a1b2; }
</style></head><body><div class="aurora"></div>
  <div class="c"><div class="brand"><img src="${icon}"><b>Liftsmith</b></div><h1>${title}</h1><p>${line}</p></div>
</body></html>`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
async function still(html, out) {
  const f = path.resolve(`${TMP}/scene.html`);
  fs.writeFileSync(f, html);
  await page.goto(url(f));
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: out });
}
const icon = url(fs.existsSync(`${ROOT}/icon-512.png`) ? `${ROOT}/icon-512.png` : "public/icon.svg");
const stills = [];
await still(
  card(icon, `Your next set, <span class="grad">already planned.</span>`, "Adaptive strength training for Android"),
  `${TMP}/00.png`,
);
stills.push([`${TMP}/00.png`, CARD_S]);
for (const [i, [img, k, t, l, pos]] of SCENES.entries()) {
  const out = `${TMP}/${String(i + 1).padStart(2, "0")}.png`;
  await still(scene(url(`${RAW}/${img}.png`), k, t, l, pos), out);
  stills.push([out, SCENE_S]);
}
await still(card(icon, `Lift with a plan.`, "Get Liftsmith on Google Play"), `${TMP}/99.png`);
stills.push([`${TMP}/99.png`, CARD_S + 0.5]);
await browser.close();

// Each still becomes a clip with a gentle push-in, then the clips crossfade into one another.
const FPS = 30;
const args = ["-y"];
for (const [f] of stills) args.push("-i", f);
const parts = stills.map(([, s], i) => {
  const frames = Math.round(s * FPS);
  return `[${i}:v]scale=3840:-2,zoompan=z='1+0.035*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=${FPS},format=yuv420p,setsar=1[v${i}]`;
});
let last = "v0";
let offset = 0;
for (let i = 1; i < stills.length; i++) {
  offset += stills[i - 1][1] - FADE;
  parts.push(`[${last}][v${i}]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(2)}[x${i}]`);
  last = `x${i}`;
}
args.push(
  "-filter_complex",
  parts.join(";"),
  "-map",
  `[${last}]`,
  "-c:v",
  "libx264",
  "-preset",
  "slow",
  "-crf",
  "20",
  "-pix_fmt",
  "yuv420p",
  "-movflags",
  "+faststart",
  `${ROOT}/promo-video.mp4`,
);
execFileSync("ffmpeg", args, { stdio: ["ignore", "ignore", "inherit"] });
console.log(`  ${ROOT}/promo-video.mp4`);
