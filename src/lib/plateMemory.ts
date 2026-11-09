// Smart plate memory: what's already on the bar, and only the change to make. Plates go on heaviest
// first (inside), so the plates that can stay are the shared run from the inside out; everything
// outside that run comes off, then the new outer plates go on. Per side, in the gym's unit.
import { t } from "./i18n";

export interface PlateChange {
  keep: number[];
  remove: number[];
  add: number[];
}

export function plateChange(onBar: readonly number[], target: readonly number[]): PlateChange {
  let i = 0;
  while (i < onBar.length && i < target.length && Math.abs(onBar[i] - target[i]) < 1e-6) i++;
  return { keep: target.slice(0, i), remove: onBar.slice(i).reverse(), add: target.slice(i) };
}

/** Plates touched per side: the work the change takes. */
export function changeCost(c: PlateChange): number {
  return c.remove.length + c.add.length;
}

const list = (xs: readonly number[], fmt: (n: number) => string) => {
  const counts = new Map<number, number>();
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
  return [...counts].map(([w, n]) => (n > 1 ? `${n}×${fmt(w)}` : fmt(w))).join(" + ");
};

/** "Take off 2.5, add 5 (each side)", "No change", or null when the bar starts empty. */
export function changeText(c: PlateChange, unit: string, fmt: (n: number) => string): string {
  if (!c.remove.length && !c.add.length) return t("pm.same");
  const off = list(c.remove, fmt);
  const add = list(c.add, fmt);
  if (c.remove.length && c.add.length) return t("pm.offAdd", { off, add, unit });
  return c.remove.length ? t("pm.off", { off, unit }) : t("pm.add", { add, unit });
}

/**
 * What's on the bar now: the plates for the last set of this exercise logged in this session (warm-up
 * sets count too). Derived from events, so nothing extra is stored and a reload keeps it.
 */
export function lastLoadedKg(events: readonly { type: string; sessionId?: string; exerciseId?: string; weight?: number; at: number }[], sessionId: string, exerciseId: string): number | null {
  let best: { at: number; weight: number } | null = null;
  for (const e of events) {
    if ((e.type !== "set" && e.type !== "warmup") || e.sessionId !== sessionId || e.exerciseId !== exerciseId || e.weight === undefined) continue;
    if (!best || e.at > best.at) best = { at: e.at, weight: e.weight };
  }
  return best?.weight ?? null;
}
