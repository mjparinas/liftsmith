// The small pictures in the lifter emails (src/server/reminderEmails.ts): each kind's icon from the app's own set
// (icons.tsx) on a tinted tile, and the streak flame. PNG, because mail apps don't show SVG. Re-run after changing
// an icon or a colour:
//   node scripts/email-icons.mjs
// Writes public/email/icons/<name>.png at 2x (shown at half size, so sharp on high-density screens).
import fs from "node:fs";
import sharp from "sharp";

const src = fs.readFileSync("src/components/app/icons.tsx", "utf8");
const path = (name) => {
  const m = src.match(new RegExp(`\\n  ${name}:\\s*\\n?\\s*"([^"]+)"`));
  if (!m) throw new Error(`no icon ${name}`);
  return m[1];
};

// The app's supporting hues (globals.css): blue, violet, cyan, ember, mint. The card is --color-surface (#10151d).
const HUES = { blue: "#5b9cff", violet: "#a78bfa", cyan: "#38d6e8", ember: "#ff8a3d", mint: "#34d399" };
/** Email icon → [app icon, hue]. Keep in step with EMAIL_ICONS in reminderEmails.ts. */
const TILES = {
  calendar: ["calendar", "cyan"],
  dumbbell: ["dumbbell", "blue"],
  flame: ["flame", "ember"],
  medal: ["medal", "violet"],
  sparkle: ["sparkle", "violet"],
  chart: ["chart", "blue"],
  trophy: ["trophy", "mint"],
  people: ["people", "cyan"],
  heart: ["heart", "mint"],
  flag: ["flag", "ember"],
  bell: ["bellOn", "blue"],
  lock: ["lock", "violet"],
};

const out = "public/email/icons";
fs.mkdirSync(out, { recursive: true });

// 56 px tiles at 2x: a rounded square tinted with the hue, a hairline of it, and the icon stroked in it.
for (const [file, [icon, hue]] of Object.entries(TILES)) {
  const c = HUES[hue];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112" viewBox="0 0 56 56">
<rect width="56" height="56" rx="16" fill="#10151d"/>
<rect x=".5" y=".5" width="55" height="55" rx="15.5" fill="${c}" fill-opacity=".16" stroke="${c}" stroke-opacity=".35"/>
<g transform="translate(14 14) scale(1.1667)" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${path(icon)}"/></g>
</svg>`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toFile(`${out}/${file}.png`);
}

// The streak hero's flame: 72 px at 2x, filled ember to gold with a hot core and a soft glow, on a clear background.
const flame = path("flame");
const hero = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 24 24">
<defs>
<linearGradient id="f" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff5a1f"/><stop offset=".55" stop-color="#ff8a3d"/><stop offset="1" stop-color="#ffc24d"/></linearGradient>
<radialGradient id="g" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="#ff8a3d" stop-opacity=".45"/><stop offset=".95" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>
</defs>
<circle cx="12" cy="13" r="10.5" fill="url(#g)"/>
<g transform="translate(2.4 1.6) scale(.8)"><path d="${flame}" fill="url(#f)" stroke="#ffb066" stroke-width="1" stroke-linejoin="round"/>
<path d="M12 21c2.2 0 3.6-1.5 3.6-3.6 0-2.3-2-3.3-2-5.4-1.6 1-2.1 2.6-2.1 3.7-.6-.4-1-1-1-1.8-1.2 1.2-2 2.4-2 3.6 0 2 1.4 3.5 3.5 3.5z" fill="#ffe08a"/></g>
</svg>`;
await sharp(Buffer.from(hero)).png({ compressionLevel: 9 }).toFile(`${out}/streak.png`);
console.log(`  ${out}/`);
