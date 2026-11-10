// When scheduled jobs ran and how they went, for the admin System page (as in Gradelings' src/server/monitor.ts).
// Recording never breaks the job it describes: a failure here is only logged.
import { query, run } from "./db";

const DAY = 86_400_000;
const KEEP = 60 * DAY;

/** Runs a scheduled job and records its start, end and outcome. The job's own response or error is passed on. */
export async function trackJob(job: string, fn: () => Promise<Response>, now: () => number = Date.now): Promise<Response> {
  const started = now();
  let id: number | null = null;
  try {
    await run("DELETE FROM job_runs WHERE started_at < ?", [started - KEEP]);
    const rows = await query<{ id: number }>("INSERT INTO job_runs (job, started_at) VALUES (?, ?) RETURNING id", [job, started]);
    id = rows[0] ? Number(rows[0].id) : null;
  } catch (e) {
    console.error("[monitor] could not record job start", (e as Error).message);
  }
  const finish = async (ok: boolean, detail: string) => {
    if (id === null) return;
    await run("UPDATE job_runs SET finished_at = ?, ok = ?, detail = ? WHERE id = ?", [now(), ok ? 1 : 0, detail.slice(0, 1000), id]).catch(
      (e: Error) => console.error("[monitor] could not record job end", e.message),
    );
  };
  try {
    const res = await fn();
    await finish(
      res.ok,
      await res
        .clone()
        .text()
        .catch(() => ""),
    );
    return res;
  } catch (e) {
    await finish(false, (e as Error).message);
    throw e;
  }
}

export interface JobRun {
  job: string;
  startedAt: number;
  finishedAt: number | null;
  ok: boolean | null;
  detail: string | null;
}

export async function recentJobRuns(job: string, limit = 10): Promise<JobRun[]> {
  const rows = await query<Record<string, unknown>>(
    "SELECT job, started_at, finished_at, ok, detail FROM job_runs WHERE job = ? ORDER BY started_at DESC LIMIT ?",
    [job, limit],
  );
  return rows.map((r) => ({
    job: String(r.job),
    startedAt: Number(r.started_at),
    finishedAt: r.finished_at == null ? null : Number(r.finished_at),
    ok: r.ok == null ? null : Number(r.ok) === 1,
    detail: r.detail == null ? null : String(r.detail),
  }));
}
