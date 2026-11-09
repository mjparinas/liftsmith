import { boneFrame, bounds, evalPart, partWeights, PARTS, placement, placeVec, jointsAt, REGIONS, skeletonSegments, SKEL_MAX, type Part, type Placement } from "@/lib/demo/mesh";
import { motionFor, targetsFor, type Motion } from "@/lib/demo/motions";
import { BODIES, add, clamp, cycleLength, interp, lerpV, mul, sample, type Body, type BodyKey, type Joints, type Vec } from "@/lib/demo/rig";
import type { Muscle } from "@/lib/types";

// The demo loop shared by the WebGL scene and the 2D canvas drawing: time, reps, the camera, drag to
// rotate, and the mesh buffers. Scenes only draw what this hands them.

export type View = "orbit" | "front" | "back" | "three" | "side";
export const VIEW_YAW: Record<Exclude<View, "orbit">, number> = { side: 0, three: 50, front: 90, back: -90 };

export interface DemoSettings {
  exerciseId: string | null;
  body: BodyKey;
  view: View;
  skeleton: boolean;
  muscles: boolean;
  path: boolean;
  speed: number;
  playing: boolean;
  /** Play this many reps, then hold the last frame. */
  reps?: number;
  highlight?: Partial<Record<Muscle, number>>;
  /** Live heart rate from a connected monitor; the figure's heart beats at this rate. */
  bpm?: number | null;
  /** Frames per second cap (30 for the small inline demo). */
  fps: number;
  /**
   * Paint muscles in their own colours (the recovery map) instead of the ember target glow. Hex colours;
   * `hatch` (0..1) lights the cross lines on a muscle so its state doesn't rest on colour alone, and
   * `selected` brightens those muscles and dims the rest.
   */
  paint?: Partial<Record<Muscle, string>> | null;
  hatch?: Partial<Record<Muscle, number>> | null;
  selected?: readonly Muscle[] | null;
  /** Lean mode or reduced motion: camera turns snap instead of easing. */
  calm?: boolean;
}

export interface Camera { yaw: number; pitch: number; target: Vec; distance: number; aspect: number }

/** `which` is each vertex's muscle (index into REGIONS, -1 for none), filled when muscles are painted. */
export interface MeshBuf { P: Part; pos: Float32Array; meta: Float32Array; weights: Float32Array; which: Int8Array }

export interface Frame {
  J: Joints;
  effort: number;
  cam: Camera;
  s: DemoSettings;
  motion: Motion;
  body: Body;
  place: Placement;
  roll: number;
  meshes: MeshBuf[];
  skel: { arr: Float32Array; count: number };
  /** Set when the exercise, body or highlight changed since the last frame. */
  changed: boolean;
  path: Vec[];
  /** The heart, in the figure's frame, and how far into a beat it is (0 rest, 1 peak). Null without live heart rate. */
  heart: { at: Vec; beat: number } | null;
}

export interface Scene {
  resize(w: number, h: number, dpr: number): void;
  draw(f: Frame): void;
  dispose(): void;
}

export interface Loop {
  update(s: Partial<DemoSettings>): void;
  dispose(): void;
}

