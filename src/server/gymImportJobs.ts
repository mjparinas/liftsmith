// Country and every-country gym imports as a server job (Melvin, 2026-11-15: "get gym imports to run on the server"),
// so Admin › Gyms can be closed while ~860 cities import (docs/decisions/gyms.md "Imports run on the server").
//
// A job is a row in gym_import_jobs with one row per city in gym_import_items. A worker holds the job's lease
// (`lease_until`), imports two cities at a time with importArea (gymImport.ts, unchanged: idempotent, claimed gyms
// never touched), writes each city's outcome as it lands, and when its own time runs out hands over to a fresh
// invocation of /api/cron/gym-imports/ (`kickWorker`). That cron route also runs every five minutes (vercel.json), so
// a hand-over that never arrived, a crashed worker or a city waiting to retry is picked up within minutes. A city the
// map servers were too busy for goes back in line after 3 and then 10 minutes, as on the old in-browser run. The admin
// page only reads the job (`jobStatus`), so closing it changes nothing, and reopening it shows the live progress.
// When a job finishes the admin who started it gets an email (if they left "Email me when it's done" on).
import { randomBytes } from "node:crypto";

import { resendMailer, siteOrigin, type Mailer } from "./alerts";
import { batch, query, run } from "./db";
import { IMPORT_LIMITS, importArea, importKey, lastImported, type ImportResult } from "./gymImport";

/** Two cities at a time: each on its own map server, which stays within each server's per-client slots. */
export const IMPORT_WORKERS = 2;
/** A city whose map servers were all busy goes back in line this many times, after these pauses. */
export const RETRY_AFTER_MS = [3 * 60_000, 10 * 60_000];
/** How recent an import must be for "Skip cities imported in the last 7 days" to pass it over. */
export const RECENT_MS = 7 * 86_400_000;
export const JOB_LIMITS = {
  /** A worker's own time: the cron route's 800 seconds, less room to hand over. */
  runMs: 760_000,
  /** A city isn't started unless one whole city import still fits before the worker's time is up. */
  cityMs: IMPORT_LIMITS.budgetMs + 20_000,
  /** The lease outlives the worker's time a little, so a crashed worker's job is picked up a minute later. */
  leaseSlackMs: 60_000,
  /** Jobs and their cities are kept this long. */
  keepMs: 90 * 86_400_000,
};

export type JobState = "running" | "stopped" | "done";
type ItemState = "pending" | "running" | "waiting" | "ok" | "failed";
type Ok = Extract<ImportResult, { ok: true }>;

/** One city's outcome, without the step-by-step log (that stays on its gym_imports row). */
export type CityResult = Omit<Ok, "log"> | { ok: false; id?: string; error: string; detail?: string; ms?: number };

export interface CityLine {
  where: string;
  at: number;
  r: CityResult;
}

export interface JobStatus {
  id: string;
  label: string;
  state: JobState;
  total: number;
  skipped: number;
  startedBy: string;
  notify: boolean;
  startedAt: number;
  endedAt: number;
  /** When a worker last wrote anything, so the page can tell a job that's waiting for its next worker. */
  activeAt: number;
  done: number;
  active: string[];
  waiting: number;
  pending: number;
  failed: CityLine[];
  /** The latest finished cities, newest first (at most 300). */
  recent: CityLine[];
  sums: { found: number; added: number; updated: number; unchanged: number; kept: number };
}

const strip = (r: ImportResult): CityResult => {
  if (r.ok) {
    const { log, ...rest } = r;
    void log;
    return rest;
  }
  return {
    ok: false,
    id: r.id,
    error: r.error === "where" ? "That place wasn't found." : "No map server answered in time.",
    detail: r.detail,
    ms: r.ms,
  };
};

const parse = <T>(s: unknown, fallback: T): T => {
  try {
    return s ? (JSON.parse(String(s)) as T) : fallback;
  } catch {
    return fallback;
  }
};

