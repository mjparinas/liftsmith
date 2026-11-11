// The maths behind Tools' newer calculators (Melvin, 2026-11-11: "1, 2, 3, 4, 5, 6, 7, 8"): strength scores
// (Wilks, IPF GL; DOTS is in onerm.ts), macros, body fat from a tape measure, FFMI, heart rate zones and
// training max waves. Pure functions in kilograms and centimetres, shared by the app's Tools screens
// (src/components/app/tools/) and the public pages under /tools/. Text lives in the screens.

export type Sex = "male" | "female";

// --- Wilks (1995) -------------------------------------------------------------------------------------------
// The original Wilks coefficients, as OpenPowerlifting uses them (crates/coefficients/src/wilks.rs), with body
// weight clamped to 40 to 201.9 kg for men and 26.51 to 154.53 kg for women.

const WILKS = {
  male: [-216.0475144, 16.2606339, -0.002388645, -0.00113732, 7.01863e-6, -1.291e-8],
  female: [594.31747775582, -27.23842536447, 0.82112226871, -0.00930733913, 4.731582e-5, -9.054e-8],
} as const;

export function wilksCoefficient(bodyweightKg: number, sex: Sex): number {
  if (!(bodyweightKg > 0)) return 0;
  const bw = sex === "male" ? Math.min(201.9, Math.max(40, bodyweightKg)) : Math.min(154.53, Math.max(26.51, bodyweightKg));
  const c = WILKS[sex];
  let denom = 0;
  for (let i = 0; i < c.length; i++) denom += c[i]! * bw ** i;
  return 500 / denom;
}

export function wilks(totalKg: number, bodyweightKg: number, sex: Sex): number {
  if (!(totalKg > 0)) return 0;
  return totalKg * wilksCoefficient(bodyweightKg, sex);
}

// --- IPF GL points (2020) -----------------------------------------------------------------------------------
// The IPF's Goodlift formula: total × 100 / (A − B·e^(−C·bw)), with published A, B and C for classic (raw) and
// equipped lifting, three lifts or bench only. Body weight under 35 kg scores nothing, as in the IPF's tables.

export type GlEvent = "classic" | "equipped" | "classicBench" | "equippedBench";

const GL: Record<GlEvent, Record<Sex, readonly [number, number, number]>> = {
  classic: { male: [1199.72839, 1025.18162, 0.00921], female: [610.32796, 1045.59282, 0.03048] },
  equipped: { male: [1236.25115, 1449.21864, 0.01644], female: [758.63878, 949.31382, 0.02435] },
  classicBench: { male: [320.98041, 281.40258, 0.01008], female: [142.40398, 442.52671, 0.04724] },
  equippedBench: { male: [381.22073, 733.79378, 0.02398], female: [221.82209, 357.00377, 0.02937] },
};

export function ipfGl(totalKg: number, bodyweightKg: number, sex: Sex, event: GlEvent = "classic"): number {
  if (!(totalKg > 0) || !(bodyweightKg >= 35)) return 0;
  const [a, b, c] = GL[event][sex];
  return (totalKg * 100) / (a - b * Math.exp(-c * bodyweightKg));
}

/** The total (kg) that scores `score` on a formula at this body weight: every formula is total × a factor. */
export function totalFor(score: number, bodyweightKg: number, scoreOf: (totalKg: number, bw: number) => number): number {
  const per = scoreOf(100, bodyweightKg) / 100;
  return per > 0 ? score / per : 0;
}

/** Rough DOTS levels (the same cut-offs as onerm.ts dotsBand): the next one up and its score, or null at elite. */
export const DOTS_LEVELS = [200, 300, 400, 500] as const;
export function nextDotsLevel(score: number): number | null {
  return DOTS_LEVELS.find((l) => l > score) ?? null;
}

// --- Macros -------------------------------------------------------------------------------------------------
// Calories from TDEE (tdee.ts) for the goal, then protein first (grams per kg of body weight, higher on a cut
// to keep muscle: Helms 2014, Morton 2018), fat at a quarter of calories but never under 0.6 g/kg (hormones),
// and carbs fill the rest, because they fuel hard sets.

