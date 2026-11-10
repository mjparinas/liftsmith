// Rollouts and A/B tests on the flags in flags.ts (Gradelings' flags.ts and abVerdict.ts, cut to Liftsmith's
// value flags). Pure, so the server and tests share it. An experiment tests the values of one flag: its first
// variant is the control, shown to anyone outside a running test.
import { allowed, bucket, FLAGS, type AnyFlagValue, type FlagName } from "./flags";

/** What an admin set for a flag. Missing means never changed, so the default applies. */
export interface FlagState {
  value: AnyFlagValue;
  /** Share of installs (0 to 100) that get `value`; the rest keep the default. */
  rollout: number;
}

export type ExperimentStatus = "draft" | "running" | "stopped";

export interface Variant {
  value: AnyFlagValue;
  /** Relative share of installs, a whole number from 1 to 100. */
  weight: number;
}

export interface Experiment {
  flag: FlagName;
  description: string;
  status: ExperimentStatus;
  variants: Variant[];
  /** Once stopped, everyone gets this value (or the control if none was picked). */
  winner: AnyFlagValue | null;
  startedAt: number | null;
  stoppedAt: number | null;
}

/** A flag's value for one install from what an admin set: an install with no id only gets a full rollout. */
export function rolledOut(name: FlagName, state: FlagState | undefined, id: string | null): AnyFlagValue {
  const def = FLAGS[name].default;
  if (!state || !allowed(name, state.value)) return def;
  if (state.rollout >= 100) return state.value;
  if (state.rollout <= 0 || !id) return def;
  return bucket(`flag:${name}:${id}`) < state.rollout * 100 ? state.value : def;
}

/** The variant an install sees. Draft tests and installs with no id see the control; a stopped test, its winner. */
export function pickVariant(exp: Pick<Experiment, "flag" | "status" | "variants" | "winner">, id: string | null): AnyFlagValue {
  const control = exp.variants[0]?.value ?? FLAGS[exp.flag].default;
  if (exp.status === "stopped") return exp.winner != null && exp.variants.some((v) => v.value === exp.winner) ? exp.winner : control;
  if (exp.status !== "running" || !id) return control;
  const total = exp.variants.reduce((n, v) => n + v.weight, 0);
  if (total <= 0) return control;
  let at = bucket(`exp:${exp.flag}:${id}`) % total;
  for (const v of exp.variants) {
    if (at < v.weight) return v.value;
    at -= v.weight;
  }
  return control;
}

/** Checks a new experiment. Returns an error message, or null when it's fine. */
export function validateExperiment(flag: FlagName, variants: unknown, description: unknown): string | null {
  if (typeof description !== "string" || description.trim().length > 300) return "Keep the description under 300 characters.";
  if (!Array.isArray(variants) || variants.length < 2 || variants.length > 5) return "Give 2 to 5 variants.";
  const seen = new Set<unknown>();
  for (const v of variants as { value?: unknown; weight?: unknown }[]) {
    if (!v || !allowed(flag, v.value)) return `Each variant must be one of ${FLAGS[flag].options.join(", ")}.`;
    if (seen.has(v.value)) return "Each variant needs a different value.";
    seen.add(v.value);
    if (!Number.isInteger(v.weight) || Number(v.weight) < 1 || Number(v.weight) > 100) return "Weights are whole numbers from 1 to 100.";
  }
  return null;
}

/** Standard normal CDF (Abramowitz and Stegun 7.1.26, accurate to about 1e-7). */
export function normalCdf(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

/** Two-sided p-value of a two-proportion z-test (x1 of n1 against x2 of n2); null when it can't be worked out. */
export function pValue(n1: number, x1: number, n2: number, x2: number): number | null {
  if (n1 <= 0 || n2 <= 0) return null;
  const pooled = (x1 + x2) / (n1 + n2);
  if (pooled <= 0 || pooled >= 1) return null;
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2));
  return Math.min(1, 2 * (1 - normalCdf(Math.abs(x1 / n1 - x2 / n2) / se)));
}

/** Chance that rate B is really above rate A (normal approximation to the difference). */
export function chanceBetter(nA: number, xA: number, nB: number, xB: number): number | null {
  if (!nA || !nB) return null;
  const pA = xA / nA;
  const pB = xB / nB;
  const se = Math.sqrt((pA * (1 - pA)) / nA + (pB * (1 - pB)) / nB);
  if (se === 0) return pB > pA ? 1 : pB < pA ? 0 : 0.5;
  return normalCdf((pB - pA) / se);
}

export interface ResultRow {
  variant: AnyFlagValue;
  installs: number;
  trials: number;
  paid: number;
  active: number;
}
export type Metric = "trials" | "paid" | "active";
export interface Verdict {
  leader: AnyFlagValue | null;
  chance: number | null;
  /** Enough installs and at least 95% sure. */
  ready: boolean;
  message: string;
}

/** Installs each variant needs before a verdict means much. */
export const MIN_INSTALLS = 30;
const METRIC_WORDS: Record<Metric, string> = { trials: "starting a trial", paid: "paying", active: "working out this week" };
const pct = (x: number) => `${Math.round(x * 100)}%`;

/** A plain-words verdict (Gradelings' abVerdict): which variant is ahead on `metric`, and how likely it's real. */
export function verdict(rows: ResultRow[], metric: Metric = "paid"): Verdict {
  const control = rows[0];
  if (!control || rows.length < 2) return { leader: null, chance: null, ready: false, message: "Add a second variant to compare." };
  const small = rows.filter((r) => r.installs < MIN_INSTALLS);
  if (small.length)
    return {
      leader: null,
      chance: null,
      ready: false,
      message: `Too early to call: each variant needs at least ${MIN_INSTALLS} installs (${small.map((r) => `${String(r.variant)} has ${r.installs}`).join(", ")}).`,
    };
  const rate = (r: ResultRow) => r[metric] / r.installs;
  const what = METRIC_WORDS[metric];
  const best = rows.slice(1).reduce((b, r) => (rate(r) > rate(b) ? r : b), rows[1]!);
  if (rate(best) <= rate(control)) {
    const chance = chanceBetter(best.installs, best[metric], control.installs, control[metric]) ?? 0.5;
    return chance >= 0.95
      ? {
          leader: control.variant,
          chance,
          ready: true,
          message: `${String(control.variant)} (the control) is ahead on installs ${what}, and ${pct(chance)} likely to beat ${String(best.variant)}. Keep the control.`,
        }
      : { leader: null, chance: null, ready: false, message: `No variant beats the control on installs ${what} yet.` };
  }
  const chance = chanceBetter(control.installs, control[metric], best.installs, best[metric]) ?? 0.5;
  return {
    leader: best.variant,
    chance,
    ready: chance >= 0.95,
    message:
      chance >= 0.95
        ? `${String(best.variant)} is ahead: ${pct(rate(best))} of installs ${what} against ${pct(rate(control))}, and ${pct(chance)} likely to really be better.`
        : `${String(best.variant)} is ahead (${pct(rate(best))} against ${pct(rate(control))} ${what}), but only ${pct(chance)} likely to be better. Wait for more installs.`,
  };
}
