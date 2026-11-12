import { distanceText } from "@/lib/cardio";
import { date, relative, t } from "@/lib/i18n";
import { barFor } from "@/lib/loads";
import { loadBar } from "@/lib/plates";
import { TIMED } from "@/lib/progression";
import { implementsFor, perSide } from "@/lib/sides";
import type { Exercise, Gym, Unit } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";

export function loadText(ex: Exercise, kg: number, unit: Unit): string {
  if (ex.load === "bodyweight") return kg > 0 ? `+${fmtNum(fromKg(kg, unit))} ${unit}` : t("fmt.bodyweight");
  const w = `${fmtNum(fromKg(kg, unit))} ${unit}`;
  // "each" only for a pair: a one-dumbbell move's weight is just the dumbbell.
  return ex.load === "dumbbell" && implementsFor(ex) === 2 ? t("fmt.each", { weight: w }) : w;
}

/**
 * "8 reps" or "30 s", and for moves done one side at a time "8 reps each side" or "30 s each side",
 * so every list, the rest card, the lock screen and the watches say the count is per side.
 */
export function repsText(ex: Exercise, reps: number): string {
  if (ex.cardio) return clock(reps);
  const side = perSide(ex.id);
  if (TIMED.has(ex.id)) return t(side ? "fmt.secondsSide" : "fmt.seconds", { n: fmtNum(reps) });
  return t(side ? "fmt.repsSide" : "fmt.reps", { n: fmtNum(reps), count: reps });
}

/** A logged set's reps: "8 left · 7 right" when the two sides differed, else as `repsText`. */
export function loggedRepsText(ex: Exercise, s: { reps: number; repsL?: number; repsR?: number }): string {
  if (!ex.cardio && s.repsL !== undefined && s.repsR !== undefined && s.repsL !== s.repsR)
    return t("fmt.repsLR", { left: fmtNum(s.repsL), right: fmtNum(s.repsR) });
  return repsText(ex, s.reps);
}

/**
 * The next set in one line, for the lock-screen notification, the watches and the rest-over alert:
 * "80 kg × 5 reps", or for cardio its time and distance ("20:00 · 3 km"), with no weight.
 */
export function setText(
  ex: Exercise,
  kg: number,
  reps: number,
  unit: Unit,
  distanceM?: number,
  sides?: { repsL?: number; repsR?: number },
): string {
  if (ex.cardio) return ex.cardio === "distance" && distanceM ? `${clock(reps)} · ${distanceText(distanceM, unit)}` : clock(reps);
  return `${loadText(ex, kg, unit)} × ${loggedRepsText(ex, { reps, ...sides })}`;
}

export function plateText(ex: Exercise, kg: number, gym: Gym): string | undefined {
  if (ex.load !== "barbell") return undefined;
  const bar = barFor(ex, gym);
  const l = loadBar(fromKg(kg, gym.unit), bar.weight, gym.plates);
  return l.perSide.length ? t("fmt.eachSide", { plates: l.perSide.map(fmtNum).join(" + "), unit: gym.unit }) : t("fmt.emptyBar");
}

export function clock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export function ago(ms: number, now = Date.now()): string {
  const d = Math.floor((now - ms) / 86400_000);
  if (d <= 0) return t("time.today");
  if (d === 1) return t("time.yesterday");
  if (d < 7) return relative(-d, "day");
  return date(ms, { month: "short", day: "numeric" });
}
