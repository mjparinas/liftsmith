import { num } from "./i18n";
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

export function fmtWeight(kg: number, unit: Unit): string {
  return `${fmtNum(fromKg(kg, unit))} ${unit}`;
}
