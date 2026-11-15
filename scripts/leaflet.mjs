// Copies Leaflet's script and sheet from node_modules into public/vendor/leaflet/, so the website's /gyms/ page (a
// server-drawn page that can't use the app's bundle) draws its map from our own origin, never a CDN (AGENTS.md
// "Security"). npm checks the package against package-lock.json's integrity hash. Runs before dev, build and
// build:static, like scripts/mediapipe.mjs. docs/decisions/gyms.md "The gyms page leads with a map".
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(root, "node_modules", "leaflet", "dist");
const out = join(root, "public", "vendor", "leaflet");
mkdirSync(out, { recursive: true });
for (const file of ["leaflet.js", "leaflet.css"]) copyFileSync(join(from, file), join(out, file));
console.log("Leaflet copied to public/vendor/leaflet/");
