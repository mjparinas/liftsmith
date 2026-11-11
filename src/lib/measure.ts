import type { AppEvent, MeasureEvent, MeasureSite, Unit } from "./types";
import { CM_PER_IN } from "./units";

// Body measurements (competitor gaps, Melvin 2026-11-11): tape measurements at a few body sites, logged on
// Body and photos. Stored in centimetres; lifters who use pounds see and type inches.

/** Any site's plausible range, in centimetres (a wrist-sized forearm to a large waist). */
export const MEASURE_RANGE: readonly [number, number] = [10, 250];

/** A sensible starting number for each site's − / + box, in centimetres. */
export const MEASURE_START: Record<MeasureSite, number> = {
  waist: 85,
  hips: 100,
  chest: 100,
  shoulders: 115,
  neck: 38,
  arm: 34,
  forearm: 29,
  thigh: 56,
  calf: 38,
};

/** The length unit that goes with the weight unit. */
export const lengthUnit = (unit: Unit): "cm" | "in" => (unit === "lb" ? "in" : "cm");

export function fromCm(cm: number, unit: Unit): number {
  return unit === "lb" ? cm / CM_PER_IN : cm;
}

export function toCm(v: number, unit: Unit): number {
  return unit === "lb" ? v * CM_PER_IN : v;
}

/** Every measurement of one site, oldest first. */
export function measuresOf(events: readonly AppEvent[], site: MeasureSite): MeasureEvent[] {
  return events.filter((e): e is MeasureEvent => e.type === "measure" && e.site === site).sort((a, b) => a.at - b.at);
}

/** Each measured site's latest reading and its change since the first, newest site first. */
export function measureSummary(events: readonly AppEvent[]): { site: MeasureSite; last: MeasureEvent; change?: number }[] {
  const by = new Map<MeasureSite, MeasureEvent[]>();
  for (const e of events) if (e.type === "measure") by.set(e.site, [...(by.get(e.site) ?? []), e]);
  return [...by.entries()]
    .map(([site, list]) => {
      const sorted = [...list].sort((a, b) => a.at - b.at);
      const last = sorted.at(-1)!;
      return { site, last, change: sorted.length > 1 ? last.cm - sorted[0]!.cm : undefined };
    })
    .sort((a, b) => b.last.at - a.last.at);
}
