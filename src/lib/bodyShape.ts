// A 3D figure shaped like the lifter (Melvin, 2026-11-12: "show a 3d body of the user using their health data, BMI,
// height, gender and measurements and body fat"; "adjust the health 3d body using the users parameters as well, that
// should be a toggle"). The demo figures (rig.ts) are an average man and woman; this widens or narrows each part of
// one from the lifter's own numbers. It's an approximate shape, not a scan: tape measurements set the part they
// measure, and where there are none, BMI sets the overall build and body fat moves the waist and hips. Used by
// Body › Health (behind the "Shape the figure like me" switch, profile.shapeFigure) and by a coach looking at a
// client who shares their body data (docs/decisions/trainer-mode.md).
import { BODIES, type Body, type BodyKey } from "./demo/rig";
import type { AppEvent, MeasureSite, Profile } from "./types";

export interface BodyStats {
  sex?: "male" | "female" | null;
  heightCm?: number | null;
  weightKg?: number | null;
  bodyFat?: number | null;
  /** The latest tape measurement for each site, in cm. */
  measures?: Partial<Record<MeasureSite, number>>;
}

/**
 * The average adult each figure stands for: height, BMI, body fat and tape measurements in cm. The figures were
 * drawn as an ordinary build, so these set what "1×" means.
 */
export const AVERAGE: Record<BodyKey, { heightCm: number; bmi: number; bodyFat: number } & Record<MeasureSite, number>> = {
  male: {
    heightCm: 176,
    bmi: 24,
    bodyFat: 18,
    waist: 88,
    hips: 100,
    chest: 102,
    shoulders: 118,
    neck: 39,
    arm: 33,
    forearm: 28,
    thigh: 56,
    calf: 38,
  },
  female: {
    heightCm: 163,
    bmi: 23,
    bodyFat: 28,
    waist: 78,
    hips: 100,
    chest: 92,
    shoulders: 104,
    neck: 33,
    arm: 29,
    forearm: 24,
    thigh: 57,
    calf: 36,
  },
};

/** No part goes thinner or thicker than this times the average, so a typo can't draw a stick or a ball. */
export const LIMITS = [0.7, 1.7] as const;
const clamp = (x: number) => Math.min(LIMITS[1], Math.max(LIMITS[0], x));

/** How many times the average each part is. */
export interface Factors {
  hips: number;
  waist: number;
  chest: number;
  shoulders: number;
  neck: number;
  arm: number;
  forearm: number;
  thigh: number;
  calf: number;
  /** Muscle definition drawn on the figure: less with more body fat. */
  def: number;
}

/** Whether there's anything to shape from: a weight with a height, a body fat, or a tape measurement. */
export const canShape = (s: BodyStats) =>
  !!(s.heightCm && s.weightKg) || s.bodyFat != null || Object.values(s.measures ?? {}).some((v) => v != null && v > 0);

export function factors(key: BodyKey, s: BodyStats): Factors {
  const avg = AVERAGE[key];
  const height = s.heightCm && s.heightCm >= 120 && s.heightCm <= 230 ? s.heightCm : avg.heightCm;
  // Overall build from BMI: at the same height, girth goes with the square root of weight.
  const bmi = s.heightCm && s.weightKg ? s.weightKg / (s.heightCm / 100) ** 2 : null;
  const build = bmi && bmi > 12 && bmi < 70 ? Math.sqrt(bmi / avg.bmi) : 1;
  // Body fat over the average goes mostly to the waist, then the hips; limbs take a little.
  const fat = s.bodyFat != null && s.bodyFat >= 3 && s.bodyFat <= 60 ? s.bodyFat - avg.bodyFat : 0;
  const estimate: Record<MeasureSite, number> = {
    waist: build * (1 + fat * 0.012),
    hips: build * (1 + fat * 0.006),
    chest: build * (1 + fat * 0.003),
    shoulders: build,
    neck: Math.sqrt(build),
    arm: build ** 0.8 * (1 + fat * 0.003),
    forearm: build ** 0.6,
    thigh: build ** 0.9 * (1 + fat * 0.004),
    calf: build ** 0.6,
  };
  // A tape measurement, taken against height, sets its part outright.
  const at = (site: MeasureSite) => {
    const cm = s.measures?.[site];
    return clamp(cm && cm > 5 && cm < 300 ? cm / height / (avg[site] / avg.heightCm) : estimate[site]);
  };
  return {
    hips: at("hips"),
    waist: at("waist"),
    chest: at("chest"),
    shoulders: at("shoulders"),
    neck: at("neck"),
    arm: at("arm"),
    forearm: at("forearm"),
    thigh: at("thigh"),
    calf: at("calf"),
    def: Math.min(1.6, Math.max(0.3, 1 - fat * 0.04)),
  };
}

