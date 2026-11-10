// Copies the MediaPipe vision runtime from node_modules into public/, so camera rep counting loads it from
// our own origin (the website, or the files inside the Android and iOS apps) instead of a CDN. npm checks the
// package against package-lock.json's integrity hash, so these are exactly the files the lockfile pins.
// Runs before `npm run dev`, `build` and `build:static`. The pose model is committed next to it
// (public/mediapipe/*.task); src/lib/reps/mediapipe.test.ts checks its SHA-256.
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkgDir = join(root, "node_modules", "@mediapipe", "tasks-vision");
const { version } = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
const out = join(root, "public", "mediapipe", `tasks-vision-${version}`);
mkdirSync(out, { recursive: true });
for (const file of ["vision_wasm_internal.js", "vision_wasm_internal.wasm"]) {
  const from = join(pkgDir, "wasm", file);
  const to = join(out, file);
  if (existsSync(to) && statSync(to).size === statSync(from).size && statSync(to).mtimeMs >= statSync(from).mtimeMs) continue;
  copyFileSync(from, to);
}
console.log(`MediaPipe runtime ${version} copied to public/mediapipe/`);
