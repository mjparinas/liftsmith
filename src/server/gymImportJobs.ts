// The gym import job (Melvin, 2026-11-16: "this should really just be one button … and this should be automatically
// refreshed for new gyms found once a day"; docs/decisions/gyms.md "One button: every gym in the world").
//
// One job runs at a time, on the server, in steps:
// 1. **map**: the job's items (gymImport.ts importItem). The worldwide job starts with one item per country, which split
//    into their regions as they run; the daily job has one item, everything new on the map since the last one.
// 2. **web**: every unclaimed gym with a website that is due a read (gymEnrich.ts enrichBatch): phone, email, address,
//    postcode, hours, Instagram, Facebook and the site's icon, read by plain code.
// 3. **ai**: gyms that still miss something get their page read by Claude (gymAutoFill.ts), checked, and written into
//    empty fields. It stops for the day at the AI cap or when AI is switched off, and the next daily job carries on.
// 4. **tidy** (worldwide job only): city names that are postcodes or house numbers and untidy addresses are fixed
//    (gymRepair.ts), so pages land under real cities.
// 5. **chains**: each chain's branches are counted and its logo and website picked (gymChains.ts refreshChains); the
//    worldwide job first gives gyms whose names repeat across cities their chain (chainStep).
//
// A worker holds the job's lease (`lease_until`), works for up to its own time, writes everything as it goes, and when
// its time runs out hands over to a fresh invocation of /api/cron/gym-imports/ (`kickWorker`). That cron route also
// runs every five minutes (vercel.json), so a hand-over that never arrived, a crashed worker or an item waiting to retry
// is picked up within minutes. An item the map servers were too busy for goes back in line after 3 and then 10
// minutes. The admin page only reads the job (`jobStatus`), so closing it changes nothing. When a job started by an
// admin finishes, they get an email (if they left "Email me when it's done" on).
import { randomBytes } from "node:crypto";

import { FLAGS } from "@/lib/flags";

import { resendMailer, siteOrigin, type Mailer } from "./alerts";
import { COUNTRIES } from "./countries";
import { batch, query, run } from "./db";
import { autoFillBatch } from "./gymAutoFill";
import { chainStep, refreshChainsQuietly } from "./gymChains";
import { enrichBatch } from "./gymEnrich";
import { describeItem, importItem, SINCE_KEY, type ImportResult } from "./gymImport";
import { repairStep } from "./gymRepair";

/**
 * Three items at a time. Most are answered by QLever in seconds (gymQlever.ts); an item that falls back to Overpass
 * starts on its own map server, one per lane, which stays within each server's per-client slots.
 */
export const IMPORT_WORKERS = 3;
/** An item whose map servers were all busy goes back in line this many times, after these pauses. */
export const RETRY_AFTER_MS = [3 * 60_000, 10 * 60_000];
export const JOB_LIMITS = {
  /** A worker's own time: the cron route's 800 seconds, less room to hand over. */
  runMs: 760_000,
  /**
   * An item isn't started with less time than this left. Items are told when the worker's time ends (`until`) and
   * stop asking the map by then, so a worker no longer idles its last five minutes waiting for a whole Overpass budget
   * (2026-11-18); one that runs out goes back in line like a busy one.
   */
  cityMs: 90_000,
  /** Room an item leaves after its own end for saving and handing over. */
  saveMs: 25_000,
  /** The website, AI and tidy steps start no new batch with less time than this left. */
  stepMs: 75_000,
  /** The lease outlives the worker's time a little, so a crashed worker's job is picked up a minute later. */
  leaseSlackMs: 60_000,
  /** Jobs and their items are kept this long. */
  keepMs: 90 * 86_400_000,
  /** The daily job's first look back, when no earlier one says where it got to. */
  firstLookMs: 2 * 86_400_000,
  /** A daily job isn't started again within this long of the last one (Vercel may call a schedule twice). */
  dailyGapMs: 20 * 3_600_000,
};

export type JobState = "running" | "stopped" | "done";
export type JobKind = "world" | "daily";
export type JobPhase = "map" | "web" | "ai" | "tidy" | "chains" | "done";
type ItemState = "pending" | "running" | "waiting" | "ok" | "failed";
type Ok = Extract<ImportResult, { ok: true }>;

/** One item's outcome, without the step-by-step log (that stays on its gym_imports row). */
export type CityResult = Omit<Ok, "log" | "split"> | { ok: false; id?: string; error: string; detail?: string; ms?: number };

export interface CityLine {
  where: string;
  at: number;
  r: CityResult;
}