/** Where each torso measurement sits along the torso tables (0 at the hips, about 1 at the shoulders). */
const TORSO: [number, keyof Factors][] = [
  [0.05, "hips"],
  [0.4, "waist"],
  [0.8, "chest"],
  [0.95, "shoulders"],
  [1.12, "neck"],
];
function torsoFactor(f: Factors, t: number): number {
  const first = TORSO[0]!;
  const last = TORSO[TORSO.length - 1]!;
  if (t <= first[0]) return f[first[1]];
  for (let i = 1; i < TORSO.length; i++) {
    const [t1, k1] = TORSO[i]!;
    const [t0, k0] = TORSO[i - 1]!;
    if (t <= t1) return f[k0] + ((f[k1] - f[k0]) * (t - t0)) / (t1 - t0);
  }
  return f[last[1]];
}

const scaleRows = (tab: number[][], by: (t: number) => number) => tab.map(([t, ...v]) => [t!, ...v.map((x) => x * by(t!))]);

/** One of the demo figures, reshaped to these numbers. Bone lengths stay; only girth changes. */
export function shapeBody(key: BodyKey, s: BodyStats): Body {
  const base = BODIES[key];
  const f = factors(key, s);
  const limb = (part: "thigh" | "shin" | "upper" | "fore") =>
    part === "thigh" ? f.thigh : part === "shin" ? f.calf : part === "upper" ? f.arm : f.forearm;
  const parts = ["thigh", "shin", "upper", "fore"] as const;
  const each = (side: Body["side"]) => Object.fromEntries(parts.map((p) => [p, scaleRows(side[p], () => limb(p))])) as Body["side"];
  return {
    ...base,
    shW: base.shW * Math.sqrt(f.shoulders),
    hipW: base.hipW * Math.sqrt(f.hips),
    def: base.def * f.def,
    torsoSide: scaleRows(base.torsoSide, (t) => torsoFactor(f, t)),
    torsoFront: scaleRows(base.torsoFront, (t) => torsoFactor(f, t)),
    side: each(base.side),
    front: each(base.front),
  };
}

/** A lifter's own numbers from their profile and events: the latest weigh-in, body fat and tape measurement of each site. */
export function statsFrom(profile: Pick<Profile, "sex" | "heightCm" | "bodyweight">, events: readonly AppEvent[]): BodyStats {
  let weight: { at: number; kg: number } | null = null;
  let fat: { at: number; v: number } | null = null;
  const measures: Partial<Record<MeasureSite, { at: number; cm: number }>> = {};
  for (const e of events) {
    if (e.type === "bodyweight") {
      if (!weight || e.at > weight.at) weight = { at: e.at, kg: e.kg };
      if (e.bodyFat != null && (!fat || e.at > fat.at)) fat = { at: e.at, v: e.bodyFat };
    } else if (e.type === "measure") {
      const m = measures[e.site];
      if (!m || e.at > m.at) measures[e.site] = { at: e.at, cm: e.cm };
    }
  }
  return {
    sex: profile.sex === "male" || profile.sex === "female" ? profile.sex : null,
    heightCm: profile.heightCm ?? null,
    weightKg: weight?.kg ?? (profile.bodyweight || null),
    bodyFat: fat?.v ?? null,
    measures: Object.fromEntries(Object.entries(measures).map(([k, v]) => [k, v.cm])),
  };
}
