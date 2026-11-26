// The picture in the Wear OS emails (Getting started's watch step, src/server/tour.ts, and the weekly "watches" tip):
// the watch app's own screens, framed with a caption like the Play listing shots (play-compose.mjs). The screens in
// store/wear/<lang>/ (set, rest, start) are the Wear OS app's real layout, strings and drawables drawn by Android's
// own renderer (scripts/wear-shots/, Paparazzi), with the phone's words for each language.
//   (cd scripts/wear-shots && gradle :watch:recordPaparazziDebug) && node scripts/email-watch.mjs
// Writes public/email/<lang>/09.jpg and public/email/<lang>/w/watches.jpg, 600 px wide like the other email pictures.
// The caption's title is the email's own (rmd.tour.watch.title); keep them the same.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const CAPTIONS = {
  en: ["Your workout on your Wear OS watch", "Log sets and rest from your wrist"],
  es: ["Tu entrenamiento en tu reloj Wear OS", "Registra series y descansos desde la muñeca"],
  fr: ["Votre séance sur votre montre Wear OS", "Séries et repos au poignet"],
  de: ["Dein Training auf deiner Wear-OS-Uhr", "Sätze und Pausen am Handgelenk"],
  it: ["Il tuo allenamento sul tuo orologio Wear OS", "Serie e riposo dal polso"],
  ja: ["Wear OS のスマートウォッチでトレーニング", "セットと休憩を手首で"],
  pt: ["Seu treino no seu relógio Wear OS", "Séries e descanso no pulso"],
  ko: ["Wear OS 워치에서 운동하세요", "세트와 휴식을 손목에서"],
  pl: ["Trening na zegarku z Wear OS", "Serie i przerwy na nadgarstku"],
  tr: ["Antrenmanın Wear OS saatinde", "Setler ve dinlenme bileğinde"],
};

const RAW = "scripts/wear-shots/watch/src/test/snapshots/images";
// Copy fresh renders from the Paparazzi rig, when there are any, into store/wear/<lang>/.
if (fs.existsSync(RAW))
  for (const f of fs.readdirSync(RAW)) {
    const m = f.match(/_(\w+)-(set|rest|start)\.png$/);
    if (!m) continue;
    fs.mkdirSync(`store/wear/${m[1]}`, { recursive: true });
    fs.copyFileSync(`${RAW}/${f}`, `store/wear/${m[1]}/${m[2]}.png`);
  }

const url = (f) => "file://" + path.resolve(f);
const html = (lang, [title, sub]) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
  :root { --bg:#080b10; --ink:#eef2f7; --muted:#94a1b2; }
  * { margin:0; box-sizing:border-box; }
  html, body { width:100%; height:100%; background:var(--bg); color:var(--ink); font-family:"Inter","Roboto",system-ui,sans-serif; -webkit-font-smoothing:antialiased; overflow:hidden; }
  :lang(ja) body { font-family:"Inter","Roboto","Hiragino Sans","Noto Sans CJK JP","Noto Sans JP",system-ui,sans-serif; }
  :lang(ja) h1, :lang(ja) p { line-break:strict; word-break:auto-phrase; }
  :lang(ko) body { font-family:"Inter","Roboto","Apple SD Gothic Neo","Noto Sans CJK KR","Noto Sans KR",system-ui,sans-serif; }
  :lang(ko) h1, :lang(ko) p { word-break:keep-all; }
  .aurora { position:absolute; inset:0; background:
    radial-gradient(60% 40% at 15% 0%, rgba(76,141,255,.35), transparent 70%),
    radial-gradient(50% 35% at 90% 10%, rgba(167,139,250,.28), transparent 70%),
    radial-gradient(70% 40% at 50% 100%, rgba(56,214,232,.10), transparent 70%); }
  .cap { position:absolute; left:72px; right:72px; top:110px; text-align:center; }
  h1 { font-size:68px; line-height:1.05; font-weight:800; letter-spacing:-0.02em; }
  p { margin-top:26px; font-size:36px; line-height:1.3; color:var(--muted); }
  .w { position:absolute; border-radius:50%; padding:22px; background:linear-gradient(160deg,#2a3443,#121821);
    box-shadow:0 0 0 2px #3a4656, 0 40px 120px rgba(0,0,0,.6), 0 0 160px rgba(76,141,255,.18); }
  .w img { display:block; width:100%; height:100%; border-radius:50%; background:#080b10; }
</style></head><body><div class="aurora"></div>
  <div class="cap"><h1>${title}</h1><p>${sub}</p></div>
  <div class="w" style="left:230px;top:500px;width:620px;height:620px"><img src="${url(`store/wear/${lang}/set.png`)}"></div>
  <div class="w" style="left:70px;top:1250px;width:440px;height:440px"><img src="${url(`store/wear/${lang}/rest.png`)}"></div>
  <div class="w" style="left:570px;top:1250px;width:440px;height:440px"><img src="${url(`store/wear/${lang}/start.png`)}"></div>
</body></html>`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 } });
const page = await ctx.newPage();
const tmp = path.resolve("store/wear/.render.html");
for (const [lang, cap] of Object.entries(CAPTIONS)) {
  fs.writeFileSync(tmp, html(lang, cap));
  await page.goto(url(tmp));
  await page.waitForLoadState("networkidle");
  const shot = await page.screenshot({ type: "png" });
  const out = `public/email/${lang}`;
  fs.mkdirSync(`${out}/w`, { recursive: true });
  const jpg = await sharp(shot).resize({ width: 600 }).jpeg({ quality: 72, mozjpeg: true }).toBuffer();
  fs.writeFileSync(`${out}/09.jpg`, jpg);
  fs.writeFileSync(`${out}/w/watches.jpg`, jpg);
  console.log(`  ${out}/09.jpg, ${out}/w/watches.jpg`);
}
fs.rmSync(tmp);
await browser.close();
