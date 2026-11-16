"use client";

// Admin › Gyms: importing gyms from OpenStreetMap (src/server/gymImport.ts, docs/decisions/gyms.md "Importing gyms").
// One city by name, right here; a country's major cities (or every country's) as a job on the server
// (src/server/gymImportJobs.ts), so this page can be closed while it runs. The page only shows the job: the cities
// being imported, done of total, time left, errors, Stop, Retry failed and the debug log, read every few seconds. Recent
// imports lists the last hundred city imports with each one's step-by-step log.
import { useCallback, useEffect, useRef, useState } from "react";

import { isVisible, onVisibility } from "@/lib/visibility";
import type { ImportResult, ImportRow } from "@/server/gymImport";
import type { CityLine, JobStatus } from "@/server/gymImportJobs";

import { Card } from "./charts";
import { HowItWorks } from "./HowItWorks";

type Answer = Extract<ImportResult, { ok: true }> | { ok?: false; error: string; detail?: string; log?: string[] };

interface Done {
  where: string;
  at: number;
  r: Answer;
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

/** Time left: what the finished cities took on average, spread over the cities still to go (already in parallel). */
export function eta(startedAt: number, done: number, total: number, now: number): number | null {
  if (done <= 0 || done >= total) return null;
  return ((now - startedAt) / done) * (total - done);
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

const line = (d: Done | CityLine) =>
  d.r.ok
    ? `${d.r.area}: ${d.r.found} found, ${d.r.added} new, ${d.r.updated} changed, ${d.r.unchanged} unchanged${d.r.kept ? `, ${d.r.kept} claimed left alone` : ""} (${mins(d.r.ms)}, ${d.r.server})`
    : `${d.where}: ${d.r.error}${d.r.detail ? ` (${d.r.detail})` : ""}`;

async function postImport(where: string): Promise<Answer> {
  const r = await fetch("/api/admin/gym-places/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "import", where, server: 0 }),
  }).catch(() => null);
  if (!r) return { error: "The admin server didn't answer (network or time limit)." };
  const j = (await r.json().catch(() => null)) as (Partial<ImportResult> & { error?: string; detail?: string; log?: string[] }) | null;
  if (!j) return { error: `The admin server answered ${r.status} with no details (it may have hit its five-minute limit).` };
  if (r.ok && j.ok) return j as Extract<ImportResult, { ok: true }>;
  return { ok: false, error: j.error ?? `HTTP ${r.status}`, detail: j.detail, log: j.log };
}

/** POSTs a job action and returns its answer (or an error line). */
async function postJob(
  body: Record<string, unknown>,
): Promise<{ job?: JobStatus | null; nothing?: boolean; skipped?: number; error?: string }> {
  const r = await fetch("/api/admin/gym-places/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!r) return { error: "The admin server didn't answer." };
  const j = (await r.json().catch(() => null)) as { job?: JobStatus | null; nothing?: boolean; skipped?: number; error?: string } | null;
  if (!j) return { error: `The admin server answered ${r.status}.` };
  return r.ok ? j : { ...j, error: j.error ?? `HTTP ${r.status}` };
}

export function GymImport({ admin, changed }: { admin: boolean; changed: () => void }) {
  const [where, setWhere] = useState("");
  const [single, setSingle] = useState<Done | null>(null);
  const [busy, setBusy] = useState(false);
  const [skipRecent, setSkipRecent] = useState(true);
  const [notify, setNotify] = useState(true);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [problem, setProblem] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [recent, setRecent] = useState<ImportRow[] | null>(null);
  const [recentVersion, setRecentVersion] = useState(0);
  const [countries, setCountries] = useState<{ code: string; name: string; cities: number }[]>([]);
  const [countryText, setCountryText] = useState("Canada");
  const [failedOnly, setFailedOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const seen = useRef(-1);
  useEffect(() => {
    let live = true;
    fetch("/api/admin/gym-places/?countries=1")
      .then(async (r) => (r.ok ? ((await r.json()) as { countries: typeof countries }) : { countries: [] }))
      .then((j) => {
        if (!live) return;
        setCountries(j.countries);
        setCountryText(j.countries.find((c) => c.code === "CA")?.name ?? j.countries[0]?.name ?? "");
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  const allCities = countries.reduce((n, c) => n + c.cities, 0);
  // The country typed or picked in the search box, by name or code ("canada", "CA").
  const picked = pickCountry(countries, countryText);
  const failedRecent = failedPlaces(recent ?? []);
  const shown = (recent ?? []).filter((r) => !failedOnly || !r.ok);
  const running = job?.state === "running";

  useEffect(() => {
    let live = true;
    fetch("/api/admin/gym-places/?imports=1")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const j = (await r.json()) as { imports: ImportRow[] };
        if (live) setRecent(j.imports);
      })
      .catch(() => live && setRecent([]));
    return () => {
      live = false;
    };
  }, [recentVersion]);

  const show = useCallback(
    (j: JobStatus | null) => {
      setJob(j);
      // New cities done: the gym list and Recent imports have news.
      if (j && seen.current >= 0 && j.done !== seen.current) {
        changed();
        setRecentVersion((v) => v + 1);
      }
      seen.current = j ? j.done : -1;
    },
    [changed],
  );

  // The job on the server: read when the page opens, then every few seconds while it runs.
  const read = useCallback(
    () =>
      fetch("/api/admin/gym-places/?job=1")
        .then(async (r) => (r.ok ? ((await r.json()) as { job: JobStatus | null }) : null))
        .then((j) => j && show(j.job))
        .catch(() => undefined),
    [show],
  );
  useEffect(() => {
    let live = true;
    fetch("/api/admin/gym-places/?job=1")
      .then(async (r) => (r.ok ? ((await r.json()) as { job: JobStatus | null }) : null))
      .then((j) => live && j && show(j.job))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [show]);
  useEffect(() => {
    if (!running) return;
    // Not while the tab is hidden (each read counts the job's cities, and Turso bills every row read); it reads again
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

  const importOne = async () => {
    if (!where.trim()) return;
    setBusy(true);
    setSingle(null);
    const r = await postImport(where);
    setSingle({ where, at: Date.now(), r });
    setBusy(false);
    changed();
    setRecentVersion((v) => v + 1);
  };

  const act = async (body: Record<string, unknown>) => {
    setProblem("");
    const r = await postJob(body);
    if (r.error) setProblem(r.error);
    else if (r.nothing)
      setProblem(`Every city there was imported in the last 7 days (${r.skipped ?? 0} skipped). Untick the box to import them again.`);
    if (r.job !== undefined) show(r.job);
    else if (r.error) await read();
  };

  return (
    <>
      <Card title="Add a city's gyms">
        <HowItWorks>
          <p>
            Pulls every named fitness centre in an area from OpenStreetMap. They show in Find gyms near you as unofficial gyms until an
            owner claims one. Running it again is safe: gyms are matched by their map id, only what changed on the map is written, and a
            claimed gym is never touched. Yoga, pilates, martial arts and similar places are marked as studios, which the finder leaves out.
            Rec and community centres with a gym come in too.
          </p>
          <p>
            A gym&apos;s city comes from its own map address when that&apos;s a real place name. A postcode or house number there (some map
            entries have one) is ignored and the city you imported stands in. Addresses are tidied: stray commas, repeated parts and the
            city or postcode at the end are dropped.
          </p>
          <p>Country imports run on the server, two cities at a time, so you can close this page.</p>
        </HowItWorks>
        {admin && (
          <form
            className="mt-3 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void importOne();
            }}
          >
            <label className="sr-only" htmlFor="gym-area">
              City
            </label>
            <input
              id="gym-area"
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              placeholder="Langley, BC"
              className="min-w-0 flex-1 rounded-lg border border-line bg-raised px-3 py-2"
            />
            <button type="submit" disabled={busy || running} className="press btn-primary rounded-lg px-4 py-2 font-semibold">
              {busy ? "Importing…" : "Import"}
            </button>
          </form>
        )}
        {busy && (
          <p className="mt-2 text-sm text-muted" role="status">
            Importing {where}… a big city can take a minute or two.
          </p>
        )}
        {single && (
          <div className="mt-2 text-sm" role="status">
            <p className={single.r.ok ? "text-muted" : "text-bad"}>{line(single)}</p>
            {single.r.log && single.r.log.length > 0 && (
              <details className="mt-1">
                <summary className="cursor-pointer text-xs text-faint">Debug log</summary>
                <pre className="mt-1 overflow-x-auto text-xs whitespace-pre-wrap text-faint">{single.r.log.join("\n")}</pre>
              </details>
            )}
          </div>
        )}

        {admin && (
          <div className="mt-4 grid gap-2 text-sm">
            {!running && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor="gym-country">
                    Country
                  </label>
                  <input
                    id="gym-country"
                    list="gym-countries"
                    value={countryText}
                    onChange={(e) => {
                      setCountryText(e.target.value);
                    }}
                    onFocus={(e) => e.target.select()}
                    placeholder="Search countries"
                    autoComplete="off"
                    className="w-56 rounded-lg border border-line bg-raised px-3 py-1.5"
                  />
                  <datalist id="gym-countries">
                    {countries.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.cities} {c.cities === 1 ? "city" : "cities"}
                      </option>
                    ))}
                  </datalist>
                  <button
                    type="button"
                    disabled={busy || !picked}
                    onClick={() => picked && void act({ action: "importJob", country: picked.code, skipRecent, notify })}
                    className="press rounded-lg border border-line px-3 py-1.5"
                  >
                    {picked ? `Import ${picked.name}'s ${picked.cities} ${picked.cities === 1 ? "city" : "cities"}` : "Pick a country"}
                  </button>
                  <button
                    type="button"
                    disabled={busy || !countries.length}
                    onClick={() => void act({ action: "importJob", country: "ALL", skipRecent, notify })}
                    className="press rounded-lg border border-line px-3 py-1.5"
                  >
                    Import every country ({countries.length} countries, {allCities} cities)
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={skipRecent} onChange={(e) => setSkipRecent(e.target.checked)} />
                    Skip cities imported in the last 7 days
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
                    Email me when it&apos;s done
                  </label>
                </div>
              </>
            )}
            {problem && (
              <p className="text-bad" role="alert">
                {problem}
              </p>
            )}
            {job && <JobCard job={job} now={now} act={act} />}
          </div>
        )}
        <p className="mt-2 text-xs text-faint">Gym data © OpenStreetMap contributors, under the Open Database Licence.</p>
      </Card>

      <Card
        title="Recent imports"
        subtitle={
          recent
            ? `The last ${recent.length}, newest first. ${failedRecent.length ? `${failedRecent.length} still failing.` : "None failing."}`
            : undefined
        }
        right={
          recent && recent.length > 0 ? (
            <button
              type="button"
              onClick={() => download("gym-imports.json", recent)}
              className="press rounded-lg border border-line px-3 py-1.5 text-sm"
            >
              Download all
            </button>
          ) : undefined
        }
      >
        {recent && recent.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
            <div className="flex gap-1" role="group" aria-label="Show">
              {[false, true].map((only) => (
                <button
                  key={String(only)}
                  type="button"
                  aria-pressed={failedOnly === only}
                  onClick={() => setFailedOnly(only)}
                  className={`press rounded-full border px-3 py-1 ${failedOnly === only ? "border-accent bg-accent/15" : "border-line text-muted"}`}
                >
                  {only ? `Failed only (${recent.filter((r) => !r.ok).length})` : `All (${recent.length})`}
                </button>
              ))}
            </div>
            {admin && failedRecent.length > 0 && (
              <button
                type="button"
                disabled={running}
                onClick={() => void act({ action: "importRetryRecent", notify })}
                className="press btn-primary ml-auto rounded-lg px-3 py-1.5 font-semibold"
              >
                Retry {failedRecent.length} failed
              </button>
            )}
          </div>
        )}
        {recent === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="text-sm text-muted">No imports yet.</p>
        ) : shown.length === 0 ? (
          <p className="text-sm text-muted">None failed.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="num w-full min-w-[560px] text-sm">
              <caption className="sr-only">Recent city imports. Open one for its full error and step-by-step log.</caption>
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-2 py-1.5 font-normal">City</th>
                  <th className="px-2 py-1.5 font-normal">Result</th>
                  <th className="px-2 py-1.5 text-right font-normal">Took</th>
                  <th className="px-2 py-1.5 font-normal">Server</th>
                  <th className="px-2 py-1.5 font-normal">When</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <RecentRow key={r.id} r={r} open={open === r.id} toggle={() => setOpen(open === r.id ? null : r.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function JobCard({ job, now, act }: { job: JobStatus; now: number; act: (body: Record<string, unknown>) => Promise<void> }) {
  const [stopping, setStopping] = useState(false);
  const running = job.state === "running";
  const failed = job.failed;
  const left = running ? eta(job.startedAt, job.done, job.total, now) : null;
  const quiet = running && !job.active.length && now - job.activeAt > QUIET_MS;
  const title =
    job.state === "running"
      ? `Importing ${job.label}: ${job.done} of ${job.total} cities`
      : `${job.state === "stopped" ? "Stopped" : "Done"}: ${job.label}, ${job.done} of ${job.total} cities in ${mins((job.endedAt || now) - job.startedAt)}`;
  const saveLog = async () => {
    const r = await fetch(`/api/admin/gym-places/?job=${encodeURIComponent(job.id)}&log=1`).catch(() => null);
    const data: unknown = r?.ok ? await r.json().catch(() => null) : null;
    if (data) download(`gym-import-${new Date(job.startedAt).toISOString().slice(0, 19).replace(/:/g, "")}.json`, data);
  };
  // Failed cities, plus any a stopped run never reached.
  const notDone = job.total - (job.done - failed.length);
  return (
    <div className="grid gap-2 rounded-lg border border-line p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex-1 font-semibold" role="status">
          {title}
          {job.skipped ? ` (${job.skipped} imported in the last 7 days skipped)` : ""}
        </p>
        {running ? (
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
        )}
      </div>
      <p className="text-xs text-faint">
        Started by {job.startedBy || "staff"} {new Date(job.startedAt).toLocaleString()}
        {running ? `. Runs on the server, so this page can be closed${job.notify ? "; an email goes out when it's done" : ""}.` : "."}
      </p>
      <div
        className="h-2 overflow-hidden rounded-full bg-raised"
        role="progressbar"
        aria-label="Cities imported"
        aria-valuemin={0}
        aria-valuemax={job.total}
        aria-valuenow={job.done}
      >
        <div className="h-full bg-accent" style={{ width: `${job.total ? (job.done / job.total) * 100 : 100}%` }} />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted sm:grid-cols-4">
        <div>
          <dt className="text-xs text-faint">Now importing</dt>
          <dd>
            {job.active.length
              ? job.active.join(", ")
              : !running
                ? "Nothing"
                : stopping
                  ? "Stopping…"
                  : quiet
                    ? "Waiting for the server to pick it up (within five minutes)"
                    : job.waiting && !job.pending
                      ? "Waiting to try busy cities again"
                      : "Starting…"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-faint">Time left</dt>
          <dd>{running ? (left === null ? "Working it out…" : `About ${mins(left)}`) : "None"}</dd>
        </div>
        <div>
          <dt className="text-xs text-faint">Gyms</dt>
          <dd>
            {job.sums.found} found, {job.sums.added} new, {job.sums.updated} changed
          </dd>
        </div>
        <div>
          <dt className="text-xs text-faint">Errors</dt>
          <dd className={failed.length ? "text-bad" : ""}>
            {failed.length}
            {job.waiting ? `, ${job.waiting} busy, trying again soon` : ""}
          </dd>
        </div>
      </dl>
      {failed.length > 0 && (
        <ul className="grid gap-1 text-xs text-bad">
          {failed.map((d) => (
            <li key={`${d.where}-${d.at}`}>{line(d)}</li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        {!running && notDone > 0 && (
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
        <ul className="max-h-48 overflow-y-auto text-xs text-faint">
          {job.recent.map((d) => (
            <li key={`${d.where}-${d.at}`} className={d.r.ok ? "" : "text-bad"}>
              {line(d)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A country from the search box, by its name or code ("canada", "CA"), or null. */
export function pickCountry<T extends { code: string; name: string }>(list: T[], text: string): T | null {
  const v = text.trim().toLowerCase();
  if (!v) return null;
  return list.find((c) => c.name.toLowerCase() === v || c.code.toLowerCase() === v) ?? null;
}

/** Places whose latest import in the list failed (a later clean import clears an earlier failure). */
export function failedPlaces(rows: ImportRow[]): string[] {
  const latest = new Map<string, boolean>();
  for (const r of rows) if (!latest.has(r.query)) latest.set(r.query, r.ok);
  return [...latest].filter(([, ok]) => !ok).map(([q]) => q);
}

/**
 * A failed import in a few words, instead of every map server's error on one line: "Place not found", "Map servers
 * busy" (every server busy or hung) or "Map error". The full text is in the row's details.
 */
export function shortError(error: string): string {
  if (/^where\b/.test(error)) return "Place not found";
  const detail = error.replace(/^map:\s*/, "");
  const parts = detail
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length && parts.every((p) => /busy|no answer|fetch failed|timed out|too many requests|HTTP 5\d\d/i.test(p)))
    return "Map servers busy";
  return "Map error";
}

function RecentRow({ r, open, toggle }: { r: ImportRow; open: boolean; toggle: () => void }) {
  return (
    <>
      <tr className="border-b border-line align-top">
        <td className="px-2 py-1.5">
          <button
            type="button"
            aria-expanded={open}
            aria-label={`${r.ok ? "Imported" : "Failed"}: ${r.area || r.query}`}
            onClick={toggle}
            className="flex items-center gap-2 text-left hover:underline"
          >
            <span aria-hidden className={`inline-block h-2 w-2 shrink-0 rounded-full ${r.ok ? "bg-good" : "bg-bad"}`} />
            <span className="break-words">{r.area || r.query}</span>
          </button>
        </td>
        <td className={`px-2 py-1.5 ${r.ok ? "text-muted" : "text-bad"}`}>
          {r.ok ? `${r.found} found, ${r.added} new, ${r.updated} changed` : shortError(r.error)}
        </td>
        <td className="px-2 py-1.5 text-right whitespace-nowrap text-muted">{mins(r.ms)}</td>
        <td className="px-2 py-1.5 text-muted">{r.server || "—"}</td>
        <td className="px-2 py-1.5 whitespace-nowrap text-muted">{new Date(r.at).toLocaleString()}</td>
      </tr>
      {open && (
        <tr className="border-b border-line">
          <td colSpan={5} className="px-2 pb-2">
            {!r.ok && <p className="text-xs break-words text-bad">{r.error}</p>}
            <pre className="mt-1 max-h-72 overflow-auto text-xs whitespace-pre-wrap text-faint">{r.log || "No log."}</pre>
          </td>
        </tr>
      )}
    </>
  );
}
