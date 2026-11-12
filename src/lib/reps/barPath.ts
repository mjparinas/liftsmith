import type { Pattern } from "../types";
import { BLAZEPOSE, type Keypoint } from "./pose";
import type { Rep } from "./types";

// Bar path replay (Labs, `labBarPath`; Melvin, 2026-11-11, Labs idea 4). While the camera counts a set, the
// pose landmarks it already reads also give where the bar is (the shoulders on a squat, the hands on a hinge or
// an overhead press) and where the middle of the foot is. After the set, a short replay draws that path over a
// stick figure, and one cue says what to do about it: a bar that drifts forward at the bottom, forward on the way
// up, or back. Only landmarks are kept, in memory, until the next set: no video is recorded, nothing is saved.

export type PathIssueKind = "forwardBottom" | "forwardUp" | "back";

/** The lifts a bar path says something about: a bar that should travel straight up and down over the mid-foot. */
export function pathFits(pattern: Pattern): boolean {
  return pattern === "squat" || pattern === "hinge" || pattern === "vpush";
}

/** A drift this share of the lifter's height from where the rep started counts (about 6 cm at 1.70 m). */
export const DRIFT = 0.035;
/** An issue needs this share of the set's reps (and at least one) before it's worth a cue. */
export const SHARE = 0.25;
/** Used for centimetres when the lifter hasn't given their height. */
export const DEFAULT_HEIGHT_M = 1.7;
/** Hip to knee to ankle as a share of standing height (Drillis and Contini 1966), for the camera's scale. */
const LEG = 0.491;
/** Frames kept for one set: about a minute at 30 frames a second. */
const MAX_FRAMES = 1800;

const L = { heel: 29, toe: 31, ear: 7 };
const R = { heel: 30, toe: 32, ear: 8 };
const NOSE = 0;
const seen = (p?: Keypoint): p is Keypoint => !!p && (p.visibility ?? 1) > 0.5;
const vis = (p?: Keypoint) => p?.visibility ?? 0;

/** What one camera frame says about the bar. */
export interface PathFrame {
  t: number;
  kps: Keypoint[];
  /** The bar point, in normalised video coordinates (for drawing). */
  bar?: { x: number; y: number };
  /** The bar ahead of the mid-foot, in the frame's aspect-corrected units: positive is the way the lifter faces. */
  dx?: number;
  /** Hip to knee to ankle in the same units, when the leg is seen (the scale). */
  leg?: number;
}

/** Reads one frame: the bar point, the mid-foot and which way the lifter faces (`aspect` is width / height). */
export function pathFrame(t: number, kps: Keypoint[] | undefined, aspect: number, pattern: Pattern): PathFrame {
  const f: PathFrame = { t, kps: kps ?? [] };
  if (!kps?.length) return f;
  const barJoint = pattern === "squat" ? "shoulder" : "wrist";
  // Side-on, the far side is hidden: read the side the camera sees better.
  const sides = (["L", "R"] as const).map((s) => {
    const bar = kps[BLAZEPOSE[`${s}${barJoint}`]];
    const ankle = kps[BLAZEPOSE[`${s}ankle`]];
    return { s, bar, ankle, score: Math.min(vis(bar), vis(ankle)) };
  });
  const side = sides[0]!.score >= sides[1]!.score ? sides[0]! : sides[1]!;
  if (!seen(side.bar)) return f;
  f.bar = { x: side.bar.x, y: side.bar.y };
  const idx = side.s === "L" ? L : R;
  const heel = kps[idx.heel];
  const toe = kps[idx.toe];
  let mid: number | undefined;
  let facing = 0;
  if (seen(heel) && seen(toe)) {
    mid = (heel.x + toe.x) / 2;
    facing = Math.sign(toe.x - heel.x);
  } else if (seen(side.ankle)) mid = side.ankle.x;
  if (!facing) {
    const nose = kps[NOSE];
    const ear = kps[idx.ear];
    if (seen(nose) && seen(ear)) facing = Math.sign(nose.x - ear.x);
  }
  if (mid !== undefined && facing) f.dx = (side.bar.x - mid) * aspect * facing;
  const hip = kps[BLAZEPOSE[`${side.s}hip`]];
  const knee = kps[BLAZEPOSE[`${side.s}knee`]];
  if (seen(hip) && seen(knee) && seen(side.ankle))
    f.leg = Math.hypot((hip.x - knee.x) * aspect, hip.y - knee.y) + Math.hypot((knee.x - side.ankle.x) * aspect, knee.y - side.ankle.y);
  return f;
}

export interface PathIssue {
  kind: PathIssueKind;
  /** Reps with the drift, and the reps it could be judged on. */
  hit: number;
  of: number;
  /** The typical drift of those reps, in centimetres. */
  cm: number;
}

export interface PathReport {
  /** Reps looked at (full and partial; failed attempts aren't judged). */
  reps: number;
  issue?: PathIssue;
  /** The largest drift seen on any rep, in centimetres (for "it stayed within N cm"). */
  maxCm: number;
  /** The rep to replay: the worst one with the issue, otherwise the deepest. */
  replay?: { frames: PathFrame[] };
}

