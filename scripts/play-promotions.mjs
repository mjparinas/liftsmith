// Google Play promotional content (Play Console › Grow users › Promotional content): one event at each training
// season's start and one for its double-points finale week. The text, dates and art paths live in
// store/play/promotions/events.json; this script writes docs/PLAY_PROMOTIONS.md from it (the page to paste from) and
// draws each event's 1920×1080 image from the app's own 3D figure in the season's colours.
//   node scripts/play-promotions.mjs --doc                       # only the doc (after editing the JSON)
//   STILLS=1 npm run build:static && PW_CHROMIUM=/opt/pw-browsers/chromium node scripts/play-promotions.mjs
// ONLY=s2-launch,s2-finale draws just those images. Play's rules for the art: no text or logo, nothing that looks like
// a button, keep the subject inside the safe zone (15% top, 20% bottom, 10% each side), no border, and not a plain
// white or dark grey background. src/lib/playPromotions.test.ts checks the text, the dates, the art and this doc.
import fs from "node:fs";
import path from "node:path";

const SOURCE = "store/play/promotions/events.json";
const DOC = "docs/PLAY_PROMOTIONS.md";

/** Each kit's colours, the same as the season's app icons (PALETTES in make-icons.mjs): launch art uses the free
 * theme's, finale art the Pro bonus row's. */
export const ART = {
  ember: { motif: "sparks", launch: "ember", finale: "embergold" },
  tempest: { motif: "bolts", launch: "tempest", finale: "tempestsilver" },
  bloom: { motif: "petals", launch: "bloom", finale: "bloommeadow" },
  solstice: { motif: "rays", launch: "solstice", finale: "solsticedusk" },
  maple: { motif: "leaves", launch: "maple", finale: "maplecopper" },
  obsidian: { motif: "shards", launch: "obsidian", finale: "obsidianice" },
};
const PALETTES = {
  ember: { bg: "#140a07", glow: "#ff6a3d", stops: ["#ffc06a", "#ff7a3d", "#e8402a"] },
  embergold: { bg: "#130d06", glow: "#ffb02e", stops: ["#fff0b0", "#ffcf5a", "#ff9a1f"] },
  tempest: { bg: "#0b0c17", glow: "#7c83ff", stops: ["#c9ccff", "#8f95ff", "#5a4fe8"] },
  tempestsilver: { bg: "#0c0e12", glow: "#d3dae6", stops: ["#ffffff", "#d3dae6", "#8e99a6"] },
  bloom: { bg: "#140a12", glow: "#ff7ae0", stops: ["#ffd0f2", "#ff8ae6", "#d24fd0"] },
  bloommeadow: { bg: "#08130c", glow: "#5be37a", stops: ["#d4ffb0", "#6fe885", "#22b866"] },
  solstice: { bg: "#121007", glow: "#ffe95c", stops: ["#fffbd0", "#ffe95c", "#ffb83d"] },
  solsticedusk: { bg: "#150a0e", glow: "#ff5f7e", stops: ["#ffc2a8", "#ff7a8a", "#d63a6e"] },
  maple: { bg: "#150909", glow: "#ff4d4d", stops: ["#ffb08a", "#ff5c4d", "#c41e2e"] },
  maplecopper: { bg: "#130d09", glow: "#e0915c", stops: ["#ffd2a8", "#e0915c", "#a8572e"] },
  obsidian: { bg: "#0a0812", glow: "#9d6bff", stops: ["#d8c4ff", "#9d6bff", "#5a2fd0"] },
  obsidianice: { bg: "#070e12", glow: "#a8f0ff", stops: ["#ffffff", "#a8f0ff", "#4fc4e8"] },
};
/** The lift each event's figure does: a different one for every event. */
const LIFT = {
  "s1-finale": "overhead-press",
  "s2-launch": "deadlift",
  "s2-finale": "pull-up",
  "s3-launch": "barbell-lunge",
  "s3-finale": "hip-thrust",
  "s4-launch": "power-clean",
  "s4-finale": "push-press",
  "s5-launch": "back-squat",
  "s5-finale": "barbell-row",
  "s6-launch": "sumo-deadlift",
  "s6-finale": "front-squat",
};

const LANG_NAMES = {
  en: "English (default)",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  ja: "日本語",
  pt: "Português (Brasil)",
  ko: "한국어",
  pl: "Polski",
  tr: "Türkçe",
};
const PLAY_LANGS = {
  en: "English (United States) en-US, the default",
  es: "es-ES, es-419, es-US",
  fr: "fr-FR, fr-CA",
  de: "de-DE",
  it: "it-IT",
  ja: "ja-JP",
  pt: "pt-BR, pt-PT",
  ko: "ko-KR",
  pl: "pl-PL",
  tr: "tr-TR",
};

