import type { SetSummary } from "./types";

// Camera bar speed (Labs, `labBarSpeed`; Melvin, 2026-11-11: "Camera bar speed" in place of bar speed
// sensors). The rep tracker already measures each rep's lifting speed; this turns a set's summary into
// what the counting stage shows: the last rep's speed, how far it has dropped from the set's fastest
// rep, and one thing to do about it. Speeds are in m/s when the lifter's height gives the camera a scale,
// otherwise only the drop (a share of the fastest rep) is shown.

/** A velocity loss from which the set is better ended (about one rep left, Sánchez-Medina 2011). */
export const STOP_LOSS = 0.3;
/** Full reps before the drop means anything: the first two set the pace. */
export const MIN_REPS = 3;

export type BarSpeedAdvice = "stop" | "left";

export interface BarSpeedReadout {
  /** The last full rep's mean lifting speed: m/s when `metres`, otherwise signal units a second. */
  speed: number;
  metres: boolean;
  /** Last full rep against the fastest, 0 to 1. */
  loss: number;
  /** Rough reps left in the tank, from the drop, once there are enough reps. */
  rir?: number;
  /** End the set now, say how many reps are left, or nothing yet. */
  advice?: BarSpeedAdvice;
}

export function barSpeed(s: SetSummary): BarSpeedReadout | undefined {
  const full = s.reps.filter((r) => r.kind === "full");
  const last = full[full.length - 1];
  if (!last || !(last.speed > 0)) return undefined;
  const loss = s.velocityLoss ?? 0;
  const enough = full.length >= MIN_REPS;
  return {
    speed: last.speed,
    metres: last.speedIsMetres,
    loss,
    rir: enough ? s.estRir : undefined,
    advice: !enough ? undefined : loss >= STOP_LOSS ? "stop" : s.estRir !== undefined ? "left" : undefined,
  };
}