export interface JobStatus {
  id: string;
  label: string;
  kind: JobKind;
  state: JobState;
  phase: JobPhase;
  total: number;
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
  /** The latest finished items, newest first (at most 300). */
  recent: CityLine[];
  sums: { found: number; added: number; updated: number; unchanged: number; kept: number };
  web: { read: number; filled: number };
  ai: { read: number; filled: number };
  tidy: { fixed: number };
  /** Gyms the chains step put in a chain by their name (worldwide job). */
  chains: { chained: number };
  /** Why a step stopped short (AI off or over its cap), shown on the page. */
  note: string;
}

const strip = (r: ImportResult): CityResult => {
  if (r.ok) {
    const { log, split, ...rest } = r;
    void log;
    void split;
    return rest;
  }
  return {
    ok: false,
    id: r.id,
    error: r.error === "where" ? "That place wasn't found on the map." : "No map server answered in time.",
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

/** The job still running, if any (one at a time, so two runs never fight over the map servers). */
export async function runningJob(): Promise<string | null> {
  const [row] = await query<{ id: string }>("SELECT id FROM gym_import_jobs WHERE state = 'running' ORDER BY started_at LIMIT 1");
  return row ? String(row.id) : null;
}

/** Makes a job of these items. Refuses while another job is running. */
export async function createJob(
  j: { label: string; places: readonly string[]; kind?: JobKind; startedBy: string; notify: boolean },
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
    `INSERT INTO gym_import_jobs (id, label, kind, phase, state, total, skipped, started_by, notify, started_at, active_at)
     VALUES (?, ?, ?, 'map', 'running', ?, 0, ?, ?, ?, ?)`,
    [id, j.label.slice(0, 120), j.kind ?? "world", places.length, j.startedBy, j.notify ? 1 : 0, now, now],
  );
  await addItems(id, places, 0);
  return { id };
}

async function addItems(job: string, places: readonly string[], from: number) {
  for (let i = 0; i < places.length; i += 200)
    await batch(
      places.slice(i, i + 200).map((place, k) => ({
        sql: "INSERT OR IGNORE INTO gym_import_items (job, idx, place, state) VALUES (?, ?, ?, 'pending')",
        args: [job, from + i + k, place.slice(0, 200)],
      })),
    );
}

/** Whether the import's AI step is on: the gymImportAi flag (Admin › Gyms › Import), one row read by its key. */
export async function importAiOn(): Promise<boolean> {
  const [row] = await query<{ value: string }>("SELECT value FROM feature_flags WHERE name = 'gymImportAi'");
  try {
    return row ? JSON.parse(String(row.value)) !== false : FLAGS.gymImportAi.default;
  } catch {
    return FLAGS.gymImportAi.default;
  }
}

/** The one button: every gym in the world, then their websites, then AI for what's still missing, then tidy-up. */
export const startWorld = (startedBy: string, notify: boolean, now = Date.now()) =>
  createJob({ label: "every gym in the world", kind: "world", places: COUNTRIES.map((c) => `country:${c}`), startedBy, notify }, now);

/**
 * The daily refresh (Vercel Schedules, /api/cron/gym-refresh/): gyms new or changed on the map since the last one, then
 * the website and AI steps carry on with whatever is due. Nothing when a job is running (the worldwide job covers it)
 * or a daily job started in the last 20 hours (a schedule can arrive twice).
 */
export async function startDaily(now = Date.now()): Promise<{ id: string } | { skipped: string }> {
  if (await runningJob()) return { skipped: "another import is running" };
  const [last] = await query<{ at: number | null }>(
    "SELECT MAX(started_at) AS at FROM gym_import_jobs WHERE state IN ('running', 'stopped', 'done') AND started_at > ? AND kind = 'daily'",
    [now - JOB_LIMITS.dailyGapMs],
  );
  if (last?.at) return { skipped: "already ran today" };
  const [row] = await query<{ value: string }>("SELECT value FROM admin_settings WHERE key = ?", [SINCE_KEY]);
  const since = Number(row?.value) || now - JOB_LIMITS.firstLookMs;
  const made = await createJob({ label: "daily refresh", kind: "daily", places: [`new:${since}`], startedBy: "", notify: false }, now);
  return "id" in made ? made : { skipped: "another import is running" };
}

/** Stops a running job: the items being imported finish, nothing new starts. */
export async function stopJob(id: string, now = Date.now()): Promise<boolean> {
  return (await run("UPDATE gym_import_jobs SET state = 'stopped', ended_at = ? WHERE id = ? AND state = 'running'", [now, id])) > 0;
}

/** Hides a finished job from the page (Close). */
export async function dismissJob(id: string): Promise<boolean> {
  return (await run("UPDATE gym_import_jobs SET dismissed = 1 WHERE id = ? AND state <> 'running'", [id])) > 0;
}

/** The items of a job that didn't import (failed, or never reached because it was stopped), for Retry failed. */
export async function unfinishedPlaces(id: string): Promise<string[]> {
  const rows = await query<{ place: string }>("SELECT place FROM gym_import_items WHERE job = ? AND state <> 'ok' ORDER BY idx", [id]);
  return rows.map((r) => String(r.place));
}

const line = (r: Record<string, unknown>): CityLine => ({
  where: describeItem(String(r.place)),
  at: Number(r.at),
  r: parse<CityResult>(r.result, { ok: false, error: "No result." }),
});

const PHASES: readonly JobPhase[] = ["map", "web", "ai", "tidy", "chains", "done"];

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
  const phase = String(job.phase ?? "map") as JobPhase;
  return {
    id: jid,
    label: String(job.label),
    kind: String(job.kind) === "daily" ? "daily" : "world",
    state: String(job.state) as JobState,
    phase: PHASES.includes(phase) ? phase : "map",
    total: Number(job.total),
    startedBy: String(job.started_by),
    notify: Number(job.notify) === 1,
    startedAt: Number(job.started_at),
    endedAt: Number(job.ended_at),
    activeAt: Number(job.active_at),
    done: n("ok") + n("failed"),
    active: active.map((r) => describeItem(String(r.place))),
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
    web: { read: Number(job.web_read ?? 0), filled: Number(job.web_filled ?? 0) },
    ai: { read: Number(job.ai_read ?? 0), filled: Number(job.ai_filled ?? 0) },
    tidy: { fixed: Number(job.tidy_fixed ?? 0) },
    chains: { chained: Number(job.chain_fixed ?? 0) },
    note: String(job.note ?? ""),
  };
}