export function startLoop(canvas: HTMLCanvasElement, scene: Scene, initial: DemoSettings, onPhase?: (label: string) => void, onDone?: () => void, onPick?: (m: Muscle | null) => void): Loop {
  let s = { ...initial };
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) s.playing = false;
  const meshes: MeshBuf[] = PARTS.map((P) => ({ P, pos: new Float32Array(P.NT * P.M * 3), meta: new Float32Array(P.NT * P.M * 2), weights: new Float32Array(P.NT * P.M), which: new Int8Array(P.NT * P.M) }));
  const skel = { arr: new Float32Array(SKEL_MAX * 6), count: 0 };
  let motion: Motion, body: Body, place: Placement, frameBox: ReturnType<typeof bounds>, path: Vec[] = [];
  let changed = true;
  let t = reduced ? 1.8 : 0;
  let yaw = s.view === "orbit" ? 50 : VIEW_YAW[s.view], yawTarget = yaw, pitch = 10;
  let drag: { x: number; y: number; yaw: number; pitch: number } | null = null;
  let visible = true, raf = 0, last = 0, lastDraw = 0, done = false, clock = 0;

  const setup = () => {
    motion = motionFor(s.exerciseId);
    body = BODIES[s.body];
    place = placement(motion, body);
    frameBox = bounds(motion, body, place);
    const J0 = jointsAt(motion, body, 0);
    const targets = s.paint ? Object.fromEntries(Object.keys(s.paint).map((k) => [k, 1])) : targetsFor(s.exerciseId, s.highlight);
    for (const m of meshes) {
      evalPart(m.P, J0, body, m.pos, m.meta);
      partWeights(m.P, m.meta, targets, m.weights, m.which);
    }
    path = [];
    for (let i = 0; i <= 40; i++) {
      const J = jointsAt(motion, body, i / 40);
      const p = J.bar ?? (motion.hold === "R" ? J.handR : ([(J.handL[0] + J.handR[0]) / 2, (J.handL[1] + J.handR[1]) / 2, 0] as Vec));
      path.push(p);
    }
    changed = true;
    done = false;
  };
  setup();

  let down: { x: number; y: number } | null = null;
  const onDown = (e: PointerEvent) => { drag = { x: e.clientX, y: e.clientY, yaw: yawTarget, pitch }; down = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture?.(e.pointerId); };
  const onMove = (e: PointerEvent) => {
    if (!drag) return;
    yawTarget = drag.yaw - (e.clientX - drag.x) * 0.45;
    yaw = yawTarget;
    pitch = clamp(drag.pitch + (e.clientY - drag.y) * 0.2, -5, 35);
    kick();
  };
  const onUp = (e: PointerEvent) => {
    drag = null;
    // a tap (not a drag) picks the muscle under the finger
    if (onPick && down && e.type === "pointerup" && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8) {
      const r = canvas.getBoundingClientRect();
      onPick(pick(e.clientX - r.left, e.clientY - r.top));
    }
    down = null;
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);

  let size = [0, 0];
  const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); kick(); }) : null;
  io?.observe(canvas);
  const onVis = () => kick();
  document.addEventListener("visibilitychange", onVis);

  function frame(now: number) {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min(0.05, Math.max(0, (now - (last || now)) / 1000));
    last = now;
    clock += dt;
    const cyc = cycleLength(motion.phases);
    if (s.playing && !done) {
      t += dt * s.speed;
      if (s.reps && t >= cyc * s.reps) { t = cyc * s.reps - 1e-3; done = true; onDone?.(); }
    }
    if (s.view === "orbit" && !drag && s.playing) yawTarget += dt * 18;
    yaw = s.calm ? yawTarget : yaw + (yawTarget - yaw) * Math.min(1, dt * 5);
    const animating = (s.playing && !done) || !!s.bpm || !!drag || Math.abs(yawTarget - yaw) > 0.05 || (s.view === "orbit" && s.playing);
    if (changed || now - lastDraw >= 1000 / s.fps - 4) {
      lastDraw = now;
      const r = canvas.getBoundingClientRect();
      if (r.width !== size[0] || r.height !== size[1]) {
        size = [r.width, r.height];
        scene.resize(r.width, r.height, Math.min(2, window.devicePixelRatio || 1));
      }
      const smp = sample(motion.phases, t);
      const J = jointsAt(motion, body, smp.d);
      for (const m of meshes) {
        if (m.P.kind === "hair" && !body.hair) continue;
        evalPart(m.P, J, body, m.pos);
      }
      skel.count = s.skeleton ? skeletonSegments(J, body, skel.arr) : 0;
      const aspect = size[1] ? size[0] / size[1] : 1;
      const distance = (frameBox.size * 2.45) / Math.min(1, aspect * 1.15);
      lastCam = { yaw, pitch, target: frameBox.centre, distance, aspect };
      lastRoll = place.roll(smp.d);
      scene.draw({ J, effort: smp.effort, cam: { yaw, pitch, target: frameBox.centre, distance, aspect }, s, motion, body, place, roll: place.roll(smp.d), meshes, skel, changed, path, heart: s.bpm ? { at: heartAt(J, body), beat: heartBeat(clock, s.bpm) } : null });
      changed = false;
      onPhase?.(smp.label);
    }
    if (animating) raf = requestAnimationFrame(frame);
  }
  let lastCam: Camera | null = null, lastRoll = 0;
  /** The painted muscle nearest the camera under a point on the canvas, or null. */
  function pick(x: number, y: number): Muscle | null {
    if (!lastCam || !size[0]) return null;
    const pr = projector(lastCam, size[0], size[1]);
    const R2 = 22 * 22;
    const hits: { z: number; d: number; m: number; w: number }[] = [];
    let zMin = Infinity;
    for (const m of meshes) {
      if (m.P.kind === "hair" && !body.hair) continue;
      for (let k = 0; k < m.P.NT * m.P.M; k++) {
        const [sx, sy, z] = pr(placeVec([m.pos[k * 3], m.pos[k * 3 + 1], m.pos[k * 3 + 2]], lastRoll, place.lift, place.shiftZ));
        const d = (sx - x) ** 2 + (sy - y) ** 2;
        if (d > R2) continue;
        zMin = Math.min(zMin, z);
        hits.push({ z, d, m: m.which[k], w: m.weights[k] });
      }
    }
    // only the surface facing the camera counts, so a tap on the chest never picks the back
    let best: { d: number; m: number } | null = null;
    for (const h of hits) if (h.m >= 0 && h.w > 0.3 && h.z < zMin + 0.07 && (!best || h.d < best.d)) best = h;
    return best ? REGIONS[best.m].id : null;
  }
  function kick() {
    if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); }
  }
  kick();

  return {
    update(p) {
      const prev = s;
      s = { ...s, ...p };
      if (reduced) s.playing = false;
      const differs = (k: keyof DemoSettings) => k in p && p[k] !== prev[k];
      if (differs("exerciseId")) t = reduced ? 1.8 : 0;
      if (differs("exerciseId") || differs("body") || differs("highlight") || differs("paint")) setup();
      if (differs("reps")) { t = 0; done = false; }
      if (differs("view")) {
        if (s.view !== "orbit") {
          let target = VIEW_YAW[s.view];
          while (target - yawTarget > 180) target -= 360;
          while (yawTarget - target > 180) target += 360;
          yawTarget = target;
        }
        pitch = s.view === "orbit" ? 10 : 6;
      }
      changed = true;
      kick();
    },
    dispose() {
      if (raf) cancelAnimationFrame(raf);
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      scene.dispose();
    },
  };
}