export type MacroGoal = "cut" | "maintain" | "bulk";
export const MACRO_GOALS: readonly MacroGoal[] = ["cut", "maintain", "bulk"];

/** Grams of protein per kg of body weight for each goal. */
export const PROTEIN_PER_KG: Record<MacroGoal, number> = { cut: 2.2, maintain: 1.8, bulk: 1.8 };
export const FAT_SHARE = 0.25;
export const FAT_MIN_PER_KG = 0.6;

export interface Macros {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  /** Share of calories from each, 0 to 1. */
  split: { protein: number; fat: number; carbs: number };
}

/** Calories for a goal from TDEE: about 0.5 kg a week down (never below BMR), or a lean bulk of about +250. */
export function goalCalories(tdee: number, bmr: number, goal: MacroGoal): number {
  if (goal === "cut") return Math.max(bmr, tdee - 500);
  if (goal === "bulk") return tdee + 250;
  return tdee;
}

export function macros(kcal: number, kg: number, goal: MacroGoal): Macros {
  if (!(kcal > 0) || !(kg > 0)) return { kcal: 0, protein: 0, fat: 0, carbs: 0, split: { protein: 0, fat: 0, carbs: 0 } };
  let protein = Math.round(kg * PROTEIN_PER_KG[goal]);
  let fat = Math.round(Math.max((kcal * FAT_SHARE) / 9, kg * FAT_MIN_PER_KG));
  // A very low calorie number can't hold both: protein stays, fat drops to its floor, carbs go to zero.
  if (protein * 4 + fat * 9 > kcal) fat = Math.round(Math.max(0, (kcal - protein * 4) / 9));
  if (protein * 4 > kcal) protein = Math.round(kcal / 4);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const total = protein * 4 + fat * 9 + carbs * 4;
  return {
    kcal: Math.round(kcal),
    protein,
    fat,
    carbs,
    split: { protein: (protein * 4) / total, fat: (fat * 9) / total, carbs: (carbs * 4) / total },
  };
}

// --- Body fat from a tape measure (US Navy, Hodgdon and Beckett 1984) ---------------------------------------
// Men: waist and neck. Women: waist, hips and neck. Centimetres; height too. Within about 3 to 4 points of a
// DEXA scan for most people, less good for very muscular or very lean lifters.

export function navyBodyFat(sex: Sex, heightCm: number, waistCm: number, neckCm: number, hipsCm?: number): number | null {
  if (!(heightCm > 0) || !(waistCm > 0) || !(neckCm > 0)) return null;
  let pct: number;
  if (sex === "male") {
    if (waistCm <= neckCm) return null;
    pct = 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
  } else {
    if (!(hipsCm && hipsCm > 0) || waistCm + hipsCm <= neckCm) return null;
    pct = 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipsCm - neckCm) + 0.221 * Math.log10(heightCm)) - 450;
  }
  if (!Number.isFinite(pct) || pct < 2 || pct > 70) return null;
  return Math.round(pct * 10) / 10;
}

// --- FFMI (Kouri 1995) --------------------------------------------------------------------------------------
// Fat-free mass over height squared, plus the version normalized to 1.8 m. Kouri's drug-free lifters topped out
// near 25 (men); the bands are rough guides lifters use, about 4 lower for women.

export interface Ffmi {
  leanKg: number;
  ffmi: number;
  normalized: number;
}

export function ffmi(kg: number, heightCm: number, bodyFatPct: number): Ffmi | null {
  if (!(kg > 0) || !(heightCm > 0) || !(bodyFatPct >= 2 && bodyFatPct < 70)) return null;
  const m = heightCm / 100;
  const leanKg = kg * (1 - bodyFatPct / 100);
  const value = leanKg / (m * m);
  return { leanKg, ffmi: value, normalized: value + 6.1 * (1.8 - m) };
}

