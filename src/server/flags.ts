// Server state for feature flags and A/B tests (Gradelings' src/server/flags.ts). The flags themselves live in
// src/lib/flags.ts; this keeps what an admin changed and the running tests, answers the app's GET /api/flags/,
// and counts each test's results from the usage events. Test installs are left out of every result.
import {
  pickVariant,
  pValue,
  rolledOut,
  verdict,
  type Experiment,
  type ExperimentStatus,
  type FlagState,
  type ResultRow,
  type Variant,
  type Verdict,
} from "@/lib/experiments";
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

const toExperiment = (r: Record<string, unknown>): Experiment | null => {
  const flag = String(r.flag);
  if (!isFlagName(flag)) return null;
  let variants: Variant[] = [];
  try {
    variants = JSON.parse(String(r.variants)) as Variant[];
  } catch {
    return null;
  }
  return {
    flag,
    description: String(r.description),
    status: String(r.status) as ExperimentStatus,
    variants,
    winner: r.winner == null ? null : parse(r.winner),
    startedAt: r.started_at == null ? null : n(r.started_at),
    stoppedAt: r.stopped_at == null ? null : n(r.stopped_at),
  };
};

export async function listExperiments(): Promise<Experiment[]> {
  const rows = await query("SELECT * FROM experiments ORDER BY created_at DESC");
  return rows.map(toExperiment).filter((e): e is Experiment => e != null);
}

export async function getExperiment(flag: FlagName): Promise<Experiment | null> {
  const rows = await query("SELECT * FROM experiments WHERE flag = ?", [flag]);
  return rows[0] ? toExperiment(rows[0]) : null;
}

/** A new test starts as a draft (everyone sees the control). One test per flag. */
export async function createExperiment(flag: FlagName, description: string, variants: Variant[], now = Date.now()): Promise<boolean> {
  const rows = await query(
    `INSERT INTO experiments (flag, description, status, variants, created_at) VALUES (?, ?, 'draft', ?, ?) ON CONFLICT(flag) DO NOTHING RETURNING flag`,
    [flag, description.trim(), JSON.stringify(variants.map((v) => ({ value: v.value, weight: v.weight }))), now],
  );
  return rows.length > 0;
}

export async function startExperiment(flag: FlagName, now = Date.now()): Promise<boolean> {
  return (await run("UPDATE experiments SET status = 'running', started_at = ? WHERE flag = ? AND status = 'draft'", [now, flag])) > 0;
}

/** Stops a running test: everyone gets the winner (the control when none is given). */
export async function stopExperiment(flag: FlagName, winner: AnyFlagValue | null, now = Date.now()): Promise<boolean> {
  return (
    (await run("UPDATE experiments SET status = 'stopped', stopped_at = ?, winner = ? WHERE flag = ? AND status = 'running'", [
      now,
      winner == null ? null : JSON.stringify(winner),
      flag,
    ])) > 0
  );
}

/** Deletes a draft or stopped test and its assignments; the flag goes back to what the Flags tab says. */
export async function deleteExperiment(flag: FlagName): Promise<boolean> {
  const done = await run("DELETE FROM experiments WHERE flag = ? AND status != 'running'", [flag]);
  if (done) await run("DELETE FROM experiment_assignments WHERE flag = ?", [flag]);
  return done > 0;
}

/**
 * Every flag's value for one install (GET /api/flags/). A test on a flag wins over its rollout. An install is
 * recorded in a running test the first time it asks, but only if it's an install we know (it sends usage
 * stats), so random ids can't fill the table; one with stats off asks without an id and gets the control.
 */
export async function flagsFor(id: string | null, now = Date.now()): Promise<Record<FlagName, AnyFlagValue>> {
  const [states, experiments] = await Promise.all([flagStates(), listExperiments()]);
  const out = {} as Record<FlagName, AnyFlagValue>;
  for (const name of Object.keys(FLAGS) as FlagName[]) out[name] = rolledOut(name, states.get(name), id);
  for (const e of experiments) {
    if (e.status === "draft") continue;
    const v = pickVariant(e, id);
    out[e.flag] = v;
    if (e.status === "running" && id)
      await run(
        `INSERT INTO experiment_assignments (flag, install_id, variant, at) SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM installs WHERE id = ?)
         ON CONFLICT(flag, install_id) DO NOTHING`,
        [e.flag, id, JSON.stringify(v), now, id],
      );
  }
  return out;
}

export interface ExperimentResults {
  rows: (ResultRow & { pTrials: number | null; pPaid: number | null; pActive: number | null })[];
  verdict: Verdict;
  trialVerdict: Verdict;
}

/** Per variant: installs in the test, how many started a trial and paid after joining it, and worked out in 7 days. */
export async function experimentResults(e: Experiment, now = Date.now()): Promise<ExperimentResults> {
  const rows = await query(
    `SELECT a.variant,
       COUNT(*) AS installs,
       SUM(CASE WHEN EXISTS (SELECT 1 FROM events x WHERE x.install_id = a.install_id AND x.name = 'trial_start' AND x.at >= a.at)
             OR EXISTS (SELECT 1 FROM subscription_events s WHERE s.install_id = a.install_id AND s.kind = 'trial_start' AND s.at >= a.at) THEN 1 ELSE 0 END) AS trials,
       SUM(CASE WHEN EXISTS (SELECT 1 FROM subscription_events s WHERE s.install_id = a.install_id AND s.kind IN ('purchase', 'trial_convert', 'renew') AND s.at >= a.at) THEN 1 ELSE 0 END) AS paid,
       SUM(CASE WHEN EXISTS (SELECT 1 FROM events x WHERE x.install_id = a.install_id AND x.name = 'workout_finish' AND x.at >= ?) THEN 1 ELSE 0 END) AS active
     FROM experiment_assignments a JOIN installs i ON i.id = a.install_id
     WHERE a.flag = ? AND i.test = 0 GROUP BY a.variant`,
    [now - 7 * 86_400_000, e.flag],
  );
  const by = new Map(rows.map((r) => [String(r.variant), r]));
  const base: ResultRow[] = e.variants.map((v) => {
    const r = by.get(JSON.stringify(v.value));
    return { variant: v.value, installs: n(r?.installs), trials: n(r?.trials), paid: n(r?.paid), active: n(r?.active) };
  });
  const c = base[0];
  return {
    rows: base.map((r, i) => ({
      ...r,
      pTrials: i && c ? pValue(c.installs, c.trials, r.installs, r.trials) : null,
      pPaid: i && c ? pValue(c.installs, c.paid, r.installs, r.paid) : null,
      pActive: i && c ? pValue(c.installs, c.active, r.installs, r.active) : null,
    })),
    verdict: verdict(base, "paid"),
    trialVerdict: verdict(base, "trials"),
  };
}