/** Projects a world point to canvas pixels plus depth, with the same camera both scenes use (32° field of view). */
export function projector(cam: Camera, W: number, H: number) {
  const yr = (cam.yaw * Math.PI) / 180, pr = (cam.pitch * Math.PI) / 180, t = cam.target;
  const eye: Vec = [t[0] + Math.sin(yr) * Math.cos(pr) * cam.distance, t[1] + Math.sin(pr) * cam.distance, t[2] + Math.cos(yr) * Math.cos(pr) * cam.distance];
  const n = (a: Vec): Vec => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const fw = n([t[0] - eye[0], t[1] - eye[1], t[2] - eye[2]]);
  const right = n([-fw[2], 0, fw[0]]); // fw × world up
  const up: Vec = [right[1] * fw[2] - right[2] * fw[1], right[2] * fw[0] - right[0] * fw[2], right[0] * fw[1] - right[1] * fw[0]];
  const focal = H / 2 / Math.tan((16 * Math.PI) / 180);
  return (p: Vec): [number, number, number] => {
    const v: Vec = [p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]];
    const z = Math.max(0.1, v[0] * fw[0] + v[1] * fw[1] + v[2] * fw[2]);
    return [W / 2 + ((v[0] * right[0] + v[1] * right[1] + v[2] * right[2]) * focal) / z, H / 2 - ((v[0] * up[0] + v[1] * up[1] + v[2] * up[2]) * focal) / z, z];
  };
}

/** Where the heart sits: upper chest, a little to the lifter's left. */
export function heartAt(J: Joints, B: Body): Vec {
  const F = boneFrame(J.hipC, J.shC, "torso", 1);
  const t = 0.74;
  return add(add(lerpV(J.hipC, J.shC, t), mul(F.f, interp(B.torsoSide, t, 1) * 0.5)), mul(F.o, -0.05));
}

/** A lub-dub pulse shape at `bpm`: a strong beat, then a softer one, then rest. */
export function heartBeat(seconds: number, bpm: number): number {
  const ph = ((seconds * bpm) / 60) % 1;
  const g = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));
  return Math.min(1, Math.max(g(ph, 0.04, 0.05), 0.6 * g(ph, 0.3, 0.05), g(ph, 1.04, 0.05)));
}
