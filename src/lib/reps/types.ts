// Automatic rep counting (camera on the workout screen; phone motion behind the `repMotion` flag). Shared types for the camera (pose) and
// motion (watch or phone IMU) trackers. Everything here runs on the device; no video or motion data
// leaves it.

export type RepKind = "full" | "partial" | "failed";

/** One sample of the movement signal, from either source. */
export interface MotionSample {
  /** Milliseconds (any clock, increasing). */
  t: number;
  /** The range-of-motion signal: a joint angle in degrees for the camera, or position in metres for IMU. */
  pos: number;
  /** Vertical bar (or wrist) position in metres, up positive, when known. Used for bar speed. */
  bar?: number;
  /** Tracking confidence, 0 to 1. Under 0.3 counts as lost. */
  conf: number;
}

export interface Rep {
  index: number;
  kind: RepKind;
  /** When the lifter left the rest position, reached the turnaround, and got back (ms). */
  start: number;
  turn: number;
  end: number;
  /** Deepest excursion from rest, in signal units (degrees for the camera). */
  rom: number;
  /** Share of the set's deepest full rep reached, 0 to 1. */
  depth: number;
  concentricMs: number;
  eccentricMs: number;
  /** Mean concentric speed: m/s when the bar scale is known, otherwise signal units a second. */
  speed: number;
  /** True when `speed` is in m/s. */
  speedIsMetres: boolean;
  /** How much slower than the set's fastest full rep, 0 to 1. */
  velocityLoss: number;
  /** A slow rep (50%+ velocity loss) or one with a sticking point. */
  grinder: boolean;
  /** The bar stalled (under 15% of the rep's peak speed for 250 ms+) or sank partway up. */
  sticking: boolean;
}

export interface SetSummary {
  reps: Rep[];
  full: number;
  partial: number;
  failed: number;
  grinders: number;
  /** First movement to the end of the last attempt (ms), the set's length. */
  startedAt?: number;
  endedAt?: number;
  durationMs?: number;
  /** Sum of every attempt's time away from rest. */
  timeUnderLoadMs: number;
  /** Mean concentric speed of the fastest and the last full rep. */
  bestSpeed?: number;
  lastSpeed?: number;
  /** Velocity loss of the last full rep against the fastest, 0 to 1. */
  velocityLoss?: number;
  /** A rough reps-in-reserve estimate from velocity loss. Undefined under 3 full reps. */
  estRir?: number;
}

/** How an exercise moves, for the tracker. */
export interface MotionProfile {
  /** The joint angle the camera tracker follows. */
  signal: "knee" | "hip" | "elbow" | "shoulder";
  /** True when the rest position has the larger angle (standing tall, arms straight). */
  restHigh: boolean;
  /** True when the lift starts with the lifting (concentric) half: curl, row, pull-up, press from the rack. */
  concentricFirst: boolean;
  /** Smallest excursion (degrees) that counts as a full rep from a side view. */
  minRom: number;
  /** Which body point stands in for the bar. */
  bar: "wrists" | "shoulders" | "hips";
}
