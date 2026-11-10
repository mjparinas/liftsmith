// Feature flags (Gradelings pattern, AGENTS.md "Borrowed from Gradelings"). Every flag is defined here in code
// with its default and allowed values, so the admin panel can only switch things that exist. Its value for
// everyone, a rollout to a share of installs, and A/B tests live on the server (src/server/flags.ts); the app
// reads them from /api/flags/ (src/lib/remoteFlags.ts) and keeps the last answer on the device, so flags work
// offline and change without a store release. A value set on this device (a hidden test switch) wins over both.
import { hash } from "./random";

export const FLAGS = {
  /** Length of the Pro trial offered at the end of setup (Melvin, 2026-11-09: 14 days; A/B 7 vs 14 later). */
  trialDays: {
    default: 14,
    options: [7, 14] as const,
    label: "Trial length (days)",
    description: "How long the Pro trial offered at the end of setup lasts. The public site always says 14 days.",
  },
  /** Counting reps from the phone's motion sensors on the workout screen (off: it was unreliable in tests). */
  repMotion: {
    default: false,
    options: [false, true] as const,
    label: "Phone-motion rep counting",
    description: "Counting reps from the phone's motion sensors on the workout screen. Off because it was unreliable in tests.",
  },
} as const;

export type FlagName = keyof typeof FLAGS;
export type FlagValue<K extends FlagName> = (typeof FLAGS)[K]["options"][number];
export type AnyFlagValue = string | number | boolean;

export const FLAG_CACHE_KEY = "liftsmith.flags";
export const FLAG_LOCAL_KEY = "liftsmith.flags.local";

export const isFlagName = (v: unknown): v is FlagName => typeof v === "string" && Object.prototype.hasOwnProperty.call(FLAGS, v);
/** Whether `v` is one of the flag's allowed values. */
export const allowed = (name: FlagName, v: unknown): v is AnyFlagValue => (FLAGS[name].options as readonly unknown[]).includes(v);

function read(key: string): Partial<Record<FlagName, unknown>> {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "{}") ?? {};
  } catch {
    return {};
  }
}
function write(key: string, v: Record<string, unknown>) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    // Storage full or blocked: defaults still apply.
  }
}

/** The flag's value: this device's own setting, else the cached server value, else the default. */
export function flag<K extends FlagName>(name: K): FlagValue<K> {
  for (const v of [read(FLAG_LOCAL_KEY)[name], read(FLAG_CACHE_KEY)[name]]) if (allowed(name, v)) return v as FlagValue<K>;
  return FLAGS[name].default as FlagValue<K>;
}

/** Stores flag values from the server (or a test) on top of what's cached. Unknown flags and values are dropped. */
export function cacheFlags(values: Record<string, unknown>) {
  const next = { ...read(FLAG_CACHE_KEY) };
  for (const [k, v] of Object.entries(values)) if (isFlagName(k) && allowed(k, v)) next[k] = v;
  write(FLAG_CACHE_KEY, next);
}

/** Replaces the cached server values with the server's latest answer, so a flag set back to its default clears. */
export function replaceServerFlags(values: Record<string, unknown>) {
  const next: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) if (isFlagName(k) && allowed(k, v)) next[k] = v;
  write(FLAG_CACHE_KEY, next);
}

/** This device's own value for a flag (a hidden test switch), which the server never overrides. */
export function setLocalFlag<K extends FlagName>(name: K, value: FlagValue<K>) {
  write(FLAG_LOCAL_KEY, { ...read(FLAG_LOCAL_KEY), [name]: value });
}

/** A stable A/B variant for this device, for when the server hasn't assigned one. */
export function variant<K extends FlagName>(name: K, deviceId: string): FlagValue<K> {
  const opts = FLAGS[name].options;
  return opts[hash(`${name}:${deviceId}`) % opts.length] as FlagValue<K>;
}

/** A stable bucket from 0 to 9,999 for an install, so the same installs keep a partial rollout as it grows. */
export const bucket = (seed: string) => hash(seed) % 10_000;