const utc = (iso) => `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;

/** docs/PLAY_PROMOTIONS.md, built from the JSON so the two never drift. */
export function renderDoc(events) {
  const rows = events
    .map((e) => `| ${e.id} | ${e.kind === "launch" ? "Season start" : "Finale week"} | ${e.submitBy} | ${utc(e.start)} | ${utc(e.end)} |`)
    .join("\n");
  const blocks = events.map((e) => {
    const langs = Object.entries(e.text)
      .map(
        ([l, t]) =>
          `#### ${LANG_NAMES[l]}\n\nTagline (${[...t.tagline].length}/80): **${t.tagline}**\n\nDescription (${[...t.description].length}/500):\n\n\`\`\`text\n${t.description}\n\`\`\``,
      )
      .join("\n\n");
    return `### ${e.id}: ${e.text.en.tagline}

- Type: ${e.type}
- Starts ${utc(e.start)}, ends ${utc(e.end)}. Submit by ${e.submitBy}.
- Deep link: ${e.deepLink}
- Image (1920×1080): \`${e.image}\`

${langs}`;
  });
  return `# Google Play promotional content: training seasons

Generated from \`${SOURCE}\` by \`node scripts/play-promotions.mjs --doc\`. Edit the JSON, not this page. Decisions are in [Play promotional content](decisions/play-promotions.md).

One Play event for each training season's start (its first four weeks) and one for its finale week, when every point counts twice ([Training seasons](decisions/seasons.md)). Season 1, Ember, started on 23 November 2026, before this plan, so it gets only its finale. Add each in Play Console › Grow users › **Promotional content** › Create promotional content › **Time-limited event**, with the English text as the default and the other nine under Manage translations:

| Text | Play languages |
| --- | --- |
${Object.entries(PLAY_LANGS)
  .map(([l, p]) => `| ${LANG_NAMES[l]} | ${p} |`)
  .join("\n")}

Submit each one by its date, two weeks ahead, so it can be featured (Play needs at least 24 hours, and recommends at least four days). Only one promotional item can run at a time; these never overlap. Times are UTC: a season starts on each lifter's own Monday, so an event starts at noon UTC on that Monday, when it's Monday nearly everywhere.

Play's rules, which \`src/lib/playPromotions.test.ts\` checks: a tagline of 80 characters at most (48, or 23 in Japanese and Korean, to also fit the spotlight format), a description of 100 to 500 with no bullets, line breaks, HTML or call to action, no ranking or award claims, no prices, no other apps' names, and no emoji. The images have no text, logo or anything that looks like a button, and keep the figure inside the safe zone. Every event says that seasons open after a lifter's fifth workout ([Features that unlock as you train](decisions/unlocks.md)), so nobody who installs from it expects to see the season on day one.

## Schedule

| Event | What | Submit by | Starts | Ends |
| --- | --- | --- | --- | --- |
${rows}

## Events

${blocks.join("\n\n")}
`;
}

const events = JSON.parse(fs.readFileSync(SOURCE, "utf8")).events;
if (import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  fs.writeFileSync(DOC, renderDoc(events));
  console.log(`Wrote ${DOC}`);
  if (!process.argv.includes("--doc")) await drawAll(events);
}

/** Seeded so the art is the same every run. */
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Decorations in the season's colours, kept off the middle where the figure stands. */
function motif(kind, p, seed) {
  const r = rng(seed);
  const [a, b, c] = p.stops;
  const out = [];
  const spot = () => {
    for (;;) {
      const x = 80 + r() * 1760;
      const y = 60 + r() * 960;
      if (Math.abs(x - 960) > 330 || y < 90) return [x, y];
    }
  };
  for (let i = 0; i < 26; i++) {
    const [x, y] = spot();
    const s = 0.5 + r() * 1.2;
    const o = (0.25 + r() * 0.55).toFixed(2);
    const fill = [a, b, c][i % 3];
    const rot = Math.round(r() * 360);
    if (kind === "sparks")
      out.push(`<circle cx="${x}" cy="${y}" r="${(5 + s * 9).toFixed(1)}" fill="${fill}" opacity="${o}" filter="url(#soft)"/>`);
    else if (kind === "bolts")
      out.push(
        `<path d="M0 -40 L14 -6 L4 -6 L16 40 L-14 0 L-3 0 Z" transform="translate(${x} ${y}) rotate(${(rot % 40) - 20}) scale(${s})" fill="${fill}" opacity="${o}"/>`,
      );
    else if (kind === "petals")
      out.push(
        `<ellipse rx="${(10 * s).toFixed(1)}" ry="${(22 * s).toFixed(1)}" transform="translate(${x} ${y}) rotate(${rot})" fill="${fill}" opacity="${o}"/>`,
      );
    else if (kind === "leaves")
      out.push(
        `<path d="M0 -30 L8 -12 L26 -16 L16 0 L24 14 L6 10 L0 30 L-6 10 L-24 14 L-16 0 L-26 -16 L-8 -12 Z" transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" fill="${fill}" opacity="${o}"/>`,
      );
    else if (kind === "shards")
      out.push(
        `<path d="M0 -44 L14 -4 L4 40 L-12 6 Z" transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" fill="${fill}" opacity="${o}" stroke="${a}" stroke-opacity="0.5"/>`,
      );
  }
  if (kind === "rays") {
    const rays = [];
    for (let i = 0; i < 24; i++) {
      const t = (i / 24) * Math.PI * 2;
      rays.push(
        `<line x1="${960 + Math.cos(t) * 420}" y1="${520 + Math.sin(t) * 420}" x2="${960 + Math.cos(t) * 1100}" y2="${520 + Math.sin(t) * 1100}"/>`,
      );
    }
    out.push(`<g stroke="${b}" stroke-width="26" stroke-linecap="round" opacity="0.18">${rays.join("")}</g>`);
    out.push(`<circle cx="960" cy="520" r="360" fill="none" stroke="${a}" stroke-width="3" opacity="0.35"/>`);
  }
  return out.join("");
}

