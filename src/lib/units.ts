import type { Unit } from "./types";

export const LB = 0.45359237;

export function toKg(value: number, unit: Unit): number {
  return unit === "kg" ? value : value * LB;
}

export function fromKg(kg: number, unit: Unit): number {
  return unit === "kg" ? kg : kg / LB;
}

/** A weight for display: whole numbers stay whole, otherwise up to two decimals (1.25, 2.5). */
export function fmtNum(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/0$/, "");
}

export function fmtWeight(kg: number, unit: Unit): string {
  return `${fmtNum(fromKg(kg, unit))} ${unit}`;
}
