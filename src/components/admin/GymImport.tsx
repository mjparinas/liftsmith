"use client";

// Admin › Gyms: importing gyms from OpenStreetMap (src/server/gymImport.ts, docs/decisions/gyms.md "Importing gyms").
// One city by name, or a country's major cities two at a time with live progress (the cities being imported, done of
// total, time left, errors), a retry for the ones that failed, and a debug log to download. Recent imports lists the
// last hundred with each one's step-by-step log, so a city that failed last week can still be looked into.
import { useEffect, useRef, useState } from "react";

import type { ImportResult, ImportRow } from "@/server/gymImport";

import { Card } from "./charts";

type Answer = Extract<ImportResult, { ok: true }> | { ok?: false; error: string; detail?: string; log?: string[]; retry?: boolean };

interface Done {
  where: string;
  at: number;
  r: Answer;
}

/** Two cities at a time: each on its own map server, which stays within each server's per-client slots. */
export const IMPORT_WORKERS = 2;
/** A city whose map servers were all busy goes back in line this many times, after these pauses (the servers are often
 * busy for a few minutes at a time, so a city that failed at 2:00 usually imports at 2:05). */
export const RETRY_AFTER_MS = [3 * 60_000, 10 * 60_000];
/** How recent an import must be for "Skip recent cities" to pass it over. */
const RECENT_MS = 7 * 86_400_000;

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

const line = (d: Done) =>
  d.r.ok
    ? `${d.r.area}: ${d.r.found} found, ${d.r.added} new, ${d.r.updated} changed, ${d.r.unchanged} unchanged${d.r.kept ? `, ${d.r.kept} claimed left alone` : ""} (${mins(d.r.ms)}, ${d.r.server})`
    : `${d.where}: ${d.r.error}${d.r.detail ? ` (${d.r.detail})` : ""}`;

async function postImport(where: string, server: number): Promise<Answer> {
  const r = await fetch("/api/admin/gym-places/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "import", where, server }),
  }).catch(() => null);
  if (!r) return { error: "The admin server didn't answer (network or time limit).", retry: true };
  const j = (await r.json().catch(() => null)) as (Partial<ImportResult> & { error?: string; detail?: string; log?: string[] }) | null;
  if (!j) return { error: `The admin server answered ${r.status} with no details (it may have hit its five-minute limit).`, retry: true };
  if (r.ok && j.ok) return j as Extract<ImportResult, { ok: true }>;
  // A place Nominatim doesn't know (400) won't be found by asking again; busy map servers (502) and the rest might.
  return {
    ok: false,
    error: j.error ?? `HTTP ${r.status}`,
    detail: j.detail,
    log: j.log,
    retry: r.status !== 400 && r.status !== 401 && r.status !== 403,
  };
}

interface Run {
  label: string;
  total: number;
  skipped: number;
  startedAt: number;
  active: string[];
  /** Cities waiting to try again, and when. */
  waiting: { where: string; tries: number; at: number }[];
  /** Failed tries that went back in line, kept for the debug log. */
  retried: Done[];
  done: Done[];
  stopped: boolean;
  finished: boolean;
  endedAt: number;
}

