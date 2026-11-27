"use client";

import { bounds, evalPart, jointsAt, PARTS, partWeights, placement, SKEL_MAX } from "@/lib/demo/mesh";
import { motionFor, targetsFor } from "@/lib/demo/motions";
import { BODIES, cycleLength, sample, type BodyKey } from "@/lib/demo/rig";

import { VIEW_YAW, type DemoSettings, type MeshBuf, type Scene } from "./engine";
import { detectMode } from "./LiftDemoCore";

// The hologram as a sequence of frames, for the Pinterest clips (scripts/pins.mjs, docs/decisions/pinterest.md). The
// same mesh, camera and scenes as the live demo and the share-card still (still.ts), but kept open so each frame of the
// clip is one draw: the rep plays at its own pace and the camera sweeps gently around the three-quarter view. The frame
// box is the whole rep's, so the figure never jumps or rescales between frames.

export interface FigureClip {
  /** Seconds one rep takes at normal speed. */
  rep: number;
  /** Draws the figure `t` seconds in, the camera `turn` degrees off the three-quarter view, onto `out`. */
  draw(t: number, turn: number, out: HTMLCanvasElement): void;
  /** Draws the figure caught mid-rep (the still's moment) onto `out`. */
  still(out: HTMLCanvasElement): void;
  dispose(): void;
}

/** Where a still freezes the rep: halfway through its hardest phase (as still.ts). */
function hardest(phases: readonly (readonly [number, number, number, string, number])[]): number {
  let best = phases[0];
  for (const p of phases) if (best && p[4] > best[4]) best = p;
  return best ? (best[1] + best[2]) / 2 : 0.5;
}

export async function figureClip(o: {
  exerciseId: string;
  body: BodyKey;
  width: number;
  height: number;
  /** How much closer than the live demo's camera (which leaves room for the floor rings). */
  zoom?: number;
}): Promise<FigureClip | null> {
  const mode = detectMode();
  if (mode === "none") return null;
  const canvas = document.createElement("canvas");
  const scene: Scene =
    mode === "3d" ? (await import("./scene3d")).createScene3D(canvas) : (await import("./scene2d")).createScene2D(canvas);
  const motion = motionFor(o.exerciseId);
  const body = BODIES[o.body];
  const place = placement(motion, body);
  const box = bounds(motion, body, place);
  const targets = targetsFor(o.exerciseId);
  const J0 = jointsAt(motion, body, 0);
  const meshes: MeshBuf[] = PARTS.map((P) => {
    const m: MeshBuf = {
      P,
      pos: new Float32Array(P.NT * P.M * 3),
      meta: new Float32Array(P.NT * P.M * 2),
      weights: new Float32Array(P.NT * P.M),
      which: new Int8Array(P.NT * P.M),
    };
    evalPart(P, J0, body, m.pos, m.meta);
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
    playing: true,
    fps: 30,
    highlight: undefined,
  };
  const aspect = o.width / o.height;
  scene.resize(o.width, o.height, 1);
  const skel = { arr: new Float32Array(SKEL_MAX * 6), count: 0 };
  const path = Array.from({ length: 41 }, () => box.centre);

  const at = (d: number, effort: number, turn: number, out: HTMLCanvasElement) => {
    const J = jointsAt(motion, body, d);
    for (const m of meshes) {
      if (m.P.kind === "hair" && !body.hair) continue;
      evalPart(m.P, J, body, m.pos);
    }
    scene.draw({
      J,
      effort,
      cam: {
        yaw: VIEW_YAW.three + turn,
        pitch: 8,
        target: box.centre,
        distance: (box.size * 2.45) / Math.min(1, aspect * 1.15) / (o.zoom ?? 1),
        aspect,
      },
      s,
      motion,
      body,
      place,
      roll: place.roll(d),
      yaw: place.yaw(d),
      meshes,
      skel,
      changed: true,
      path,
      heart: null,
    });
    // Copy straight away: a WebGL canvas may be cleared once the frame is handed to the screen.
    out.width = canvas.width;
    out.height = canvas.height;
    const c = out.getContext("2d");
    c?.clearRect(0, 0, out.width, out.height);
    c?.drawImage(canvas, 0, 0);
  };

  return {
    rep: cycleLength(motion.phases),
    draw(t, turn, out) {
      const smp = sample(motion.phases, t);
      at(smp.d, smp.effort, turn, out);
    },
    still(out) {
      at(hardest(motion.phases), 1, 0, out);
    },
    dispose: () => scene.dispose(),
  };
}
