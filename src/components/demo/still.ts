"use client";

import { bounds, evalPart, jointsAt, PARTS, partWeights, placement, SKEL_MAX } from "@/lib/demo/mesh";
import { motionFor, targetsFor } from "@/lib/demo/motions";
import { BODIES, lerp, type BodyKey } from "@/lib/demo/rig";

import { VIEW_YAW, type DemoSettings, type MeshBuf, type Scene } from "./engine";
import { detectMode } from "./LiftDemoCore";

// One still frame of the hologram, for share cards: the figure caught mid-rep (the hardest phase of the lift)
// at a three-quarter view, with the working muscles lit. Same mesh, camera and scenes as the live demo
// (WebGL on a GPU, the 2D canvas otherwise), drawn once and copied to a plain canvas so it can go onto an image.

export interface StillOptions {
  exerciseId: string;
  body: BodyKey;
  width: number;
  height: number;
}

/** How far through the rep to freeze: halfway through the phase with the most effort. */
export function stillPoint(phases: readonly (readonly [number, number, number, string, number])[]): number {
  let best = phases[0];
  for (const p of phases) if (best && p[4] > best[4]) best = p;
  return best ? lerp(best[1], best[2], 0.5) : 0.5;
}

export async function figureStill(o: StillOptions): Promise<HTMLCanvasElement | null> {
  const mode = detectMode();
  if (mode === "none") return null;
  const canvas = document.createElement("canvas");
  let scene: Scene | null = null;
  try {
    if (mode === "3d") {
      const { createScene3D } = await import("./scene3d");
      scene = createScene3D(canvas);
    } else {
      const { createScene2D } = await import("./scene2d");
      scene = createScene2D(canvas);
    }
    const motion = motionFor(o.exerciseId);
    const body = BODIES[o.body];
    const place = placement(motion, body);
    const box = bounds(motion, body, place);
    const d = stillPoint(motion.phases);
    const J = jointsAt(motion, body, d);
    const targets = targetsFor(o.exerciseId);
    const meshes: MeshBuf[] = PARTS.map((P) => {
      const m: MeshBuf = {
        P,
        pos: new Float32Array(P.NT * P.M * 3),
        meta: new Float32Array(P.NT * P.M * 2),
        weights: new Float32Array(P.NT * P.M),
        which: new Int8Array(P.NT * P.M),
      };
      evalPart(P, J, body, m.pos, m.meta);
      partWeights(P, m.meta, targets, m.weights, m.which);
      return m;
    });
    const s: DemoSettings = {
      exerciseId: o.exerciseId,
      body: o.body,
      view: "three",
      skeleton: false,
      muscles: true,
      path: false,
      speed: 1,
      playing: false,
      fps: 1,
      highlight: undefined,
    };
    const aspect = o.width / o.height;
    scene.resize(o.width, o.height, 1);
    scene.draw({
      J,
      effort: 1,
      cam: { yaw: VIEW_YAW.three, pitch: 8, target: box.centre, distance: (box.size * 2.45) / Math.min(1, aspect * 1.15), aspect },
      s,
      motion,
      body,
      place,
      roll: place.roll(d),
      meshes,
      skel: { arr: new Float32Array(SKEL_MAX * 6), count: 0 },
      changed: true,
      path: Array.from({ length: 41 }, () => box.centre),
      heart: null,
    });
    // Copy straight away: a WebGL canvas may be cleared once the frame is handed to the screen.
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    const c = out.getContext("2d");
    if (!c) return null;
    c.drawImage(canvas, 0, 0);
    return trim(out);
  } catch {
    return null;
  } finally {
    scene?.dispose();
  }
}

/** Crops to what was drawn (plus a small margin), so the figure fills the space a card gives it. */
function trim(src: HTMLCanvasElement): HTMLCanvasElement {
  const c = src.getContext("2d");
  if (!c) return src;
  const { width: w, height: h } = src;
  const px = c.getImageData(0, 0, w, h).data;
  let x0 = w,
    y0 = h,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if ((px[(y * w + x) * 4 + 3] ?? 0) > 12) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return src;
  const m = Math.round(Math.max(x1 - x0, y1 - y0) * 0.04);
  x0 = Math.max(0, x0 - m);
  y0 = Math.max(0, y0 - m);
  x1 = Math.min(w - 1, x1 + m);
  y1 = Math.min(h - 1, y1 + m);
  const out = document.createElement("canvas");
  out.width = x1 - x0 + 1;
  out.height = y1 - y0 + 1;
  out.getContext("2d")?.drawImage(src, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}