/** The places a country import covers ("ALL" for every country), less those imported cleanly in the last 7 days. */
export async function placesFor(
  cities: readonly string[],
  skipRecent: boolean,
  now = Date.now(),
): Promise<{ todo: string[]; skipped: number }> {
  if (!skipRecent) return { todo: [...cities], skipped: 0 };
  const last = await lastImported(cities);
  const todo = cities.filter((c) => !((last[importKey(c)] ?? 0) > now - RECENT_MS));
  return { todo, skipped: cities.length - todo.length };
}

/** The job still running, if any (one at a time, so two runs never fight over the map servers). */
export async function runningJob(): Promise<string | null> {
  const [row] = await query<{ id: string }>("SELECT id FROM gym_import_jobs WHERE state = 'running' ORDER BY started_at LIMIT 1");
  return row ? String(row.id) : null;
}

/** Makes a job of these places. Refuses (null) while another job is running. */
export async function createJob(
  j: { label: string; places: readonly string[]; skipped?: number; startedBy: string; notify: boolean },
  now = Date.now(),
): Promise<{ id: string } | { error: "running"; id: string } | { error: "empty" }> {
  const places = [...new Set(j.places.map((p) => p.trim()).filter(Boolean))];
  if (!places.length) return { error: "empty" };
  const busy = await runningJob();
  if (busy) return { error: "running", id: busy };
  const id = randomBytes(8).toString("hex");
  await run("DELETE FROM gym_import_items WHERE job IN (SELECT id FROM gym_import_jobs WHERE started_at < ?)", [now - JOB_LIMITS.keepMs]);
  await run("DELETE FROM gym_import_jobs WHERE started_at < ?", [now - JOB_LIMITS.keepMs]);
  await run(
    `INSERT INTO gym_import_jobs (id, label, state, total, skipped, started_by, notify, started_at, active_at)
     VALUES (?, ?, 'running', ?, ?, ?, ?, ?, ?)`,
    [id, j.label.slice(0, 120), places.length, j.skipped ?? 0, j.startedBy, j.notify ? 1 : 0, now, now],
  );
  for (let i = 0; i < places.length; i += 200)
    await batch(
      places.slice(i, i + 200).map((place, k) => ({
        sql: "INSERT INTO gym_import_items (job, idx, place, state) VALUES (?, ?, ?, 'pending')",
        args: [id, i + k, place.slice(0, 200)],
      })),
    );
  return { id };
}

/** Stops a running job: the cities being imported finish, nothing new starts. */
export async function stopJob(id: string, now = Date.now()): Promise<boolean> {
  return (await run("UPDATE gym_import_jobs SET state = 'stopped', ended_at = ? WHERE id = ? AND state = 'running'", [now, id])) > 0;
}

/** Hides a finished job from the page (Close). */
export async function dismissJob(id: string): Promise<boolean> {
  return (await run("UPDATE gym_import_jobs SET dismissed = 1 WHERE id = ? AND state <> 'running'", [id])) > 0;
}

/** The cities of a job that didn't import (failed, or never reached because it was stopped), for Retry failed. */
export async function unfinishedPlaces(id: string): Promise<string[]> {
  const rows = await query<{ place: string }>("SELECT place FROM gym_import_items WHERE job = ? AND state <> 'ok' ORDER BY idx", [id]);
  return rows.map((r) => String(r.place));
}

const line = (r: Record<string, unknown>): CityLine => ({
  where: String(r.place),
  at: Number(r.at),
  r: parse<CityResult>(r.result, { ok: false, error: "No result." }),
});

