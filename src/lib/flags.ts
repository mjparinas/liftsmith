// Feature flags (Gradelings pattern, AGENTS.md "Borrowed from Gradelings"). Every flag is defined here
// in code with its default and allowed values. Server state arrives later (with the integrations
// server) and is cached on the device, so flags work offline and can change without a store release.
// A/B tests read through the same path: the server assigns a variant, or the device picks a stable one.
import { hash } from "./random";

export const FLAGS = {
  /** Length of the Pro trial offered at the end of setup (Melvin, 2026-11-09: 14 days; A/B 7 vs 14 later). */
  trialDays: { default: 14, options: [7, 14] as const },
  /** Rep counter lab: camera and motion rep counting experiment (Settings: tap the title five times). */
  repLab: { default: false, options: [false, true] as const },
} as const;

export type FlagName = keyof typeof FLAGS;
export type FlagValue<K extends FlagName> = (typeof FLAGS)[K]["options"][number];

export const FLAG_CACHE_KEY = "liftsmith.flags";

function cache(): Partial<Record<FlagName, unknown>> {
  try {
    return JSON.parse(localStorage.getItem(FLAG_CACHE_KEY) ?? "{}") ?? {};
  } catch {
    return {};
  }
}

/** The flag's value: the cached server value when it's one of the allowed options, otherwise the default. */
export function flag<K extends FlagName>(name: K): FlagValue<K> {
  const def = FLAGS[name];
  const v = cache()[name];
  return ((def.options as readonly unknown[]).includes(v) ? v : def.default) as FlagValue<K>;
}

/** Stores flag values from the server (or a test). Unknown flags and values outside the options are dropped. */
export function cacheFlags(values: Record<string, unknown>) {
  const next = { ...cache() };
  for (const [k, v] of Object.entries(values)) {
    const def = (FLAGS as Record<string, { options: readonly unknown[] }>)[k];
    if (def?.options.includes(v)) next[k as FlagName] = v;
  }
  try {
    localStorage.setItem(FLAG_CACHE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: defaults still apply.
  }
}

/** A stable A/B variant for this device, for when the server hasn't assigned one. */
export function variant<K extends FlagName>(name: K, deviceId: string): FlagValue<K> {
  const opts = FLAGS[name].options;
  return opts[hash(`${name}:${deviceId}`) % opts.length] as FlagValue<K>;
}
