import { date, relative, t } from "@/lib/i18n";
import { barFor } from "@/lib/loads";
import { loadBar } from "@/lib/plates";
import { TIMED } from "@/lib/progression";
import type { Exercise, Gym, Unit } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";

export function loadText(ex: Exercise, kg: number, unit: Unit): string {
  if (ex.load === "bodyweight") return kg > 0 ? `+${fmtNum(fromKg(kg, unit))} ${unit}` : t("fmt.bodyweight");
  const w = `${fmtNum(fromKg(kg, unit))} ${unit}`;
  return ex.load === "dumbbell" ? t("fmt.each", { weight: w }) : w;
}

export function repsText(ex: Exercise, reps: number): string {
  if (ex.cardio) return clock(reps);
  return TIMED.has(ex.id) ? t("fmt.seconds", { n: fmtNum(reps) }) : t("fmt.reps", { n: fmtNum(reps), count: reps });
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