/** The job the page shows: the one running, else the latest not closed. Null when there's none. */
export async function jobStatus(id?: string): Promise<JobStatus | null> {
  const [job] = id
    ? await query("SELECT * FROM gym_import_jobs WHERE id = ?", [id])
    : await query("SELECT * FROM gym_import_jobs WHERE dismissed = 0 ORDER BY state = 'running' DESC, started_at DESC LIMIT 1");
  if (!job) return null;
  const jid = String(job.id);
  const counts = await query<{ state: ItemState; n: number }>(
    "SELECT state, COUNT(*) AS n FROM gym_import_items WHERE job = ? GROUP BY state",
    [jid],
  );
  const n = (s: ItemState) => Number(counts.find((c) => c.state === s)?.n ?? 0);
  const active = await query("SELECT place FROM gym_import_items WHERE job = ? AND state = 'running' ORDER BY idx", [jid]);
  const failed = await query("SELECT place, at, result FROM gym_import_items WHERE job = ? AND state = 'failed' ORDER BY at", [jid]);
  const recent = await query(
    "SELECT place, at, result FROM gym_import_items WHERE job = ? AND state IN ('ok', 'failed') ORDER BY at DESC LIMIT 300",
    [jid],
  );
  const [sums] = await query(
    `SELECT COALESCE(SUM(found), 0) AS found, COALESCE(SUM(added), 0) AS added, COALESCE(SUM(updated), 0) AS updated,
       COALESCE(SUM(unchanged), 0) AS unchanged, COALESCE(SUM(kept), 0) AS kept
     FROM gym_import_items WHERE job = ? AND state = 'ok'`,
    [jid],
  );
  return {
    id: jid,
    label: String(job.label),
    state: String(job.state) as JobState,
    total: Number(job.total),
    skipped: Number(job.skipped),
    startedBy: String(job.started_by),
    notify: Number(job.notify) === 1,
    startedAt: Number(job.started_at),
    endedAt: Number(job.ended_at),
    activeAt: Number(job.active_at),
    done: n("ok") + n("failed"),
    active: active.map((r) => String(r.place)),
    waiting: n("waiting"),
    pending: n("pending"),
    failed: failed.map(line),
    recent: recent.map(line),
    sums: {
      found: Number(sums?.found ?? 0),
      added: Number(sums?.added ?? 0),
      updated: Number(sums?.updated ?? 0),
      unchanged: Number(sums?.unchanged ?? 0),
      kept: Number(sums?.kept ?? 0),
    },
  };
}

/** Everything about a job for its debug log: every city with its result, earlier busy tries and step-by-step log. */
export async function jobLog(id: string) {
  const status = await jobStatus(id);
  if (!status) return null;
  const items = await query("SELECT idx, place, state, tries, at, result, retried FROM gym_import_items WHERE job = ? ORDER BY idx", [id]);
  const ids = items.map((r) => parse<CityResult>(r.result, { ok: false, error: "" }).id).filter((x): x is string => !!x);
  const logs: Record<string, string> = {};
  for (let i = 0; i < ids.length; i += 400) {
    const part = ids.slice(i, i + 400);
    for (const r of await query(`SELECT id, log FROM gym_imports WHERE id IN (${part.map(() => "?").join(",")})`, part))
      logs[String(r.id)] = String(r.log);
  }
  return {
    run: status.label,
    state: status.state,
    startedBy: status.startedBy,
    startedAt: new Date(status.startedAt).toISOString(),
    endedAt: status.endedAt ? new Date(status.endedAt).toISOString() : null,
    total: status.total,
    skippedAsRecent: status.skipped,
    cities: items.map((r) => {
      const res = parse<CityResult>(r.result, { ok: false, error: "Not imported yet." });
      return {
        where: String(r.place),
        state: String(r.state),
        tries: Number(r.tries),
        finishedAt: Number(r.at) ? new Date(Number(r.at)).toISOString() : null,
        ...res,
        log: res.id ? (logs[res.id] ?? "") : "",
        triedAgain: parse<CityResult[]>(r.retried, []),
      };
    }),
  };
}

export interface WorkerOptions {
  /** When this worker must have stopped starting cities. */
  deadline?: number;
  importer?: typeof importArea;
  sleep?: (ms: number) => Promise<void>;
  mail?: Mailer | null;
  /** The pause before the second lane starts, so Nominatim (one request a second) isn't asked twice at once. */
  staggerMs?: number;
}

export interface WorkerResult {
  job: string | null;
  imported: number;
  /** Whether cities are ready to start now (hand over to a fresh worker), as opposed to only waiting to retry. */
  more: boolean;
  finished: boolean;
}

/**
 * Takes the running job's lease if nobody holds it and imports its cities, two at a time, until they're done or this
 * worker's time is up. Safe to call any number of times at once: only one worker holds a job.
 */