interface RepPath {
  rep: Rep;
  frames: PathFrame[];
  forward: number;
  back: number;
  /** When the biggest forward drift happened. */
  forwardAt: number;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const enough = (hit: number, of: number) => hit >= 1 && hit >= Math.ceil(of * SHARE);

/** Each rep's drift from where it started, in shares of the lifter's height. */
function repPaths(reps: readonly Rep[], frames: readonly PathFrame[], heightUnits: number): RepPath[] {
  const out: RepPath[] = [];
  for (const rep of reps) {
    const during = frames.filter((f) => f.t >= rep.start && f.t <= rep.end);
    const pts = during.flatMap((f) => (f.dx === undefined ? [] : [{ t: f.t, dx: f.dx }]));
    if (pts.length < 5) continue;
    // A five-frame moving average takes out the landmarks' jitter.
    const smooth = pts.map((p, i) => ({ t: p.t, dx: mean(pts.slice(Math.max(0, i - 2), i + 3).map((q) => q.dx)) }));
    const base = smooth[0]!.dx;
    let forward = 0;
    let back = 0;
    let forwardAt = rep.turn;
    for (const p of smooth) {
      const d = (p.dx - base) / heightUnits;
      if (d > forward) {
        forward = d;
        forwardAt = p.t;
      }
      back = Math.max(back, -d);
    }
    out.push({ rep, frames: during, forward, back, forwardAt });
  }
  return out;
}

/** Looks at a set's reps (from the rep tracker) against the frames recorded while they happened. */
export function assessPath(reps: readonly Rep[], frames: readonly PathFrame[], heightM = DEFAULT_HEIGHT_M): PathReport {
  const judged = reps.filter((r) => r.kind !== "failed");
  const legMax = Math.max(0, ...frames.map((f) => f.leg ?? 0));
  if (!judged.length || legMax <= 0) return { reps: judged.length, maxCm: 0 };
  const paths = repPaths(judged, frames, legMax / LEG);
  if (!paths.length) return { reps: judged.length, maxCm: 0 };
  const cm = (share: number) => Math.round(share * heightM * 100);

  // Forward drift is split by where it peaked: up to a quarter of the rep past the turnaround is "at the bottom".
  const late = (p: RepPath) => p.forwardAt > p.rep.turn + (p.rep.end - p.rep.start) / 4;
  const groups: { kind: PathIssueKind; reps: RepPath[]; size: (p: RepPath) => number }[] = [
    { kind: "forwardBottom", reps: paths.filter((p) => p.forward >= DRIFT && p.forward >= p.back && !late(p)), size: (p) => p.forward },
    { kind: "forwardUp", reps: paths.filter((p) => p.forward >= DRIFT && p.forward >= p.back && late(p)), size: (p) => p.forward },
    { kind: "back", reps: paths.filter((p) => p.back >= DRIFT && p.back > p.forward), size: (p) => p.back },
  ];
  // The most common drift wins; on a tie, forward at the bottom (the usual one), then on the way up, then back.
  const best = groups.filter((g) => enough(g.reps.length, paths.length)).sort((a, b) => b.reps.length - a.reps.length)[0];
  const maxCm = cm(Math.max(...paths.map((p) => Math.max(p.forward, p.back))));
  if (!best) {
    const deepest = [...paths].sort((a, b) => b.rep.rom - a.rep.rom)[0]!;
    return { reps: judged.length, maxCm, replay: { frames: deepest.frames } };
  }
  const worst = [...best.reps].sort((a, b) => best.size(b) - best.size(a))[0]!;
  return {
    reps: judged.length,
    maxCm,
    issue: { kind: best.kind, hit: best.reps.length, of: paths.length, cm: cm(mean(best.reps.map(best.size))) },
    replay: { frames: worst.frames },
  };
}

/**
 * Collects a set's frames and reps as they come (the rep tracker restarts itself after a long pause, so a set
 * can span several), then reports between sets. Frames are kept for about a minute at most, in memory only.
 */
export class BarPath {
  private frames: PathFrame[] = [];
  private done: Rep[] = [];
  constructor(
    private pattern: Pattern,
    private heightM?: number,
  ) {}

  push(t: number, kps: Keypoint[] | undefined, aspect: number) {
    const f = pathFrame(t, kps, aspect, this.pattern);
    if (!f.bar) return;
    this.frames.push(f);
    if (this.frames.length > MAX_FRAMES) this.frames.splice(0, this.frames.length - MAX_FRAMES);
  }

  /** Reps from a tracker that ended itself; the next tracker's reps come in `report`. */
  keep(reps: readonly Rep[]) {
    this.done.push(...reps);
  }

  report(current: readonly Rep[]): PathReport {
    return assessPath([...this.done, ...current], this.frames, this.heightM);
  }

  reset() {
    this.frames = [];
    this.done = [];
  }
}
