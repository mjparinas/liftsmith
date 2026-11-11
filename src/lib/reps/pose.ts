import type { MotionProfile, MotionSample } from "./types";

// Turns a pose (body keypoints from any model) into the tracker's signal: the profile's joint angle,
// the bar point's height in metres, and a confidence. Works with MediaPipe BlazePose (33 points) and
// MoveNet / ML Kit-style COCO layouts (17 points) through the index maps below.

export interface Keypoint {
  /** Normalised image coordinates, 0 to 1, y pointing down. */
  x: number;
  y: number;
  /** 0 to 1. */
  visibility?: number;
}

type Joint = "shoulder" | "elbow" | "wrist" | "hip" | "knee" | "ankle";
type Side = "L" | "R";
export type JointMap = Record<`${Side}${Joint}`, number>;

/** MediaPipe BlazePose / Pose Landmarker (33 landmarks). */
export const BLAZEPOSE: JointMap = {
  Lshoulder: 11,
  Rshoulder: 12,
  Lelbow: 13,
  Relbow: 14,
  Lwrist: 15,
  Rwrist: 16,
  Lhip: 23,
  Rhip: 24,
  Lknee: 25,
  Rknee: 26,
  Lankle: 27,
  Rankle: 28,
};
/** COCO 17 keypoints (MoveNet, PoseNet, ML Kit's subset order differs and maps here in the plugin). */
export const COCO17: JointMap = {
  Lshoulder: 5,
  Rshoulder: 6,
  Lelbow: 7,
  Relbow: 8,
  Lwrist: 9,
  Rwrist: 10,
  Lhip: 11,
  Rhip: 12,
  Lknee: 13,
  Rknee: 14,
  Lankle: 15,
  Rankle: 16,
};

const ANGLE: Record<MotionProfile["signal"], [Joint, Joint, Joint]> = {
  knee: ["hip", "knee", "ankle"],
  hip: ["shoulder", "hip", "knee"],
  elbow: ["shoulder", "elbow", "wrist"],
  shoulder: ["hip", "shoulder", "elbow"],
};

const BAR: Record<MotionProfile["bar"], Joint> = { wrists: "wrist", shoulders: "shoulder", hips: "hip" };

/** Angle at b in degrees, in pixel space (aspect = width / height of the frame). */
export function angle(a: Keypoint | undefined, b: Keypoint | undefined, c: Keypoint | undefined, aspect = 1): number {
  // A model that returns fewer points than the map expects leaves some out: no angle then.
  if (!a || !b || !c) return NaN;
  const v1x = (a.x - b.x) * aspect;
  const v1y = a.y - b.y;
  const v2x = (c.x - b.x) * aspect;
  const v2y = c.y - b.y;
  const d = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y);
  if (d === 0) return NaN;
  return (Math.acos(Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / d))) * 180) / Math.PI;
}

/** Segment lengths as a share of standing height (Drillis and Contini 1966). */
const LEG = 0.491; // hip to knee to ankle
const ARM = 0.333; // shoulder to elbow to wrist

/**
 * Follows one lifter across frames: picks the better-seen side, keeps a running scale (pixels to metres,
 * from the longest leg or arm length seen, which is when the limb is straight and square to the camera)
 * and produces tracker samples.
 */
export class PoseSignal {
  private pxPerHeight = 0;
  constructor(
    private profile: MotionProfile,
    private map: JointMap = BLAZEPOSE,
    /** The lifter's height in metres, for bar speed in m/s. Without it speeds are relative. */
    private heightM?: number,
  ) {}

  sample(t: number, kps: Keypoint[] | undefined, aspect: number): MotionSample {
    if (!kps || kps.length === 0) return { t, pos: NaN, conf: 0 };
    const [ja, jb, jc] = ANGLE[this.profile.signal];
    const side = (s: Side) => {
      const pts = [ja, jb, jc].map((j) => kps[this.map[`${s}${j}`]]);
      const vis = Math.min(...pts.map((p) => p?.visibility ?? 1));
      return { s, pts, vis };
    };
    const L = side("L");
    const R = side("R");
    // Side view: the far side is hidden, so use the nearer one. Facing the camera: average both.
    let pos: number;
    let conf: number;
    if (Math.abs(L.vis - R.vis) < 0.15 && L.vis > 0.5) {
      pos = (angle(L.pts[0], L.pts[1], L.pts[2], aspect) + angle(R.pts[0], R.pts[1], R.pts[2], aspect)) / 2;
      conf = Math.min(L.vis, R.vis);
    } else {
      const best = L.vis >= R.vis ? L : R;
      pos = angle(best.pts[0], best.pts[1], best.pts[2], aspect);
      conf = best.vis;
    }
    this.updateScale(kps, aspect);
    const barJ = BAR[this.profile.bar];
    const bl = kps[this.map[`L${barJ}`]];
    const br = kps[this.map[`R${barJ}`]];
    let bar: number | undefined;
    if (this.heightM && this.pxPerHeight > 0 && bl && br) {
      const y = ((bl.visibility ?? 1) >= (br.visibility ?? 1) ? bl : br).y;
      // y is a share of frame height; scale works in the same units. Up is positive.
      bar = (-y / this.pxPerHeight) * this.heightM;
    }
    return { t, pos, bar, conf };
  }

  private updateScale(kps: Keypoint[], aspect: number) {
    const len = (a?: Keypoint, b?: Keypoint) => (a && b ? Math.hypot((a.x - b.x) * aspect, a.y - b.y) : 0);
    const m = this.map;
    const est: number[] = [];
    for (const s of ["L", "R"] as Side[]) {
      const hip = kps[m[`${s}hip`]],
        knee = kps[m[`${s}knee`]],
        ankle = kps[m[`${s}ankle`]];
      const sh = kps[m[`${s}shoulder`]],
        el = kps[m[`${s}elbow`]],
        wr = kps[m[`${s}wrist`]];
      if (Math.min(hip?.visibility ?? 1, knee?.visibility ?? 1, ankle?.visibility ?? 1) > 0.6)
        est.push((len(hip, knee) + len(knee, ankle)) / LEG);
      if (Math.min(sh?.visibility ?? 1, el?.visibility ?? 1, wr?.visibility ?? 1) > 0.6) est.push((len(sh, el) + len(el, wr)) / ARM);
    }
    // Running max, slowly forgotten so a lifter walking away from the camera doesn't keep a stale scale.
    const now = Math.max(0, ...est);
    this.pxPerHeight = Math.max(now, this.pxPerHeight * 0.9995);
  }
}