export async function runWorker(opts: WorkerOptions = {}): Promise<WorkerResult> {
  const started = Date.now();
  const deadline = opts.deadline ?? started + JOB_LIMITS.runMs;
  const importer = opts.importer ?? importArea;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((ok) => setTimeout(ok, ms)));
  const lease = () => deadline + JOB_LIMITS.leaseSlackMs;
  const [job] = await query<{ id: string }>(
    `UPDATE gym_import_jobs SET lease_until = ?
     WHERE id = (SELECT id FROM gym_import_jobs WHERE state = 'running' ORDER BY started_at LIMIT 1) AND lease_until < ?
     RETURNING id`,
    [lease(), Date.now()],
  );
  if (!job) return { job: null, imported: 0, more: false, finished: false };
  const id = String(job.id);
  // Cities a worker that died was in the middle of go back in line (an import is safe to run again).
  await run("UPDATE gym_import_items SET state = 'pending', tries = MAX(tries - 1, 0) WHERE job = ? AND state = 'running'", [id]);
  let imported = 0;
  const stillRunning = async () => (await query("SELECT 1 FROM gym_import_jobs WHERE id = ? AND state = 'running'", [id])).length > 0;

  const take = async (): Promise<{ idx: number; place: string; tries: number } | null> => {
    for (;;) {
      if (deadline - Date.now() < JOB_LIMITS.cityMs || !(await stillRunning())) return null;
      const now = Date.now();
      const [row] = await query(
        `UPDATE gym_import_items SET state = 'running', tries = tries + 1, at = ?
         WHERE job = ? AND idx = (
           SELECT idx FROM gym_import_items WHERE job = ? AND (state = 'pending' OR (state = 'waiting' AND not_before <= ?))
           ORDER BY state = 'waiting', idx LIMIT 1)
         RETURNING idx, place, tries`,
        [now, id, id, now],
      );
      if (row) return { idx: Number(row.idx), place: String(row.place), tries: Number(row.tries) };
      // Nothing ready: wait here for a city that's pausing if it comes due in this worker's time, else leave it to
      // the next worker (the five-minute cron).
      const [soon] = await query<{ at: number | null }>(
        "SELECT MIN(not_before) AS at FROM gym_import_items WHERE job = ? AND state = 'waiting'",
        [id],
      );
      const at = soon?.at == null ? null : Number(soon.at);
      if (at === null || at + JOB_LIMITS.cityMs > deadline) return null;
      await sleep(Math.max(1000, Math.min(at - Date.now(), 5000)));
    }
  };

  const lane = async (w: number) => {
    if (w) await sleep(opts.staggerMs ?? 1500);
    for (let item = await take(); item; item = await take()) {
      const r = await importer(item.place, fetch, Date.now(), { server: w }).catch((e: unknown): ImportResult => ({
        ok: false,
        id: "",
        error: "map",
        detail: String(e instanceof Error ? e.message : e),
        ms: 0,
        log: [],
      }));
      imported++;
      const now = Date.now();
      const res = strip(r);
      const again = RETRY_AFTER_MS[item.tries - 1];
      if (!r.ok && r.error === "map" && again !== undefined) {
        // Busy map servers: back in line after a pause, keeping this try for the debug log.
        await run(
          `UPDATE gym_import_items SET state = 'waiting', not_before = ?, at = ?,
             retried = json_insert(CASE WHEN retried = '' THEN '[]' ELSE retried END, '$[#]', json(?))
           WHERE job = ? AND idx = ?`,
          [now + again, now, JSON.stringify({ ...res, at: new Date(now).toISOString() }), id, item.idx],
        );
      } else
        await run(
          `UPDATE gym_import_items SET state = ?, at = ?, result = ?, found = ?, added = ?, updated = ?, unchanged = ?, kept = ?
           WHERE job = ? AND idx = ?`,
          [
            r.ok ? "ok" : "failed",
            now,
            JSON.stringify(res),
            r.ok ? r.found : 0,
            r.ok ? r.added : 0,
            r.ok ? r.updated : 0,
            r.ok ? r.unchanged : 0,
            r.ok ? r.kept : 0,
            id,
            item.idx,
          ],
        );
      await run("UPDATE gym_import_jobs SET active_at = ?, lease_until = ? WHERE id = ?", [now, lease(), id]);
    }
  };
  try {
    await Promise.all(Array.from({ length: IMPORT_WORKERS }, (_, w) => lane(w)));
  } finally {
    // Cities this worker started and didn't finish (it can't happen short of a crash) go back in line.
    await run("UPDATE gym_import_items SET state = 'pending' WHERE job = ? AND state = 'running'", [id]).catch(() => 0);
  }
  const left = await query<{ state: ItemState; n: number }>(
    "SELECT state, COUNT(*) AS n FROM gym_import_items WHERE job = ? AND state IN ('pending', 'waiting') GROUP BY state",
    [id],
  );
  const pending = Number(left.find((l) => l.state === "pending")?.n ?? 0);
  const waiting = Number(left.find((l) => l.state === "waiting")?.n ?? 0);
  let finished = false;
  if (!pending && !waiting)
    finished =
      (await run("UPDATE gym_import_jobs SET state = 'done', ended_at = ? WHERE id = ? AND state = 'running'", [Date.now(), id])) > 0;
  // Let the next worker in at once.
  await run("UPDATE gym_import_jobs SET lease_until = 0 WHERE id = ?", [id]);
  if (finished) await emailDone(id, opts.mail === undefined ? resendMailer() : opts.mail).catch(() => false);
  const running = !finished && (await stillRunning());
  return { job: id, imported, more: running && pending > 0, finished };
}

