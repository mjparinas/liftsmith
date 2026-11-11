import type { Pattern } from "../types";
import { BLAZEPOSE, type JointMap, type Keypoint } from "./pose";
import type { Rep } from "./types";

// Camera form check (Labs, `labFormCheck`; Melvin, 2026-11-11, Labs idea 3). The pose tracking that counts
// reps also looks at how each rep moved, and between sets says the one thing most worth fixing, with the
// numbers behind it: squats that stop above parallel (depth), reps cut short of the set's own range (range),
// and a lean to one side (lean). Everything here works on landmarks already read for counting; nothing is
// stored. It's a rough check from one 2D camera, so the thresholds lean towards saying nothing.

export type FormIssueKind = "depth" | "rom" | "lean";
export type LeanSide = "left" | "right";

/** What one camera frame says about form. Each field is left out when the camera can't see it. */
export interface FormFrame {
  t: number;
  /** Hip height against the knee, in thigh lengths: above 0 the hip is below the knee (past parallel). */
  depth?: number;
  /** Torso tilt to one side, in degrees from upright: positive towards the lifter's right. Front-on views only. */
  lean?: number;
}

/** Which checks fit a lift: depth for squats, lean for lifts that stand square on both feet. */
export interface FormChecks {
  depth: boolean;
  lean: boolean;
}

export function checksFor(pattern: Pattern): FormChecks {
  return { depth: pattern === "squat", lean: pattern === "squat" || pattern === "hinge" || pattern === "vpush" };
}

/** A hip this far (in thigh lengths) above the knee at the bottom counts as above parallel. The hip landmark
 *  is the joint, a little above the crease that "parallel" is judged by, so there's some give. */
export const SHALLOW = 0.08;
/** A side lean this many degrees from upright through the bottom of a rep counts. */
export const LEAN_DEG = 7;
/** An issue needs this share of the set's reps (and at least one) before it's worth a tip. */
export const SHARE = 0.25;
/** Knee travel of a squat to parallel and a little past, in degrees, for showing where short reps stopped. */
const FULL_SQUAT_DEG = 110;

const vis = (p?: Keypoint) => p?.visibility ?? 1;

/** Reads one frame's form signals from the pose landmarks (`aspect` is the frame's width / height). */
export function formFrame(t: number, kps: Keypoint[] | undefined, aspect: number, map: JointMap = BLAZEPOSE): FormFrame {
  const f: FormFrame = { t };
  if (!kps || kps.length === 0) return f;
  const at = (k: keyof JointMap) => kps[map[k]];

  // Depth: from the better-seen leg. Image y grows downwards, so a hip lower than the knee has the larger y.
  const legs = (["L", "R"] as const)
    .map((s) => ({ hip: at(`${s}hip`), knee: at(`${s}knee`) }))
    .filter((l) => l.hip && l.knee && vis(l.hip) > 0.5 && vis(l.knee) > 0.5)
    .sort((a, b) => Math.min(vis(b.hip), vis(b.knee)) - Math.min(vis(a.hip), vis(a.knee)));
  const leg = legs[0];
  if (leg?.hip && leg.knee) {
    const thigh = Math.hypot((leg.hip.x - leg.knee.x) * aspect, leg.hip.y - leg.knee.y);
    if (thigh > 0.02) f.depth = (leg.hip.y - leg.knee.y) / thigh;
  }

  // Lean: only when the lifter faces the camera (both shoulders and hips seen, shoulders wide in the frame).
  const ls = at("Lshoulder"),
    rs = at("Rshoulder"),
    lh = at("Lhip"),
    rh = at("Rhip");
  if (ls && rs && lh && rh && Math.min(vis(ls), vis(rs), vis(lh), vis(rh)) > 0.5) {
    const sx = ((ls.x + rs.x) / 2) * aspect,
      sy = (ls.y + rs.y) / 2,
      hx = ((lh.x + rh.x) / 2) * aspect,
      hy = (lh.y + rh.y) / 2;
    const torso = Math.hypot(sx - hx, sy - hy);
    const width = Math.abs(rs.x - ls.x) * aspect;
    if (torso > 0.02 && width / torso >= 0.45) {
      // Towards the lifter's right is the direction from their left shoulder to their right one, whichever
      // way the image is mirrored.
      const right = Math.sign(rs.x - ls.x) || 1;
      const dx = (sx - hx) * right;
      f.lean = (Math.atan2(dx, Math.max(1e-6, hy - sy)) * 180) / Math.PI;
    }
  }
  return f;
}