export type FfmiBand = "below" | "average" | "above" | "excellent" | "superior" | "rare";
export const FFMI_BANDS: readonly FfmiBand[] = ["below", "average", "above", "excellent", "superior", "rare"];
/** Where each band starts (normalized FFMI), after "below". */
export const FFMI_CUTS: Record<Sex, readonly number[]> = { male: [18, 20, 22, 23, 25], female: [14, 16, 18, 19, 21] };

export function ffmiBand(normalized: number, sex: Sex): FfmiBand {
  const cuts = FFMI_CUTS[sex];
  let i = 0;
  while (i < cuts.length && normalized >= cuts[i]!) i++;
  return FFMI_BANDS[i]!;
}

/** Kilograms of lean mass to gain to reach the next band, or null in the top band. */
export function leanToNextBand(f: Ffmi, heightCm: number, sex: Sex): { kg: number; band: FfmiBand } | null {
  const i = FFMI_BANDS.indexOf(ffmiBand(f.normalized, sex));
  const cut = FFMI_CUTS[sex][i];
  if (cut === undefined) return null;
  const m = heightCm / 100;
  return { kg: Math.max(0.1, (cut - f.normalized) * m * m), band: FFMI_BANDS[i + 1]! };
}

// --- Heart rate zones ---------------------------------------------------------------------------------------
// Maximum heart rate from age by Tanaka (2001: 208 − 0.7 × age), unless the lifter knows their own. Zones are
// 50–60, 60–70, 70–80, 80–90 and 90–100% of max, the same cut-offs as hrZone() in heartRate.ts, or of heart
// rate reserve (Karvonen: resting + share × (max − resting)) when resting heart rate is known.

export const tanakaMax = (age: number) => Math.round(208 - 0.7 * age);
export const ZONE_CUTS = [0.5, 0.6, 0.7, 0.8, 0.9, 1] as const;

export interface HrZoneRange {
  zone: 1 | 2 | 3 | 4 | 5;
  low: number;
  high: number;
}

export function hrZones(maxHr: number, restingHr?: number): HrZoneRange[] {
  const bpm = (p: number) => Math.round(restingHr ? restingHr + p * (maxHr - restingHr) : p * maxHr);
  return ([1, 2, 3, 4, 5] as const).map((zone) => ({
    zone,
    low: bpm(ZONE_CUTS[zone - 1]!),
    high: bpm(ZONE_CUTS[zone]!) - (zone < 5 ? 1 : 0),
  }));
}

// --- Training max waves -------------------------------------------------------------------------------------
// The app's own four-week waves (programs.ts WAVES): a training max at 85 or 90% of the one-rep max, three
// main sets a week at rising percentages, the last one for as many reps as are clean, then a light week.

export const WAVE_WEEKS: readonly { pcts: readonly number[]; reps: readonly number[]; amrap: boolean }[] = [
  { pcts: [0.65, 0.75, 0.85], reps: [5, 5, 5], amrap: true },
  { pcts: [0.7, 0.8, 0.9], reps: [3, 3, 3], amrap: true },
  { pcts: [0.75, 0.85, 0.95], reps: [5, 3, 1], amrap: true },
  { pcts: [0.4, 0.5, 0.6], reps: [5, 5, 5], amrap: false },
];

/** Rounds a weight to the nearest `step` (2.5 kg or 5 lb, the smallest jump with a pair of plates). */
export const roundTo = (w: number, step: number) => Math.round(w / step) * step;

export function waves(
  oneRepMax: number,
  tmShare = 0.9,
  step = 2.5,
): { tm: number; weeks: { weight: number; reps: number; amrap: boolean }[][] } {
  const tm = oneRepMax * tmShare;
  return {
    tm,
    weeks: WAVE_WEEKS.map((w) =>
      w.pcts.map((p, i) => ({ weight: roundTo(tm * p, step), reps: w.reps[i]!, amrap: w.amrap && i === w.pcts.length - 1 })),
    ),
  };
}
