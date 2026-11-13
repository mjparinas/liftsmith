// Writes one file per language for the app's production builds: src/locales/gen/<lang>.json, from the catalogues in
// src/locales (docs/decisions/speed.md "One language at a time"). The source keeps every language side by side in
// src/locales/text/<prefix>.ts, which a bundler can't split, so without this every phone loaded all six languages
// (3.5 MB of script) to show one. Runs before `next build` and `next build:static`; dev and tests read the source.
import fs from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, "src");

// The catalogues import each other without extensions and through "@/", the way the app's bundler reads them.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/")) specifier = pathToFileURL(path.join(src, specifier.slice(2))).href;
    if ((specifier.startsWith(".") || specifier.startsWith("file:")) && !/\.[cm]?[jt]s$/.test(specifier)) {
      const base = specifier.startsWith("file:") ? fileURLToPath(specifier) : fileURLToPath(new URL(specifier, context.parentURL));
      if (fs.existsSync(`${base}.ts`)) return next(pathToFileURL(`${base}.ts`).href, context);
    }
    return next(specifier, context);
  },
});

export const LANGS = ["en", "es", "fr", "de", "it", "ja"];

const out = path.join(src, "locales", "gen");
fs.mkdirSync(out, { recursive: true });
for (const lang of LANGS) {
  const mod = await import(pathToFileURL(path.join(src, "locales", `${lang}.ts`)).href);
  const catalogue = mod[lang];
  if (!catalogue || typeof catalogue !== "object") throw new Error(`src/locales/${lang}.ts has no "${lang}" export`);
  const text = JSON.stringify(catalogue);
  const file = path.join(out, `${lang}.json`);
  if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== text) fs.writeFileSync(file, text);
}
console.log(`locales: wrote ${LANGS.length} languages to src/locales/gen/`);
