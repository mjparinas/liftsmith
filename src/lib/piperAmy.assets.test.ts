import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { AMY_VOICE_ID, PIPER_BASE } from "./piperAmy";

// Piper Amy assets are copied/downloaded by scripts/piper.mjs into public/piper/ (gitignored, like
// MediaPipe's runtime). This fails when a build skips the script or the Amy model is missing.

const root = join(process.cwd(), "public", "piper");

describe("Piper Amy assets", () => {
  it("keeps the bundled voice, phonemizer and ONNX runtime under /piper/", () => {
    expect(PIPER_BASE).toBe("/piper");
    expect(AMY_VOICE_ID).toBe("en_US-amy-low");
    for (const rel of [
      `voices/${AMY_VOICE_ID}.onnx`,
      `voices/${AMY_VOICE_ID}.onnx.json`,
      "phonemize/piper_phonemize.mjs",
      "phonemize/piper_phonemize.wasm",
      "phonemize/piper_phonemize.data",
      "onnx/ort-wasm-simd.wasm",
      "ATTRIBUTION.txt",
    ]) {
      const path = join(root, rel);
      expect(existsSync(path), rel).toBe(true);
      expect(statSync(path).size, rel).toBeGreaterThan(100);
    }
    const cfg = JSON.parse(readFileSync(join(root, `voices/${AMY_VOICE_ID}.onnx.json`), "utf8")) as {
      audio?: { sample_rate?: number };
      espeak?: { voice?: string };
    };
    expect(cfg.audio?.sample_rate).toBeGreaterThan(0);
    expect(cfg.espeak?.voice).toBeTruthy();
  });
});
