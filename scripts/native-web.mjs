// Keeps the website out of the Android and iOS apps (docs/decisions/app-size.md). `npm run build:static` exports the
// whole site to out/: the app at /app/, plus about 1,800 public pages (exercises, muscles, blog, comparisons) and
// their preview cards and exercise stills, around 100 MB compressed. The apps open straight into /app/ and link to
// the website on SITE_URL, so they only need the app page, its build files, the rep-counting runtime and the icons.
//
// Capacitor runs this after it copies out/ into a shell (`capacitor:copy:after` in package.json, which both
// `npx cap copy` and `npx cap sync` call), and it removes every top-level entry of out/ that isn't on the KEEP list
// from that shell's copy. Files Capacitor adds itself (cordova.js, plugins/, native-bridge.js) aren't in out/, so
// they stay. out/ itself is left alone, because the browser tests and the website use all of it.
import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** What the app needs from out/: its page, the build files, camera rep counting's runtime and model, and the icons. */
export const KEEP = [
  "app",
  "_next",
  "mediapipe",
  "index.html",
  "404.html",
  "favicon.ico",
  "icon.svg",
  "icon-mono.svg",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "manifest.webmanifest",
  "sw.js",
];

/** Where each shell keeps its copy of the web files. */
export const SHELL_DIRS = {
  android: "android/app/src/main/assets/public",
  ios: "ios/App/App/public",
};

const size = (path) => {
  const s = statSync(path);
  if (!s.isDirectory()) return s.size;
  return readdirSync(path).reduce((sum, name) => sum + size(join(path, name)), 0);
};

/** Removes from `shellDir` every top-level entry of `webDir` that the app doesn't need. Returns what went and its bytes. */
export function prune(webDir, shellDir) {
  if (!existsSync(join(webDir, "app", "index.html"))) throw new Error(`${webDir} has no app/index.html; run npm run build:static first`);
  const removed = [];
  let bytes = 0;
  for (const name of readdirSync(webDir)) {
    if (KEEP.includes(name)) continue;
    const path = join(shellDir, name);
    if (!existsSync(path)) continue;
    bytes += size(path);
    rmSync(path, { recursive: true, force: true });
    removed.push(name);
  }
  return { removed, bytes };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = process.env.CAPACITOR_ROOT_DIR ?? process.cwd();
  const platform = process.env.CAPACITOR_PLATFORM_NAME;
  const webDir = process.env.CAPACITOR_WEB_DIR ?? join(root, "out");
  const platforms = platform && platform in SHELL_DIRS ? [platform] : platform ? [] : Object.keys(SHELL_DIRS);
  for (const p of platforms) {
    const shellDir = join(root, SHELL_DIRS[p]);
    if (!existsSync(shellDir)) continue;
    const { removed, bytes } = prune(webDir, shellDir);
    console.log(`${p}: left the website out of the app (${removed.length} entries, ${(bytes / 1e6).toFixed(1)} MB)`);
  }
}
