// The pictures in the getting-started emails (src/server/tour.ts): the Google Play phone shots (real app screens with
// their caption, in each language, store/play/phone*/), made small enough for email. Re-run after play-compose.mjs:
//   node scripts/email-images.mjs
// Writes public/email/<lang>/<n>.jpg, 600 px wide (shown at 300 px, so sharp on high-density screens).
import fs from "node:fs";
import sharp from "sharp";

const LANGS = ["en", "es", "fr", "de", "it", "ja"];
for (const lang of LANGS) {
  const from = lang === "en" ? "store/play/phone" : `store/play/phone-${lang}`;
  const out = `public/email/${lang}`;
  fs.mkdirSync(out, { recursive: true });
  for (const file of fs
    .readdirSync(from)
    .filter((f) => f.endsWith(".jpg"))
    .sort()) {
    const n = file.slice(0, 2);
    await sharp(`${from}/${file}`).resize({ width: 600 }).jpeg({ quality: 72, mozjpeg: true }).toFile(`${out}/${n}.jpg`);
  }
  console.log(`  ${out}/`);
}