/** The latest daily refresh, for the line under the button. */
export async function lastDaily(): Promise<{ at: number; state: string; added: number } | null> {
  const [job] = await query(
    "SELECT id, started_at, state FROM gym_import_jobs WHERE state IN ('running', 'stopped', 'done') AND started_at > 0 AND kind = 'daily' ORDER BY started_at DESC LIMIT 1",
  );
  if (!job) return null;
  const [sum] = await query("SELECT COALESCE(SUM(added), 0) AS added FROM gym_import_items WHERE job = ? AND state = 'ok'", [
    String(job.id),
  ]);
  return { at: Number(job.started_at), state: String(job.state), added: Number(sum?.added ?? 0) };
}

/** Everything about a job for its debug log: every item with its result, earlier busy tries and step-by-step log. */
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
    step: status.phase,
    startedBy: status.startedBy,
    startedAt: new Date(status.startedAt).toISOString(),
    endedAt: status.endedAt ? new Date(status.endedAt).toISOString() : null,
    total: status.total,
    websites: status.web,
    ai: status.ai,
    tidied: status.tidy.fixed,
    note: status.note,
    items: items.map((r) => {
      const res = parse<CityResult>(r.result, { ok: false, error: "Not imported yet." });
      return {
        item: String(r.place),
        where: describeItem(String(r.place)),
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
  /** When this worker must have stopped starting work. */
  deadline?: number;
  importer?: typeof importItem;
  enrich?: () => ReturnType<typeof enrichBatch>;
  autoFill?: () => ReturnType<typeof autoFillBatch>;
  /** Whether the AI step is switched on (tests). */
  aiOn?: () => Promise<boolean>;
  tidy?: (after: string) => ReturnType<typeof repairStep>;
  chains?: (after: string) => ReturnType<typeof chainStep>;
  refreshChains?: () => Promise<unknown>;
  sleep?: (ms: number) => Promise<void>;
  mail?: Mailer | null;
  /** The pause before the second lane starts, so two lanes don't hit the map servers at the same moment. */
  staggerMs?: number;
}

export interface WorkerResult {
  job: string | null;
  imported: number;
  /** Whether work is ready to start now (hand over to a fresh worker), as opposed to only waiting to retry. */
  more: boolean;
  finished: boolean;
}

/**
 * Takes the running job's lease if nobody holds it and works through its steps until they're done or this worker's
 * time is up. Safe to call any number of times at once: only one worker holds a job.
 */
export async function runWorker(opts: WorkerOptions = {}): Promise<WorkerResult> {
  const started = Date.now();
  const deadline = opts.deadline ?? started + JOB_LIMITS.runMs;
  const importer = opts.importer ?? importItem;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((ok) => setTimeout(ok, ms)));
  const lease = () => deadline + JOB_LIMITS.leaseSlackMs;
  const [job] = await query<{ id: string; kind: string; phase: string }>(
    `UPDATE gym_import_jobs SET lease_until = ?
     WHERE id = (SELECT id FROM gym_import_jobs WHERE state = 'running' ORDER BY started_at LIMIT 1) AND lease_until < ?
     RETURNING id, kind, phase`,
    [lease(), Date.now()],
  );
  if (!job) return { job: null, imported: 0, more: false, finished: false };
  const id = String(job.id);
  const kind: JobKind = String(job.kind) === "daily" ? "daily" : "world";
  let phase = (PHASES.includes(String(job.phase) as JobPhase) ? String(job.phase) : "map") as JobPhase;
  // Items a worker that died was in the middle of go back in line (an import is safe to run again).
  await run("UPDATE gym_import_items SET state = 'pending', tries = MAX(tries - 1, 0) WHERE job = ? AND state = 'running'", [id]);
  let imported = 0;
  const stillRunning = async () => (await query("SELECT 1 FROM gym_import_jobs WHERE id = ? AND state = 'running'", [id])).length > 0;
  const touch = () => run("UPDATE gym_import_jobs SET active_at = ?, lease_until = ? WHERE id = ?", [Date.now(), lease(), id]);
  const timeFor = (ms: number) => deadline - Date.now() >= ms;

  const take = async (): Promise<{ idx: number; place: string; tries: number } | null> => {
    for (;;) {
      if (!timeFor(JOB_LIMITS.cityMs) || !(await stillRunning())) return null;
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
      // Nothing ready: wait here for an item that's pausing if it comes due in this worker's time, else leave it to
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
      const r = await importer(item.place, fetch, Date.now(), { server: w, until: deadline - JOB_LIMITS.saveMs }).catch(
        (e: unknown): ImportResult => ({
          ok: false,
          id: "",
          error: "map",
          detail: String(e instanceof Error ? e.message : e),
          ms: 0,
          log: [],
        }),
      );
      imported++;
      const now = Date.now();
      const res = strip(r);
      const again = RETRY_AFTER_MS[item.tries - 1];
      if (r.ok && r.split?.length) {
        // A country with regions: its regions join the job, after everything already in line.
        const [last] = await query<{ idx: number }>("SELECT MAX(idx) AS idx FROM gym_import_items WHERE job = ?", [id]);
        await addItems(id, r.split, Number(last?.idx ?? 0) + 1);
        await run("UPDATE gym_import_jobs SET total = total + ? WHERE id = ?", [r.split.length, id]);
      }
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
      await touch();
    }
  };

  const setPhase = async (next: JobPhase, note?: string) => {
    phase = next;
    await run(`UPDATE gym_import_jobs SET phase = ?${note !== undefined ? ", note = ?" : ""} WHERE id = ? AND state = 'running'`, [
      next,
      ...(note !== undefined ? [note] : []),
      id,
    ]);
  };

  try {
    if (phase === "map") {
      await Promise.all(Array.from({ length: IMPORT_WORKERS }, (_, w) => lane(w)));
      // Items still in line or pausing: the map step isn't over.
      const [left] = await query<{ n: number }>(
        "SELECT COUNT(*) AS n FROM gym_import_items WHERE job = ? AND state IN ('pending', 'waiting', 'running')",
        [id],
      );
      if (!Number(left?.n ?? 0) && (await stillRunning())) await setPhase("web");
    }
    // The website step: plain code reads each gym's site and fills what's empty.
    while (phase === "web" && timeFor(JOB_LIMITS.stepMs) && (await stillRunning())) {
      const b = await (opts.enrich ?? (() => enrichBatch()))();
      const filled = b.done.filter((d) => d.filled.length).length;
      await run("UPDATE gym_import_jobs SET web_read = web_read + ?, web_filled = web_filled + ? WHERE id = ?", [
        b.done.length + b.complete,
        filled,
        id,
      ]);
      await touch();
      if (!b.more) await setPhase("ai");
    }
    // The AI step: what the site's code didn't give, Claude reads from the page; it stops at the day's cap. Switched off
    // in Admin › Gyms (the gymImportAi flag), the job goes straight on.
    if (phase === "ai" && !(await (opts.aiOn ?? importAiOn)()))
      await setPhase(kind === "world" ? "tidy" : "chains", "AI step skipped: it's switched off in Admin › Gyms › Import.");
    while (phase === "ai" && timeFor(JOB_LIMITS.stepMs) && (await stillRunning())) {
      const b = await (opts.autoFill ?? (() => autoFillBatch()))();
      await run("UPDATE gym_import_jobs SET ai_read = ai_read + ?, ai_filled = ai_filled + ? WHERE id = ?", [
        b.done.length,
        b.done.filter((d) => d.filled.length).length,
        id,
      ]);
      await touch();
      const next = kind === "world" ? "tidy" : "chains";
      if (b.stopped) await setPhase(next, `AI stopped: ${b.stopped} The next daily run carries on.`);
      else if (!b.more) await setPhase(next);
    }
    // Tidy city names and addresses, a thousand gyms a step (worldwide job only).
    while (phase === "tidy" && timeFor(JOB_LIMITS.stepMs) && (await stillRunning())) {
      const [row] = await query<{ tidy_after: string }>("SELECT tidy_after FROM gym_import_jobs WHERE id = ?", [id]);
      const step = await (opts.tidy ?? ((after: string) => repairStep(after)))(String(row?.tidy_after ?? ""));
      await run("UPDATE gym_import_jobs SET tidy_after = ?, tidy_fixed = tidy_fixed + ? WHERE id = ?", [
        step.next,
        step.cities + step.addresses,
        id,
      ]);
      await touch();
      if (!step.next) await setPhase("chains");
    }
    // Gym chains: the worldwide job first matches every gym's name to the chains (gymChains.ts chainStep, a page of
    // gyms a step); both jobs then count each chain's branches and pick its logo.
    while (phase === "chains" && timeFor(JOB_LIMITS.stepMs) && (await stillRunning())) {
      let next = "";
      if (kind === "world") {
        const [row] = await query<{ chain_after: string }>("SELECT chain_after FROM gym_import_jobs WHERE id = ?", [id]);
        const step = await (opts.chains ?? ((a: string) => chainStep(a)))(String(row?.chain_after ?? ""));
        next = step.next;
        await run("UPDATE gym_import_jobs SET chain_after = ?, chain_fixed = chain_fixed + ? WHERE id = ?", [step.next, step.chained, id]);
      }
      if (!next) {
        await (opts.refreshChains ?? refreshChainsQuietly)();
        await setPhase("done");
      }
      await touch();
    }
  } finally {
    // Items this worker started and didn't finish (it can't happen short of a crash) go back in line.
    await run("UPDATE gym_import_items SET state = 'pending' WHERE job = ? AND state = 'running'", [id]).catch(() => 0);
  }
  let finished = false;
  if (phase === "done")
    finished =
      (await run("UPDATE gym_import_jobs SET state = 'done', ended_at = ? WHERE id = ? AND state = 'running'", [Date.now(), id])) > 0;
  // Let the next worker in at once.
  await run("UPDATE gym_import_jobs SET lease_until = 0 WHERE id = ?", [id]);
  if (finished) await emailDone(id, opts.mail === undefined ? resendMailer() : opts.mail).catch(() => false);
  const running = !finished && (await stillRunning());
  let more = false;
  if (running) {
    if (phase !== "map") more = true;
    else {
      const [ready] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM gym_import_items WHERE job = ? AND state = 'pending'", [id]);
      more = Number(ready?.n ?? 0) > 0;
    }
  }
  return { job: id, imported, more, finished };
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
    `The gym import of ${s.label} is done in ${mins(s.endedAt - s.startedAt)}: ${s.done - failed.length} of ${s.total} areas imported.`,
    `Gyms: ${s.sums.found} found, ${s.sums.added} new, ${s.sums.updated} changed${s.sums.kept ? `, ${s.sums.kept} claimed or added by lifters left alone` : ""}.`,
    `Websites: ${s.web.read} read, ${s.web.filled} gyms got details. AI: ${s.ai.read} read, ${s.ai.filled} gyms got details.${s.tidy.fixed ? ` ${s.tidy.fixed} city names or addresses tidied.` : ""}${s.chains.chained ? ` ${s.chains.chained} gyms put in their chain by name.` : ""}`,
    ...(s.note ? [s.note] : []),
    ...(failed.length
      ? [
          "",
          `${failed.length} ${failed.length === 1 ? "area" : "areas"} failed (Retry failed on Admin › Gyms runs them again):`,
          ...failed.slice(0, 25).map((f) => `- ${f.where}: ${f.r.ok ? "" : `${f.r.error}${f.r.detail ? ` (${f.r.detail})` : ""}`}`),
          ...(failed.length > 25 ? [`…and ${failed.length - 25} more.`] : []),
        ]
      : []),
    "",
    `Open Admin › Gyms: ${siteOrigin()}/admin/?tab=Gyms`,
  ];
  const ok = await mail(
    s.startedBy,
    `Gym import done: ${s.label}, ${s.sums.added} new gyms${failed.length ? `, ${failed.length} areas failed` : ""}`,
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