function background(p, kind, seed) {
  const [a, , c] = p.stops;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
  <defs>
    <radialGradient id="glow" cx="50%" cy="46%" r="60%"><stop offset="0" stop-color="${p.glow}" stop-opacity="0.55"/><stop offset="0.55" stop-color="${p.glow}" stop-opacity="0.12"/><stop offset="1" stop-color="${p.bg}" stop-opacity="0"/></radialGradient>
    <linearGradient id="wash" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}" stop-opacity="0.22"/><stop offset="0.5" stop-color="${p.bg}" stop-opacity="0"/><stop offset="1" stop-color="${a}" stop-opacity="0.16"/></linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="2.5"/></filter>
  </defs>
  <rect width="1920" height="1080" fill="${p.bg}"/>
  <rect width="1920" height="1080" fill="url(#wash)"/>
  <rect width="1920" height="1080" fill="url(#glow)"/>
  ${motif(kind, p, seed)}
  </svg>`);
}

/** The hologram figure, recoloured: its body in the kit's middle colour and the worked muscles in its deepest one. */
async function recolour(sharp, png, p) {
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [a, b, c] = p.stops.map(hex);
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, bl] = [data[i], data[i + 1], data[i + 2]];
    const muscle = Math.max(0, Math.min(1, (r - bl) / 160));
    const light = (r + g + bl) / 765;
    const base = b.map((v, k) => v + (a[k] - v) * Math.max(0, light - 0.6) * 1.6);
    for (let k = 0; k < 3; k++) data[i + k] = Math.round(base[k] + (c[k] - base[k]) * muscle);
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

async function drawAll(list) {
  const { chromium } = await import("playwright");
  const sharp = (await import("sharp")).default;
  const { serve } = await import("./helpers.mjs");
  const only = process.env.ONLY?.split(",");
  const todo = list.filter((e) => !only || only.includes(e.id));
  const server = await serve();
  const browser = await chromium.launch({
    ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}),
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage();
  await page.addInitScript(() => {
    window.__liftsmithForceWebGL = true;
  });
  await page.goto(`${server.url}/stills/`);
  await page.waitForFunction(() => window.__still, null, { timeout: 30_000 });
  for (const [i, e] of todo.entries()) {
    const art = ART[e.kit];
    const p = PALETTES[art[e.kind]];
    const url = await page.evaluate(([id, body]) => window.__still(id, body, 1100), [LIFT[e.id], i % 2 ? "female" : "male"]);
    if (!url) throw new Error(`No figure for ${LIFT[e.id]}`);
    const trimmed = await sharp(Buffer.from(url.split(",")[1], "base64"))
      .trim()
      .toBuffer();
    // Inside the safe zone: 162 px from the top, 216 from the bottom, 192 from each side.
    const fig = await sharp(await recolour(sharp, trimmed, p))
      .resize(1100, 690, { fit: "inside" })
      .toBuffer();
    const meta = await sharp(fig).metadata();
    fs.mkdirSync(path.dirname(e.image), { recursive: true });
    await sharp(background(p, art.motif, i * 7919 + 17))
      .composite([{ input: fig, left: Math.round(960 - meta.width / 2), top: Math.round(864 - meta.height) }])
      .png({ compressionLevel: 9, palette: false })
      .toFile(e.image);
    console.log(`Drew ${e.image}`);
  }
  await browser.close();
  server.close();
}