export interface FormIssue {
  kind: FormIssueKind;
  /** Reps with the issue, and the reps it could be judged on. */
  hit: number;
  of: number;
  /** Lean: which way. */
  side?: LeanSide;
  /** Depth and range: how far through a full rep the short ones got, 0 to 1 (for the figure). */
  reach?: number;
  /** Lean: the typical tilt of the reps that leaned, in degrees. */
  deg?: number;
}

export interface FormReport {
  /** Reps looked at (full and partial; failed attempts aren't judged). */
  reps: number;
  issues: FormIssue[];
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const enough = (hit: number, of: number) => hit >= 1 && hit >= Math.ceil(of * SHARE);

/** Looks at a set's reps (from the rep tracker) against the frames recorded while they happened. */
export function assessForm(reps: readonly Rep[], frames: readonly FormFrame[], checks: FormChecks): FormReport {
  const judged = reps.filter((r) => r.kind !== "failed");
  const issues: FormIssue[] = [];
  const during = (r: Rep) => frames.filter((f) => f.t >= r.start && f.t <= r.end);

  // Range: reps the tracker graded partial (short of the set's own deepest rep, or of the lift's minimum).
  const partial = judged.filter((r) => r.kind === "partial");
  if (judged.length >= 2 && enough(partial.length, judged.length))
    issues.push({ kind: "rom", hit: partial.length, of: judged.length, reach: clampReach(mean(partial.map((r) => r.depth))) });

  if (checks.depth) {
    const seen = judged
      .map((r) => ({ r, d: during(r).flatMap((f) => (f.depth === undefined ? [] : [f.depth])) }))
      .filter((x) => x.d.length);
    const shallow = seen.filter((x) => Math.max(...x.d) < -SHALLOW);
    if (seen.length && enough(shallow.length, seen.length))
      issues.push({
        kind: "depth",
        hit: shallow.length,
        of: seen.length,
        reach: clampReach(mean(shallow.map((x) => x.r.rom)) / FULL_SQUAT_DEG),
      });
  }

  if (checks.lean) {
    // The bottom half of each rep, around the turnaround, where a lean shows most.
    const seen = judged
      .map((r) => {
        const half = (r.end - r.start) / 4;
        const l = during(r).flatMap((f) => (f.lean === undefined || Math.abs(f.t - r.turn) > half ? [] : [f.lean]));
        return l.length ? mean(l) : undefined;
      })
      .filter((x): x is number => x !== undefined);
    const leaned = seen.filter((l) => Math.abs(l) >= LEAN_DEG);
    if (seen.length && enough(leaned.length, seen.length)) {
      const right = leaned.filter((l) => l > 0).length;
      const side: LeanSide = right * 2 >= leaned.length ? "right" : "left";
      const same = leaned.filter((l) => (side === "right" ? l > 0 : l < 0));
      if (enough(same.length, seen.length))
        issues.push({ kind: "lean", hit: same.length, of: seen.length, side, deg: Math.round(mean(same.map(Math.abs))) });
    }
  }
  return { reps: judged.length, issues };
}

const clampReach = (x: number) => Math.max(0.3, Math.min(0.9, Number.isFinite(x) ? x : 0.6));

/** The order to bring issues up when they're equally common: safety first, then depth, then range. */
const RANK: Record<FormIssueKind, number> = { lean: 0, depth: 1, rom: 2 };

/** The one issue worth a tip: the most common share of reps; on squats, depth says what short range would. */
export function mainIssue(report: FormReport): FormIssue | undefined {
  const list = report.issues.some((i) => i.kind === "depth") ? report.issues.filter((i) => i.kind !== "rom") : report.issues;
  return [...list].sort((a, b) => b.hit / b.of - a.hit / a.of || RANK[a.kind] - RANK[b.kind])[0];
}

/**
 * Collects a set's frames and reps as they come (the rep tracker restarts itself after a long pause, so a set
 * can span several), then reports between sets. Frames are kept for about four minutes at most.
 */
export class FormCheck {
  private frames: FormFrame[] = [];
  private done: Rep[] = [];
  constructor(private checks: FormChecks) {}

  push(f: FormFrame) {
    if (f.depth === undefined && f.lean === undefined) return;
    this.frames.push(f);
    if (this.frames.length > 7200) this.frames.splice(0, this.frames.length - 7200);
  }

  /** Reps from a tracker that ended itself; the next tracker's reps come in `report`. */
  keep(reps: readonly Rep[]) {
    this.done.push(...reps);
  }

  report(current: readonly Rep[]): FormReport {
    return assessForm([...this.done, ...current], this.frames, this.checks);
  }

  reset() {
    this.frames = [];
    this.done = [];
  }
}
