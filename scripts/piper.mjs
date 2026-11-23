// Copies Piper Amy TTS runtime into public/piper/ so the voice coach can speak offline from our own
// origin (website or the files inside the Android and iOS apps). Runs before `npm run dev`, `build`
// and `build:static`. The Amy ONNX voice is committed under public/piper/voices/ (like MediaPipe's
// pose model); this script only fills the phonemizer and ONNX Runtime WASM from lockfile-pinned
// packages. If the voice files are missing (a shallow checkout without them), it downloads them
// once from Hugging Face (rhasspy/piper-voices) so a local build can still recover.
import { copyFileSync, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "piper");
const voices = join(out, "voices");
const onnxDir = join(out, "onnx");
const phDir = join(out, "phonemize");

const AMY = "en_US-amy-low";
const AMY_ONNX = `${AMY}.onnx`;
const AMY_JSON = `${AMY}.onnx.json`;
const HF = `https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/low`;

mkdirSync(voices, { recursive: true });
mkdirSync(onnxDir, { recursive: true });
mkdirSync(phDir, { recursive: true });

function copyNewer(from, to) {
  if (!existsSync(from)) throw new Error(`missing ${from}`);
  if (existsSync(to) && statSync(to).size === statSync(from).size && statSync(to).mtimeMs >= statSync(from).mtimeMs) return false;
  copyFileSync(from, to);
  return true;
}

async function download(url, dest, minBytes = 1_000) {
  if (existsSync(dest) && statSync(dest).size >= minBytes) return false;
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`download failed ${url}: ${res.status}`);
  const tmp = `${dest}.part`;
  await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
  renameSync(tmp, dest);
  return true;
}

// Phonemizer (espeak-ng WASM) from @diffusionstudio/piper-wasm.
const phPkg = join(root, "node_modules", "@diffusionstudio", "piper-wasm", "build");
for (const f of ["piper_phonemize.js", "piper_phonemize.wasm", "piper_phonemize.data"]) {
  copyNewer(join(phPkg, f), join(phDir, f));
}
// Wrap the UMD build as an ES module so the app can dynamic-import it.
const umd = readFileSync(join(phDir, "piper_phonemize.js"), "utf8");
if (!umd.includes("export { createPiperPhonemize }")) {
  writeFileSync(join(phDir, "piper_phonemize.mjs"), `${umd}\nexport { createPiperPhonemize };\n`);
} else {
  copyNewer(join(phDir, "piper_phonemize.js"), join(phDir, "piper_phonemize.mjs"));
}

// ONNX Runtime WASM (onnxruntime-web), pointed at by piperAmy.ts. Single-thread only: Capacitor
// WebViews rarely expose SharedArrayBuffer, and the threaded builds add tens of megabytes.
const ortPkg = join(root, "node_modules", "onnxruntime-web", "dist");
for (const f of ["ort-wasm.wasm", "ort-wasm-simd.wasm"]) {
  const from = join(ortPkg, f);
  if (existsSync(from)) copyNewer(from, join(onnxDir, f));
}

writeFileSync(
  join(out, "ATTRIBUTION.txt"),
  `Amy voice (en_US-amy-low)
Model: https://huggingface.co/rhasspy/piper-voices (en/en_US/amy/low)
Dataset lineage: Mycroft Mimic voices (CC BY-SA 4.0)
Piper phonemizer WASM: @diffusionstudio/piper-wasm (MIT)
ONNX Runtime Web: Microsoft (MIT)
`,
);

const gotOnnx = await download(`${HF}/${AMY_ONNX}`, join(voices, AMY_ONNX), 1_000_000);
const gotJson = await download(`${HF}/${AMY_JSON}`, join(voices, AMY_JSON), 500);
if (!existsSync(join(voices, AMY_ONNX)) || !existsSync(join(voices, AMY_JSON))) {
  throw new Error("Piper Amy model missing after download");
}
console.log(`Piper Amy ready in public/piper/${gotOnnx || gotJson ? " (updated)" : ""}`);
