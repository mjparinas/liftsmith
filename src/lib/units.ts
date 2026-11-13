import { num, t } from "./i18n";
import type { Unit } from "./types";

export const LB = 0.45359237;

export function toKg(value: number, unit: Unit): number {
  return unit === "kg" ? value : value * LB;
}

export function fromKg(kg: number, unit: Unit): number {
  return unit === "kg" ? kg : kg / LB;
}

/** A number for an input box or a file: a point for decimals in every language (1.25, 2.5). */
export function plainNum(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/0$/, "");
}

/**
 * A weight for display in the app's language: whole numbers stay whole, otherwise up to two decimals
 * (2.5 in English, 2,5 in French and Spanish). Not for input boxes or files: use plainNum there.
 */
export function fmtNum(n: number): string {
  return num(Math.round(n * 100) / 100, { maximumFractionDigits: 2, useGrouping: false });
}

/**
 * Total lifted (volume): the plain number under 1,000 ("0 kg", "640 lb"), then thousands with one decimal
 * ("12.4k kg", in each language's own way). Rounded before the check, so 999.6 reads "1k", never "1,000".
 */
export function fmtVolume(kg: number, unit: Unit): string {
  const v = Math.max(0, Math.round(fromKg(kg, unit)));
  if (v < 1000) return `${num(v)} ${unit}`;
  return t("progress.volumeK", { n: fmtNum(Math.round(v / 100) / 10), unit });
}

/** Body weight for display: to 0.1 kg or lb ("142 lb", "64.4 kg"). One rounding for every screen that shows it. */
export function fmtBodyweight(kg: number, unit: Unit): string {
  return `${fmtNum(Math.round(fromKg(kg, unit) * 10) / 10)} ${unit}`;
}

export function fmtWeight(kg: number, unit: Unit): string {
  return `${fmtNum(fromKg(kg, unit))} ${unit}`;
}

export const CM_PER_IN = 2.54;

/** Centimetres as whole feet and inches (5 ft 10 in), rounded to the nearest inch. */
export function cmToFtIn(cm: number): { ft: number; inch: number } {
  const total = Math.round(cm / CM_PER_IN);
  return { ft: Math.floor(total / 12), inch: total % 12 };
}

/** Feet and inches as centimetres, to 0.1 cm. */
export function ftInToCm(ft: number, inch: number): number {
  return Math.round((ft * 12 + inch) * CM_PER_IN * 10) / 10;
}

/** A height for display: 177 cm, or 5′ 10″ when the lifter uses pounds. */
export function fmtHeight(cm: number, unit: Unit): string {
  if (unit === "kg") return `${fmtNum(Math.round(cm))} cm`;
  const { ft, inch } = cmToFtIn(cm);
  return `${ft}′ ${inch}″`;
}