const mins = (ms: number) => {
  const m = Math.round(ms / 60_000);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};

/** The finished-job email to the admin who started it. Sent once (`emailed`), only if they asked. */
export async function emailDone(id: string, mail: Mailer | null): Promise<boolean> {
  if (!mail) return false;
  const s = await jobStatus(id);
  if (!s || !s.notify || !s.startedBy || s.state !== "done") return false;
  if (!(await run("UPDATE gym_import_jobs SET emailed = 1 WHERE id = ? AND emailed = 0", [id]))) return false;
  const failed = s.failed;
  const lines = [
    `The gym import of ${s.label} is done: ${s.done - failed.length} of ${s.total} cities imported in ${mins(s.endedAt - s.startedAt)}.`,
    `Gyms: ${s.sums.found} found, ${s.sums.added} new, ${s.sums.updated} changed${s.sums.kept ? `, ${s.sums.kept} claimed left alone` : ""}.`,
    ...(s.skipped ? [`${s.skipped} cities imported in the last 7 days were skipped.`] : []),
    ...(failed.length
      ? [
          "",
          `${failed.length} ${failed.length === 1 ? "city" : "cities"} failed (Retry failed on Admin › Gyms runs them again):`,
          ...failed.slice(0, 25).map((f) => `- ${f.where}: ${f.r.ok ? "" : `${f.r.error}${f.r.detail ? ` (${f.r.detail})` : ""}`}`),
          ...(failed.length > 25 ? [`…and ${failed.length - 25} more.`] : []),
        ]
      : []),
    "",
    `Open Admin › Gyms: ${siteOrigin()}/admin/?tab=Gyms`,
  ];
  const ok = await mail(
    s.startedBy,
    `Gym import done: ${s.label}, ${s.done - failed.length} of ${s.total} cities${failed.length ? `, ${failed.length} failed` : ""}`,
    lines.join("\n"),
  ).catch(() => false);
  if (!ok) await run("UPDATE gym_import_jobs SET emailed = 0 WHERE id = ?", [id]).catch(() => 0);
  return ok;
}

/**
 * Starts a fresh worker in its own invocation of /api/cron/gym-imports/ (its own 800 seconds), so the request that
 * asked for it can return. On a vercel.app address (behind Vercel's sign-in) it goes to the public site instead.
 * Returns whether the worker route said it started.
 */
export async function kickWorker(origin: string, send: typeof fetch = fetch, env: NodeJS.ProcessEnv = process.env): Promise<boolean> {
  const secret = env.CRON_SECRET;
  if (!secret) return false;
  let base = origin.replace(/\/$/, "");
  try {
    if (new URL(base).host.endsWith(".vercel.app")) base = siteOrigin();
  } catch {
    base = siteOrigin();
  }
  const r = await send(`${base}/api/cron/gym-imports/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  return !!r?.ok;
}
