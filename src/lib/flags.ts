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
  /** Labs (src/lib/labs.ts): camera rep counting on the workout screen, switched on in Settings › Labs (Pro). */
  labRepCount: {
    default: false,
    options: [false, true] as const,
    label: "Labs: camera rep counting",
    description: "Camera rep counting on the workout screen, an experiment Pro lifters switch on in Settings › Labs.",
  },
  /** Labs: counting reps from the phone's motion sensors on the workout screen (off: it was unreliable in tests). */
  repMotion: {
    default: false,
    options: [false, true] as const,
    label: "Phone-motion rep counting",
    description: "Counting reps from the phone's motion sensors on the workout screen. Off because it was unreliable in tests.",
  },
  /** Labs: bar speed from the camera while counting reps, with a stop-or-keep-going line. */
  labBarSpeed: {
    default: false,
    options: [false, true] as const,
    label: "Labs: camera bar speed",
    description: "Bar speed from the camera while counting reps, with how much it has dropped and when to end the set.",
  },
  /** Friends and the workout feed (docs/decisions/friends.md). Off hides Friends in the app and stops the server answering. */
  social: {
    default: true,
    options: [true, false] as const,
    label: "Friends and the feed",
    description: "Follow people, post workouts, likes and comments. Turn off to hide Friends everywhere and stop new posts at once.",
  },
  /** Labs: the Wear OS or Apple Watch app counts reps from wrist motion and fills in the phone's live set. */
  labWatchReps: {
    default: false,
    options: [false, true] as const,
    label: "Labs: watch rep counting",
    description: "The Wear OS or Apple Watch app counts reps from wrist motion during a set and fills them in on the phone.",
  },
  /** Labs: rest ends early once the heart rate is back down (restReady.ts, hrRestCut). */
  labHrRest: {
    default: false,
    options: [false, true] as const,
    label: "Labs: heart-rate rest timer",
    description: "Rest ends early once a heart rate monitor or watch shows the heart rate back near where the set started.",
  },
  /** Labs: a form check from the camera while counting reps (depth, short range, lean), with a tip between sets. */
  labFormCheck: {
    default: false,
    options: [false, true] as const,
    label: "Labs: camera form check",
    description: "Squat depth, short reps and a lean to one side, read by the camera while counting reps, with one tip between sets.",
  },
  /** Labs: trainer mode, coaching clients (invite codes and client reports, src/lib/trainer.ts). Being a client is free. */
  labTrainer: {
    default: false,
    options: [false, true] as const,
    label: "Labs: trainer mode",
    description: "Coaches invite clients and see their workouts in Settings › Coaching. Being someone's client needs no lab.",
  },
  /** Labs: say a set ("100 for 8", "too easy") on the workout screen, heard by the phone's on-device recognizer. */
  labVoiceLog: {
    default: false,
    options: [false, true] as const,
    label: "Labs: voice set logging",
    description: 'A microphone on the workout screen: say "100 for 8" or "too easy" to log a set, recognized on the device.',
  },
  /** Labs: today's max from warm-up bar speed, and a nudge to the working weight before the first hard set. */
  labSpeedMax: {
    default: false,
    options: [false, true] as const,
    label: "Labs: today's max from warm-ups",
    description: "Estimates today's max from the camera's warm-up bar speeds and suggests a lighter or heavier first working set.",
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
