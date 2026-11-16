"use client";

// Admin › Gyms › Import: one button (Melvin, 2026-11-16: "this should really just be one button that we press, rather
// than on multiple screens that is it today"; docs/decisions/gyms.md "One button: every gym in the world"). It starts
// the worldwide job on the server (src/server/gymImportJobs.ts): every country's gyms from OpenStreetMap, region by
// region, then each gym's own website read by plain code, then Claude for what's still missing, then city names and
// addresses tidied. The page only shows the job, read every few seconds while it runs, so it can be closed. A daily
// refresh (Vercel Schedules) adds gyms new on the map and carries on the website and AI steps; the line under the
// button says when it last ran.
import { useCallback, useEffect, useRef, useState } from "react";

import { isVisible, onVisibility } from "@/lib/visibility";
import type { CityLine, JobPhase, JobStatus } from "@/server/gymImportJobs";

import { Card } from "./charts";
import { HowItWorks } from "./HowItWorks";

interface Daily {
  at: number;
  state: string;
  added: number;
}

/** How often the page reads a running job. */
export const POLL_MS = 4_000;
/** A running job with no news for this long is waiting for the server's next worker (every five minutes). */
const QUIET_MS = 6 * 60_000;
const mins = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};

/** Time left: what the finished areas took on average, spread over the areas still to go (already in parallel). */
export function eta(startedAt: number, done: number, total: number, now: number): number | null {
  if (done <= 0 || done >= total) return null;
  return ((now - startedAt) / done) * (total - done);
}

/**
 * A failed import in a few words, instead of every map server's error on one line: "Not on the map", "Map servers
 * busy" (every server busy or hung) or "Map error". The full text is in the debug log.
 */
export function shortError(error: string): string {
  if (/^where\b|wasn't found/i.test(error)) return "Not on the map";
  const detail = error.replace(/^map:\s*/, "");
  const parts = detail
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length && parts.every((p) => /busy|no answer|fetch failed|timed out|too many requests|HTTP 5\d\d/i.test(p)))
    return "Map servers busy";
  return "Map error";
}

