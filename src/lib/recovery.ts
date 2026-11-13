import { EXERCISE_BY_ID } from "./exercises";
import { t } from "./i18n";
import { LARGE_MUSCLES, MUSCLES, type AppEvent, type Muscle } from "./types";

// Each hard set adds fatigue to the muscles it works: full for primary, half for secondary, a
// little less when the set was left far from failure. Fatigue fades exponentially, so 90% of it is
// gone after about 48 hours for small muscles and 72 hours for large ones.

const PER_SET = 13; // % fatigue one primary set adds
const HOURS_90 = { small: 48, large: 72 };

export type Band = "fresh" | "ready" | "recovering" | "fatigued";

export const BANDS: { band: Band; label: string; min: number; colour: string; hint: string }[] = [
  {
    band: "fresh",
    get label() {
      return t("band.fresh");
    },
    min: 90,
    colour: "var(--band-fresh)",
    get hint() {
      return t("band.fresh.hint");
    },
  },
  {
    band: "ready",
    get label() {
      return t("band.ready");
    },
    min: 70,
    colour: "var(--band-ready)",
    get hint() {
      return t("band.ready.hint");
    },
  },
  {
    band: "recovering",
    get label() {
      return t("band.recovering");
    },
    min: 40,
    colour: "var(--band-recovering)",
    get hint() {
      return t("band.recovering.hint");
    },
  },
  {
    band: "fatigued",
    get label() {
      return t("band.fatigued");
    },
    min: 0,
    colour: "var(--band-fatigued)",
    get hint() {
      return t("band.fatigued.hint");
    },
  },
];

export function bandOf(recovery: number): (typeof BANDS)[number] {
  return BANDS.find((b) => recovery >= b.min) ?? BANDS[BANDS.length - 1]!;
}

function tau(m: Muscle): number {
  const h = LARGE_MUSCLES.has(m) ? HOURS_90.large : HOURS_90.small;
  return (h * 3600_000) / Math.log(10);
}

/** Recovery 0–100 for every muscle at `now`. */
export function recovery(events: readonly AppEvent[], now: number): Record<Muscle, number> {
  const fatigue = Object.fromEntries(MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>;
  const horizon = now - 7 * 24 * 3600_000;
  for (const e of events) {
    // Rehab beside the lifting is light by design and doesn't tire a muscle out (sessions-with-parts.md, stage 5).
    if (e.type !== "set" || e.at < horizon || e.at > now || e.partId === "rehab") continue;
    const ex = EXERCISE_BY_ID.get(e.exerciseId);
    if (!ex) continue;
    const effort = e.rir >= 4 ? 0.6 : e.rir >= 3 ? 0.8 : 1;
    const age = now - e.at;
    for (const m of ex.primary) fatigue[m] += PER_SET * effort * Math.exp(-age / tau(m));
    for (const m of ex.secondary) fatigue[m] += PER_SET * 0.5 * effort * Math.exp(-age / tau(m));
  }
  return Object.fromEntries(MUSCLES.map((m) => [m, Math.round(Math.max(0, 100 - Math.min(100, fatigue[m])))])) as Record<Muscle, number>;
}