export function GymImport({ admin, changed }: { admin: boolean; changed: () => void }) {
  const [where, setWhere] = useState("");
  const [single, setSingle] = useState<Done | null>(null);
  const [busy, setBusy] = useState(false);
  const [skipRecent, setSkipRecent] = useState(true);
  const [run, setRun] = useState<Run | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [recent, setRecent] = useState<ImportRow[] | null>(null);
  const [recentVersion, setRecentVersion] = useState(0);
  const stop = useRef(false);
  const [countries, setCountries] = useState<{ code: string; name: string; cities: number }[]>([]);
  const [country, setCountry] = useState("CA");
  useEffect(() => {
    let live = true;
    fetch("/api/admin/gym-places/?countries=1")
      .then(async (r) => (r.ok ? ((await r.json()) as { countries: typeof countries }) : { countries: [] }))
      .then((j) => live && setCountries(j.countries))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  const allCities = countries.reduce((n, c) => n + c.cities, 0);
  const [stopping, setStopping] = useState(false);
  const running = !!run && !run.finished;

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

  // The clock for time left, only while a run is going.
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  const importOne = async () => {
    if (!where.trim()) return;
    setBusy(true);
    setSingle(null);
    const r = await postImport(where, 0);
    setSingle({ where, at: Date.now(), r });
    setBusy(false);
    changed();
    setRecentVersion((v) => v + 1);
  };

  const importMany = async (label: string, places: string[], skipped = 0) => {
    stop.current = false;
    const state: Run = {
      label,
      total: places.length,
      skipped,
      startedAt: Date.now(),
      active: [],
      waiting: [],
      retried: [],
      done: [],
      stopped: false,
      finished: false,
      endedAt: 0,
    };
    const show = () =>
      setRun({ ...state, active: [...state.active], waiting: [...state.waiting], retried: [...state.retried], done: [...state.done] });
    show();
    const queue = [...places];
    const tries = new Map<string, number>();
    const pause = (ms: number) => new Promise((ok) => setTimeout(ok, ms));
    // The next city: the queue first, then a failed one whose pause is over. A worker with nothing left but cities
    // still pausing waits for them (a second at a time, so Stop is quick); it ends when nothing is queued, pausing or
    // being imported by the other worker (which may still put one back).
    const take = async (): Promise<string | null> => {
      for (;;) {
        if (stop.current) return null;
        const p = queue.shift();
        if (p !== undefined) return p;
        const ready = state.waiting.findIndex((x) => x.at <= Date.now());
        if (ready >= 0) return state.waiting.splice(ready, 1)[0]!.where;
        if (!state.waiting.length && !state.active.length) return null;
        await pause(1000);
      }
    };
    const worker = async (w: number) => {
      // The second worker starts a moment later, so Nominatim (one request a second) isn't asked twice at once.
      if (w) await pause(1500);
      for (let place = await take(); place !== null; place = await take()) {
        const tried = tries.get(place) ?? 0;
        tries.set(place, tried + 1);
        state.active.push(place);
        show();
        // Each worker starts on its own healthy map server (the server ranks them), so two cities don't queue on one.
        const r = await postImport(place, w);
        state.active = state.active.filter((p) => p !== place);
        const again = RETRY_AFTER_MS[tried];
        if (!r.ok && r.retry && again !== undefined && !stop.current) {
          state.waiting.push({ where: place, tries: tried + 1, at: Date.now() + again });
          state.retried.push({ where: place, at: Date.now(), r });
        } else state.done.push({ where: place, at: Date.now(), r });
        show();
        changed();
        if (!stop.current) await pause(1000);
      }
    };
    await Promise.all(Array.from({ length: Math.min(IMPORT_WORKERS, places.length) }, (_, w) => worker(w)));
    state.stopped = stop.current;
    // Cities still pausing when the run was stopped count as not done (Retry failed picks them up).
    for (const x of state.waiting)
      state.done.push({ where: x.where, at: Date.now(), r: { ok: false, error: "Stopped before trying again." } });
    state.waiting = [];
    state.finished = true;
    state.endedAt = Date.now();
    setStopping(false);
    show();
    setRecentVersion((v) => v + 1);
  };

  const importCountry = async (country: string) => {
    const r = await fetch(`/api/admin/gym-places/?cities=${country}`);
    const { cities, last } = (await r.json().catch(() => ({ cities: [], last: {} }))) as { cities: string[]; last: Record<string, number> };
    const key = (c: string) =>
      c
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/\s*,\s*/g, ", ");
    const todo = skipRecent ? cities.filter((c) => !((last[key(c)] ?? 0) > Date.now() - RECENT_MS)) : cities;
    const label = country === "ALL" ? "every country" : (countries.find((c) => c.code === country)?.name ?? country);
    await importMany(label, todo, cities.length - todo.length);
  };

  const failed = run?.done.filter((d) => !d.r.ok) ?? [];
  const ok = run?.done.filter((d) => d.r.ok) ?? [];
  const left = run ? eta(run.startedAt, run.done.length, run.total, now) : null;
  const sum = (k: "found" | "added" | "updated" | "unchanged" | "kept") => ok.reduce((n, d) => n + (d.r.ok ? d.r[k] : 0), 0);

  return (
    <>
      <Card title="Add a city's gyms">
        <p className="text-sm text-muted">
          Pulls every named fitness centre in an area from OpenStreetMap. They show in Find gyms near you as unofficial gyms until an owner
          claims one. Running it again is safe: gyms are matched by their map id, only what changed on the map is written, and a claimed gym
          is never touched. Yoga, pilates, martial arts and similar places are marked as studios, which the finder leaves out. Rec and
          community centres with a gym come in too.
        </p>
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
              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor="gym-country">
                  Country
                </label>
                <select
                  id="gym-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="rounded-lg border border-line bg-raised px-3 py-1.5"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.cities} {c.cities === 1 ? "city" : "cities"})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busy || !countries.length}
                  onClick={() => void importCountry(country)}
                  className="press rounded-lg border border-line px-3 py-1.5"
                >
                  Import its major cities
                </button>
                <button
                  type="button"
                  disabled={busy || !countries.length}
                  onClick={() => void importCountry("ALL")}
                  className="press rounded-lg border border-line px-3 py-1.5"
                >
                  Import every country ({countries.length} countries, {allCities} cities)
                </button>
                <label className="flex items-center gap-2 text-muted">
                  <input type="checkbox" checked={skipRecent} onChange={(e) => setSkipRecent(e.target.checked)} />
                  Skip cities imported in the last 7 days
                </label>
              </div>
            )}
            {run && (
              <div className="grid gap-2 rounded-lg border border-line p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="flex-1 font-semibold" role="status">
                    {run.finished
                      ? `${run.stopped ? "Stopped" : "Done"}: ${run.label}, ${run.done.length} of ${run.total} cities in ${mins(run.endedAt - run.startedAt)}`
                      : `Importing ${run.label}: ${run.done.length} of ${run.total} cities`}
                    {run.skipped ? ` (${run.skipped} imported in the last 7 days skipped)` : ""}
                  </p>
                  {running ? (
                    <button
                      type="button"
                      onClick={() => {
                        stop.current = true;
                        setStopping(true);
                      }}
                      className="press rounded-lg border border-line px-3 py-1.5 text-muted"
                    >
                      Stop
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRun(null)}
                      className="press rounded-lg border border-line px-3 py-1.5 text-muted"
                    >
                      Close
                    </button>
                  )}
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-raised"
                  role="progressbar"
                  aria-label="Cities imported"
                  aria-valuemin={0}
                  aria-valuemax={run.total}
                  aria-valuenow={run.done.length}
                >
                  <div className="h-full bg-accent" style={{ width: `${run.total ? (run.done.length / run.total) * 100 : 100}%` }} />
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted sm:grid-cols-4">
                  <div>
                    <dt className="text-xs text-faint">Now importing</dt>
                    <dd>{run.active.length ? run.active.join(", ") : running ? (stopping ? "Stopping…" : "Starting…") : "Nothing"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-faint">Time left</dt>
                    <dd>{running ? (left === null ? "Working it out…" : `About ${mins(left)}`) : "None"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-faint">Gyms</dt>
                    <dd>
                      {sum("found")} found, {sum("added")} new, {sum("updated")} changed
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-faint">Errors</dt>
                    <dd className={failed.length ? "text-bad" : ""}>
                      {failed.length}
                      {run.waiting.length ? `, ${run.waiting.length} busy, trying again soon` : ""}
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
                  {run.finished && failed.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        void importMany(
                          `${failed.length} failed ${failed.length === 1 ? "city" : "cities"}`,
                          failed.map((d) => d.where),
                        )
                      }
                      className="press btn-primary rounded-lg px-3 py-1.5 font-semibold"
                    >
                      Retry {failed.length} failed
                    </button>
                  )}
                  {run.done.length + run.retried.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        download(`gym-import-${new Date(run.startedAt).toISOString().slice(0, 19).replace(/:/g, "")}.json`, {
                          run: run.label,
                          startedAt: new Date(run.startedAt).toISOString(),
                          total: run.total,
                          skippedAsRecent: run.skipped,
                          cities: run.done.map((d) => ({ where: d.where, finishedAt: new Date(d.at).toISOString(), ...d.r })),
                          triedAgain: run.retried.map((d) => ({ where: d.where, failedAt: new Date(d.at).toISOString(), ...d.r })),
                        })
                      }
                      className="press rounded-lg border border-line px-3 py-1.5"
                    >
                      Download debug log
                    </button>
                  )}
                </div>
                {run.done.length > 0 && (
                  <ul className="max-h-48 overflow-y-auto text-xs text-faint">
                    {[...run.done].reverse().map((d) => (
                      <li key={`${d.where}-${d.at}`} className={d.r.ok ? "" : "text-bad"}>
                        {line(d)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
        <p className="mt-2 text-xs text-faint">Gym data © OpenStreetMap contributors, under the Open Database Licence.</p>
      </Card>

      <Card
        title="Recent imports"
        subtitle="The last hundred, newest first. Open one for its step-by-step log."
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
        {recent === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="text-sm text-muted">No imports yet.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {recent.map((r) => (
              <li key={r.id} className="py-2">
                <details>
                  <summary className="cursor-pointer">
                    <span className={r.ok ? "" : "text-bad"}>{r.area || r.query}</span>
                    <span className="text-muted">
                      {" "}
                      · {r.ok ? `${r.found} found, ${r.added} new, ${r.updated} changed` : r.error} · {mins(r.ms)}
                      {r.server ? ` · ${r.server}` : ""} · {new Date(r.at).toLocaleString()}
                    </span>
                  </summary>
                  <pre className="mt-1 overflow-x-auto text-xs whitespace-pre-wrap text-faint">{r.log || "No log."}</pre>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
