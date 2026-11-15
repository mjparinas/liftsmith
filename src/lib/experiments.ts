// Rollouts on the flags in flags.ts (Gradelings' flags.ts, cut to Liftsmith's value flags). Pure, so the server and
// tests share it. A/B tests were removed on 2026-11-15 (Melvin): the admin Flags tab's rollout is the only lever.
import { allowed, bucket, FLAGS, type AnyFlagValue, type FlagName } from "./flags";

/** What an admin set for a flag. Missing means never changed, so the default applies. */
export interface FlagState {
  value: AnyFlagValue;
  /** Share of installs (0 to 100) that get `value`; the rest keep the default. */
  rollout: number;
}

/** A flag's value for one install from what an admin set: an install with no id only gets a full rollout. */
export function rolledOut(name: FlagName, state: FlagState | undefined, id: string | null): AnyFlagValue {
  const def = FLAGS[name].default;
  if (!state || !allowed(name, state.value)) return def;
  if (state.rollout >= 100) return state.value;
  if (state.rollout <= 0 || !id) return def;
  return bucket(`flag:${name}:${id}`) < state.rollout * 100 ? state.value : def;
}
