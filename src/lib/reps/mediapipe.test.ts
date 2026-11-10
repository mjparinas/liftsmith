// Camera rep counting runs MediaPipe from our own copies (scripts/mediapipe.mjs, AGENTS.md "Security"):
// the runtime path must match the installed package, and the committed model must be the one we checked.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { MODEL, WASM } from "./sources";

const root = join(__dirname, "..", "..", "..");
const installed = JSON.parse(readFileSync(join(root, "node_modules/@mediapipe/tasks-vision/package.json"), "utf8")) as { version: string };

/** pose_landmarker_lite float16 version 1, from Google's model bucket (Apache 2.0). Change only with a new file name. */
const MODEL_SHA256 = "59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a";

describe("self-hosted MediaPipe", () => {
  it("loads the runtime and model from our own origin, never a CDN", () => {
    for (const url of [WASM, ...Object.values(MODEL)]) expect(url).toMatch(/^\/mediapipe\//);
  });

  it("names the installed runtime version in its path", () => {
    expect(WASM).toBe(`/mediapipe/tasks-vision-${installed.version}`);
  });

  it("ships the pose model we checked", () => {
    const file = readFileSync(join(root, "public", MODEL.lite));
    expect(createHash("sha256").update(file).digest("hex")).toBe(MODEL_SHA256);
  });
});
