// Server state for feature flags (Gradelings' src/server/flags.ts). The flags themselves live in src/lib/flags.ts;
// this keeps what an admin changed and answers the app's GET /api/flags/. A/B tests were removed on 2026-11-15
// (Melvin); their old tables (experiments, experiment_assignments) are no longer read or created.
import { rolledOut, type FlagState } from "@/lib/experiments";
import { FLAGS, isFlagName, type AnyFlagValue, type FlagName } from "@/lib/flags";

import { query, run } from "./db";

const n = (v: unknown) => Number(v ?? 0);
const parse = (v: unknown): AnyFlagValue | null => {
  try {
    const x = JSON.parse(String(v)) as unknown;
    return typeof x === "string" || typeof x === "number" || typeof x === "boolean" ? x : null;
  } catch {
    return null;
  }
};

export async function flagStates(): Promise<Map<FlagName, FlagState & { updatedAt: number; updatedBy: string }>> {
  const rows = await query("SELECT name, value, rollout, updated_at, updated_by FROM feature_flags");
  const out = new Map<FlagName, FlagState & { updatedAt: number; updatedBy: string }>();
  for (const r of rows) {
    const name = String(r.name);
    const value = parse(r.value);
    if (isFlagName(name) && value != null)
      out.set(name, { value, rollout: n(r.rollout), updatedAt: n(r.updated_at), updatedBy: String(r.updated_by) });
  }
  return out;
}

export async function setFlag(name: FlagName, value: AnyFlagValue, rollout: number, who: string, now = Date.now()) {
  await run(
    `INSERT INTO feature_flags (name, value, rollout, updated_at, updated_by) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(name) DO UPDATE SET value = excluded.value, rollout = excluded.rollout, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    [name, JSON.stringify(value), rollout, now, who],
  );
}

/** Back to the default in code for everyone. */
export async function resetFlag(name: FlagName) {
  await run("DELETE FROM feature_flags WHERE name = ?", [name]);
}

/** Every flag's value for one install (GET /api/flags/): what the Flags tab set, rolled out by install id. */
export async function flagsFor(id: string | null): Promise<Record<FlagName, AnyFlagValue>> {
  const states = await flagStates();
  const out = {} as Record<FlagName, AnyFlagValue>;
  for (const name of Object.keys(FLAGS) as FlagName[]) out[name] = rolledOut(name, states.get(name), id);
  return out;
}