function download(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const line = (d: CityLine) =>
  d.r.ok
    ? `${d.where}: ${d.r.found} found, ${d.r.added} new, ${d.r.updated} changed${d.r.kept ? `, ${d.r.kept} left alone` : ""} (${mins(d.r.ms)}, ${d.r.server})`
    : `${d.where}: ${shortError(`${d.r.error} ${d.r.detail ?? ""}`)}${d.r.detail ? ` (${d.r.detail})` : ""}`;

/** POSTs a job action and returns its answer (or an error line). */
async function postJob(body: Record<string, unknown>): Promise<{ job?: JobStatus | null; error?: string }> {
  const r = await fetch("/api/admin/gym-places/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!r) return { error: "The admin server didn't answer." };
  const j = (await r.json().catch(() => null)) as { job?: JobStatus | null; error?: string } | null;
  if (!j) return { error: `The admin server answered ${r.status}.` };
  return r.ok ? j : { ...j, error: j.error ?? `HTTP ${r.status}` };
}

export function GymImport({ admin, changed }: { admin: boolean; changed: () => void }) {
  const [notify, setNotify] = useState(true);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [daily, setDaily] = useState<Daily | null>(null);
  const [problem, setProblem] = useState("");
  const [starting, setStarting] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const seen = useRef("");
  const running = job?.state === "running";

  const show = useCallback(
    (j: JobStatus | null) => {
      setJob(j);
      // New areas done or a new step: the gym list has news.
      const mark = j ? `${j.done}/${j.phase}/${j.web.filled}/${j.ai.filled}` : "";
      if (seen.current && mark !== seen.current) changed();
      seen.current = mark;
    },
    [changed],
  );

  // The job on the server: read when the page opens, then every few seconds while it runs.
  const read = useCallback(
    () =>
      fetch("/api/admin/gym-places/?job=1")
        .then(async (r) => (r.ok ? ((await r.json()) as { job: JobStatus | null; daily?: Daily | null }) : null))
        .then((j) => {
          if (!j) return;
          show(j.job);
          setDaily(j.daily ?? null);
        })
        .catch(() => undefined),
    [show],
  );
  useEffect(() => {
    void read();
  }, [read]);
  useEffect(() => {
    if (!running) return;
    // Not while the tab is hidden (each read counts the job's items, and Turso bills every row read); it reads again
    // when the tab comes back.
    const t = setInterval(() => isVisible() && void read(), POLL_MS);
    const c = setInterval(() => setNow(Date.now()), 1000);
    const off = onVisibility((v) => v && void read());
    return () => {
      clearInterval(t);
      clearInterval(c);
      off();
    };
  }, [running, read]);

  const act = async (body: Record<string, unknown>) => {
    setProblem("");
    const r = await postJob(body);
    if (r.error) setProblem(r.error);
    if (r.job !== undefined) show(r.job);
    else if (r.error) await read();
  };

  return (
    <Card title="Gyms from OpenStreetMap">
      <HowItWorks>
        <p>
          One button imports every gym in the world. It runs on the server, so you can close this page. Each country is split into its
          regions (provinces, states) and every fitness centre, and every rec or community centre with a gym, comes in from OpenStreetMap
          with everything the map has: address, postcode, phone, email, website, hours, Instagram, Facebook and wheelchair access. A gym
          without a city on the map gets the nearest city, town or village.
        </p>
        <p>
          Nothing is listed twice: gyms are matched by their map id, and a new map gym next to a claimed gym or one a lifter added with a
          similar name is that gym. A claimed gym is never changed; its owner&apos;s details win.
        </p>
        <p>
          Then each gym&apos;s own website is read by plain code (structured data, phone and email links, address lines, social pages and
          the site&apos;s icon), filling only empty fields. Whatever is still missing, Claude reads from the same page; every answer is
          checked (a street that looks like a street, a postcode that fits the country, hours in the map&apos;s format, an email on the
          gym&apos;s own domain) and written only into empty fields. AI stops at the day&apos;s cap (Flags › AI daily cap) or when it&apos;s
          switched off, and carries on the next day. Last, city names that are postcodes and untidy addresses are fixed, and moved pages
          redirect.
        </p>
        <p>
          Every day at 10:00 UTC the daily refresh adds gyms that are new or changed on the map anywhere, and carries on the website and AI
          steps.
        </p>
      </HowItWorks>
      {admin && !running && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <button
            type="button"
            disabled={starting}
            onClick={() => {
              setStarting(true);
              void act({ action: "importWorld", notify }).finally(() => setStarting(false));
            }}
            className="press btn-primary rounded-lg px-4 py-2 font-semibold"
          >
            {starting ? "Starting…" : "Import every gym in the world"}
          </button>
          <label className="flex items-center gap-2 text-muted">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            Email me when it&apos;s done
          </label>
        </div>
      )}
      <p className="mt-2 text-xs text-faint">
        {daily
          ? `Daily refresh: last ran ${new Date(daily.at).toLocaleString()}${daily.state === "running" ? " (running now)" : `, ${daily.added} new ${daily.added === 1 ? "gym" : "gyms"}`}.`
          : "Daily refresh: runs every day at 10:00 UTC, once the first import is done."}
      </p>
      {problem && (
        <p className="mt-2 text-sm text-bad" role="alert">
          {problem}
        </p>
      )}
      {job && <JobCard job={job} now={now} admin={admin} act={act} />}
      <p className="mt-2 text-xs text-faint">Gym data © OpenStreetMap contributors, under the Open Database Licence.</p>
    </Card>
  );
}

const STEPS: { phase: JobPhase; label: string }[] = [
  { phase: "map", label: "Gyms from the map" },
  { phase: "web", label: "Gym websites" },
  { phase: "ai", label: "AI for what's missing" },
  { phase: "tidy", label: "City names and addresses" },
];
const ORDER: JobPhase[] = ["map", "web", "ai", "tidy", "done"];

/** Where each step is: done, running now or still to come. */
export function stepState(job: Pick<JobStatus, "phase" | "state">, step: JobPhase): "done" | "now" | "next" {
  const at = ORDER.indexOf(job.phase);
  const i = ORDER.indexOf(step);
  if (i < at) return "done";
  if (i === at) return job.state === "running" ? "now" : "next";
  return "next";
}

function JobCard({
  job,
  now,
  admin,
  act,
}: {
  job: JobStatus;
  now: number;
  admin: boolean;
  act: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [stopping, setStopping] = useState(false);
  const running = job.state === "running";
  const failed = job.failed;
  const mapping = running && job.phase === "map";
  const left = mapping ? eta(job.startedAt, job.done, job.total, now) : null;
  const quiet = running && !job.active.length && now - job.activeAt > QUIET_MS;
  const title = running
    ? `Importing ${job.label}`
    : `${job.state === "stopped" ? "Stopped" : "Done"}: ${job.label} in ${mins((job.endedAt || now) - job.startedAt)}`;
  const saveLog = async () => {
    const r = await fetch(`/api/admin/gym-places/?job=${encodeURIComponent(job.id)}&log=1`).catch(() => null);
    const data: unknown = r?.ok ? await r.json().catch(() => null) : null;
    if (data) download(`gym-import-${new Date(job.startedAt).toISOString().slice(0, 19).replace(/:/g, "")}.json`, data);
  };
  // Failed areas, plus any a stopped run never reached.
  const notDone = job.total - (job.done - failed.length);
  const steps = STEPS.filter((s) => s.phase !== "tidy" || job.kind === "world");
  const detail: Record<JobPhase, string> = {
    map: `${job.done} of ${job.total} areas · ${job.sums.found} gyms found, ${job.sums.added} new, ${job.sums.updated} changed${job.sums.kept ? `, ${job.sums.kept} claimed or added by lifters left alone` : ""}`,
    web: `${job.web.read} read, ${job.web.filled} gyms got details`,
    ai: `${job.ai.read} read, ${job.ai.filled} gyms got details`,
    tidy: `${job.tidy.fixed} city names or addresses fixed`,
    done: "",
  };
  return (
    <div className="mt-3 grid gap-2 rounded-lg border border-line p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex-1 font-semibold" role="status">
          {title}
        </p>
        {admin &&
          (running ? (
            <button
              type="button"
              disabled={stopping}
              onClick={() => {
                setStopping(true);
                void act({ action: "importStop", job: job.id }).finally(() => setStopping(false));
              }}
              className="press rounded-lg border border-line px-3 py-1.5 text-muted"
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void act({ action: "importClose", job: job.id })}
              className="press rounded-lg border border-line px-3 py-1.5 text-muted"
            >
              Close
            </button>
          ))}
      </div>
      <p className="text-xs text-faint">
        Started by {job.startedBy || "the daily refresh"} {new Date(job.startedAt).toLocaleString()}
        {running ? `. Runs on the server, so this page can be closed${job.notify ? "; an email goes out when it's done" : ""}.` : "."}
      </p>
      <ol className="grid gap-1.5">
        {steps.map((s, i) => {
          const st = stepState(job, s.phase);
          return (
            <li key={s.phase} className="flex flex-wrap items-baseline gap-x-2">
              <span
                aria-hidden
                className={`inline-block h-2 w-2 shrink-0 rounded-full ${st === "done" ? "bg-good" : st === "now" ? "bg-accent" : "bg-line"}`}
              />
              <span className={st === "next" ? "text-faint" : "font-semibold"}>
                {i + 1}. {s.label}
                <span className="sr-only">: {st === "done" ? "done" : st === "now" ? "running now" : "to come"}</span>
              </span>
              {st !== "next" && <span className="text-muted">{detail[s.phase]}</span>}
            </li>
          );
        })}
      </ol>
      {mapping && (
        <>
          <div
            className="h-2 overflow-hidden rounded-full bg-raised"
            role="progressbar"
            aria-label="Areas imported"
            aria-valuemin={0}
            aria-valuemax={job.total}
            aria-valuenow={job.done}
          >
            <div className="h-full bg-accent" style={{ width: `${job.total ? (job.done / job.total) * 100 : 100}%` }} />
          </div>
          <p className="text-muted">
            {job.active.length
              ? `Now: ${job.active.join(", ")}`
              : stopping
                ? "Stopping…"
                : quiet
                  ? "Waiting for the server to pick it up (within five minutes)"
                  : job.waiting && !job.pending
                    ? "Waiting to try busy areas again"
                    : "Starting…"}
            {left !== null ? `. About ${mins(left)} left of the map step (countries split into regions as they go).` : ""}
          </p>
        </>
      )}
      {running && !mapping && quiet && <p className="text-muted">Waiting for the server to pick it up (within five minutes).</p>}
      {job.note && <p className="text-muted">{job.note}</p>}
      {(failed.length > 0 || job.waiting > 0) && (
        <p className={failed.length ? "text-bad" : "text-muted"}>
          {failed.length} {failed.length === 1 ? "area" : "areas"} failed{job.waiting ? `, ${job.waiting} busy, trying again soon` : ""}
        </p>
      )}
      {failed.length > 0 && (
        <ul className="grid max-h-40 gap-1 overflow-y-auto text-xs text-bad">
          {failed.map((d) => (
            <li key={`${d.where}-${d.at}`}>{line(d)}</li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        {admin && !running && notDone > 0 && (
          <button
            type="button"
            onClick={() => void act({ action: "importRetry", job: job.id })}
            className="press btn-primary rounded-lg px-3 py-1.5 font-semibold"
          >
            {failed.length === notDone ? `Retry ${notDone} failed` : `Retry ${notDone} not imported`}
          </button>
        )}
        {job.done > 0 && (
          <button type="button" onClick={() => void saveLog()} className="press rounded-lg border border-line px-3 py-1.5">
            Download debug log
          </button>
        )}
      </div>
      {job.recent.length > 0 && (
        <details>
          <summary className="cursor-pointer text-xs text-faint">Latest areas</summary>
          <ul className="mt-1 max-h-48 overflow-y-auto text-xs text-faint">
            {job.recent.map((d) => (
              <li key={`${d.where}-${d.at}`} className={d.r.ok ? "" : "text-bad"}>
                {line(d)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
