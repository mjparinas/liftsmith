import type { Pattern } from "../types";
import type { MotionProfile } from "./types";

// How each lift looks to the camera. Angles are 2D, measured in the image, so a side view on the
// lifter is the setup we ask for; a front view shrinks the apparent range, which minRom allows for.

const SQUAT: MotionProfile = { signal: "knee", restHigh: true, concentricFirst: false, minRom: 45, bar: "shoulders" };
const HINGE: MotionProfile = { signal: "hip", restHigh: true, concentricFirst: false, minRom: 40, bar: "wrists" };
const PRESS: MotionProfile = { signal: "elbow", restHigh: true, concentricFirst: false, minRom: 45, bar: "wrists" };
const OVERHEAD: MotionProfile = { signal: "elbow", restHigh: false, concentricFirst: true, minRom: 50, bar: "wrists" };
const PULL: MotionProfile = { signal: "elbow", restHigh: true, concentricFirst: true, minRom: 45, bar: "wrists" };
const CURL: MotionProfile = { signal: "elbow", restHigh: true, concentricFirst: true, minRom: 60, bar: "wrists" };
const EXTENSION: MotionProfile = { signal: "elbow", restHigh: true, concentricFirst: false, minRom: 50, bar: "wrists" };
const RAISE: MotionProfile = { signal: "shoulder", restHigh: false, concentricFirst: true, minRom: 45, bar: "wrists" };
const BRIDGE: MotionProfile = { signal: "hip", restHigh: false, concentricFirst: true, minRom: 30, bar: "hips" };

const BY_ID: Record<string, MotionProfile> = {
  "lateral-raise": RAISE,
  "cable-lateral-raise": RAISE,
  "band-lateral-raise": RAISE,
  "rear-delt-fly": RAISE,
  "glute-bridge": BRIDGE,
  "hip-thrust": BRIDGE,
  "single-leg-hip-thrust": BRIDGE,
  "skull-crusher": EXTENSION,
  "db-overhead-extension": EXTENSION,
  "cable-pushdown": { ...EXTENSION, restHigh: false, concentricFirst: true },
  "band-pushdown": { ...EXTENSION, restHigh: false, concentricFirst: true },
  "leg-extension": { signal: "knee", restHigh: false, concentricFirst: true, minRom: 50, bar: "hips" },
  "lying-leg-curl": { signal: "knee", restHigh: true, concentricFirst: true, minRom: 50, bar: "hips" },
  "kb-swing": { ...HINGE, minRom: 35 },
  "nordic-curl": { signal: "knee", restHigh: false, concentricFirst: false, minRom: 30, bar: "shoulders" },
};

const BY_PATTERN: Partial<Record<Pattern, MotionProfile>> = {
  squat: SQUAT,
  lunge: SQUAT,
  hinge: HINGE,
  hpush: PRESS,
  vpush: OVERHEAD,
  hpull: PULL,
  vpull: PULL,
};

const NAME_HINTS: [RegExp, MotionProfile][] = [
  [/curl/, CURL],
  [/dip/, PRESS],
];

/** The motion profile for an exercise, or undefined for holds and carries (planks, farmer's carry) that have no reps. */
export function profileFor(id: string, pattern: Pattern): MotionProfile | undefined {
  if (BY_ID[id]) return BY_ID[id];
  if (id === "wrist-curl" || id === "shrug") return undefined; // too small a joint movement for the camera
  for (const [re, p] of NAME_HINTS) if (re.test(id)) return p;
  if (pattern === "carry" || /plank|carry|hold/.test(id)) return undefined;
  return BY_PATTERN[pattern] ?? (pattern === "isolation" ? CURL : undefined);
}
