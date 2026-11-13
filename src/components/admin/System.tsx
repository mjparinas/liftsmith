"use client";

// The admin System tab (as in Gradelings): one card per part of the stack (live site, uptime, builds, deploys,
// database, email, the daily job, subscriptions, admin security, capacity, backups, settings) and the providers'
// public status pages, under the maintenance mode switch. Every card
// loads on its own, so a slow service never holds up the rest; results are cached on the server for a minute.
import { Fragment, useCallback, useEffect, useState } from "react";

import {
  CHECKS,
  STATE_LABEL,
  STATUS_PAGES,
  worst,
  type CheckResult,
  type CheckState,
  type HealthCheck,
  type StatusPage,
} from "@/lib/systemHealth";
import { isVisible } from "@/lib/visibility";

import { MaintenanceCard, useMaintenance } from "./Maintenance";
import { Bone, LineBones, Loading } from "./Skeletons";
import { ago } from "./time";
import { TwoFactorCard } from "./TwoFactor";

const AUTO_KEY = "liftsmith.admin.autoRefresh";
const readAuto = () => {
  try {
    return localStorage.getItem(AUTO_KEY) === "1";
  } catch {
    return false;
  }
};

/** Records the day a restore from backup was practised (docs/RESTORE.md), for the Backups card. */
function RestoreDrill({ done }: { done: () => void }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [msg, setMsg] = useState<string | null>(null);
  const save = async () => {
    const r = await fetch("/api/admin/system/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore-drill", date }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    setMsg(r.ok ? "Recorded." : (j.error ?? "That didn't save."));
    if (r.ok) done();
  };
  return (
    <section className="card min-w-0 p-4">
      <h2 className="font-semibold">Record a restore practice</h2>
      <p className="mt-0.5 text-xs text-muted">
        After restoring a Turso backup into a spare database and checking it (docs/RESTORE.md), note the day here.
      </p>
      <div className="mt-2 flex flex-wrap items-end gap-2 text-sm">
        <label htmlFor="drill-date" className="block">
          <span className="block text-xs text-muted">Practised on</span>
          <input id="drill-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="card mt-1 px-2 py-1.5" />
        </label>
        <button type="button" onClick={() => void save()} className="press rounded-lg border border-line px-3 py-1.5">
          Record restore practice
        </button>
      </div>
      {msg && (
        <p role="status" className="mt-2 text-sm text-muted">
          {msg}
        </p>
      )}
    </section>
  );
}

const DOT: Record<CheckState, string> = { ok: "bg-good", warn: "bg-warn", down: "bg-bad", off: "bg-line" };
const TEXT: Record<CheckState, string> = { ok: "text-good", warn: "text-warn", down: "text-bad", off: "text-muted" };

function Badge({ state }: { state: CheckState }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold ${TEXT[state]}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${DOT[state]}`} aria-hidden />
      {STATE_LABEL[state]}
    </span>
  );
}

/** Fetches one card; `round` changes to ask again, `refresh` skips the server's cache. */
function useCard<T>(url: string, round: number, refresh: boolean) {
  const [r, setR] = useState<{ data: CheckResult<T> | null; error: string | null }>({ data: null, error: null });
  useEffect(() => {
    let live = true;
    fetch(`${url}${refresh ? "&refresh=1" : ""}`)
      .then(async (res) => {
        const j = (await res.json().catch(() => ({}))) as CheckResult<T> & { error?: string };
        if (!live) return;
        setR(res.ok ? { data: j, error: null } : { data: null, error: j.error ?? `Answered ${res.status}.` });
      })
      .catch(() => live && setR({ data: null, error: "Didn't load." }));
    return () => {
      live = false;
    };
  }, [url, round, refresh]);
  return r;
}

function CheckCard({
  id,
  title,
  round,
  refresh,
  report,
}: {
  id: string;
  title: string;
  round: number;
  refresh: boolean;
  report: (id: string, s: CheckState) => void;
}) {
  const { data, error } = useCard<HealthCheck>(`/api/admin/system/?check=${id}`, round, refresh);
  const c = data?.result;
  /** Past this many rows (the Settings card has 60+) the list scrolls inside the card. */
  const long = (c?.rows.length ?? 0) > 12;
  useEffect(() => {
    if (c) report(id, c.state);
  }, [c, id, report]);
  return (
    <section className="card min-w-0 p-4" aria-busy={!c && !error}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {c ? <Badge state={c.state} /> : !error && <Bone className="h-5 w-16 rounded-full" />}
      </div>
      {error && <p className="mt-1 text-sm text-bad">{error}</p>}
      {!c && !error && (
        <Loading label={`Checking ${title}`} className="mt-2">
          <LineBones n={3} />
        </Loading>
      )}
      {c && (
        <>
          <p className="mt-1 text-sm">{c.summary}</p>
          {c.rows.length > 0 && (
            <dl
              className={`mt-3 min-w-0 space-y-1 ${long ? "max-h-80 overflow-y-auto overscroll-contain rounded-lg border border-line/50 px-2 pb-2 text-xs" : "text-sm"}`}
              // A long list scrolls on its own, so the card stays the size of its neighbours; keyboard users can focus it to scroll.
              {...(long ? { tabIndex: 0, "aria-label": `${title} list` } : {})}
            >
              {c.rows.map((row, i) => (
                <Fragment key={i}>
                  {row.group && row.group !== c.rows[i - 1]?.group && (
                    <h3
                      className={`pt-3 text-xs font-semibold tracking-wide text-muted uppercase ${long ? "sticky top-0 z-10 bg-surface pb-1" : "first:pt-0"}`}
                    >
                      {row.group}
                    </h3>
                  )}
                  <div className="flex flex-wrap justify-between gap-x-3 border-b border-line/50 pb-1">
                    <dt className="text-muted">
                      {row.state && (
                        <span
                          className={`mr-1.5 inline-block h-2 w-2 rounded-full ${DOT[row.state]}`}
                          aria-label={STATE_LABEL[row.state]}
                        />
                      )}
                      {row.href ? (
                        <a href={row.href} target="_blank" rel="noreferrer" className="underline">
                          {row.label}
                        </a>
                      ) : (
                        row.label
                      )}
                    </dt>
                    <dd className="num text-right">
                      {row.value}
                      {row.at ? `${row.value ? " · " : ""}${ago(row.at)}` : ""}
                    </dd>
                    {row.note && (
                      // In a long list the note keeps to one line; the whole of it shows on hover.
                      <p className={`w-full text-xs text-muted ${long ? "truncate" : ""}`} title={long ? row.note : undefined}>
                        {row.note}
                      </p>
                    )}
                  </div>
                </Fragment>
              ))}
            </dl>
          )}
          {c.setup && <p className="mt-3 rounded-lg border border-line p-2 text-xs text-muted">To set up: {c.setup}</p>}
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted">
            {c.link ? (
              <a href={c.link.href} target="_blank" rel="noreferrer" className="text-accent underline">
                {c.link.label}
              </a>
            ) : (
              <span />
            )}
            {data && <span>Checked {ago(data.checkedAt)}</span>}
          </div>
        </>
      )}
    </section>
  );
}

function PageRow({
  name,
  url,
  round,
  refresh,
  report,
}: {
  name: string;
  url: string;
  round: number;
  refresh: boolean;
  report: (id: string, s: CheckState) => void;
}) {
  const { data, error } = useCard<StatusPage>(`/api/admin/system/?page=${encodeURIComponent(name)}`, round, refresh);
  const p = data?.result;
  useEffect(() => {
    if (p) report(`page:${name}`, p.state);
  }, [p, name, report]);
  return (
    <li className="py-2">
      <div className="flex items-center justify-between gap-3">
        <a href={url} target="_blank" rel="noreferrer" className="font-semibold underline">
          {name}
        </a>
        {p ? (
          <Badge state={p.state} />
        ) : error ? (
          <span className="text-xs text-muted">Couldn&apos;t read it</span>
        ) : (
          <Bone className="h-5 w-16 rounded-full" />
        )}
      </div>
      {p && <p className="text-sm text-muted">{p.description}</p>}
      {!p && !error && (
        <Loading label={`Checking ${name}`} className="mt-1.5">
          <Bone className="h-3 w-2/3" />
        </Loading>
      )}
      {p?.incidents.map((i, k) => (
        <p key={k} className="text-sm">
          {i.href ? (
            <a href={i.href} target="_blank" rel="noreferrer" className="underline">
              {i.name}
            </a>
          ) : (
            i.name
          )}
          {i.startedAt ? <span className="text-muted"> · {ago(i.startedAt)}</span> : null}
        </p>
      ))}
    </li>
  );
}

export function System({ admin = false, maintenance }: { admin?: boolean; maintenance?: ReturnType<typeof useMaintenance> }) {
  const [round, setRound] = useState(0);
  const [refresh, setRefresh] = useState(false);
  const own = useMaintenance();
  const [mState, mChanged] = maintenance ?? own;
  // Auto refresh (Gradelings): off by default, remembered on this browser; reads the server's one-minute cache.
  const [auto, setAuto] = useState(readAuto);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => {
      // Not while the tab is hidden: it refreshes when it comes back (Gradelings #553).
      if (!isVisible()) return;
      setRefresh(false);
      setRound((r) => r + 1);
    }, 60_000);
    return () => clearInterval(t);
  }, [auto]);
  const [states, setStates] = useState<Record<string, CheckState>>({});
  const report = useCallback((id: string, s: CheckState) => setStates((x) => (x[id] === s ? x : { ...x, [id]: s })), []);
  const all = Object.values(states);
  const overall = worst(all);
  const total = CHECKS.length + STATUS_PAGES.length;
  return (
    <div className="space-y-4">
      <MaintenanceCard state={mState} admin={admin} changed={mChanged} />
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm">
          {all.length < total ? (
            <span className="text-muted">Checking {total - all.length} more…</span>
          ) : (
            <>
              Overall: <Badge state={overall} />
            </>
          )}
        </p>
        <label className="ml-auto flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={auto}
            onChange={(e) => {
              setAuto(e.target.checked);
              try {
                localStorage.setItem(AUTO_KEY, e.target.checked ? "1" : "0");
              } catch {
                // Not remembered; it still works for this visit.
              }
            }}
          />
          Auto refresh every minute
        </label>
        <button
          type="button"
          onClick={() => {
            setRefresh(true);
            setRound((r) => r + 1);
          }}
          className="press rounded-lg border border-line px-3 py-1.5 text-sm"
        >
          Check again
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CHECKS.map((c) => (
          <CheckCard key={c.id} id={c.id} title={c.title} round={round} refresh={refresh} report={report} />
        ))}
      </div>
      <TwoFactorCard />
      {admin && (
        <RestoreDrill
          done={() => {
            setRefresh(true);
            setRound((r) => r + 1);
          }}
        />
      )}
      <section className="card min-w-0 p-4">
        <h2 className="font-semibold">Providers&apos; status pages</h2>
        <p className="mt-0.5 text-xs text-muted">What each service says about itself, read from its public status page.</p>
        <ul className="mt-2 divide-y divide-line/60">
          {STATUS_PAGES.map((p) => (
            <PageRow key={p.name} name={p.name} url={p.url} round={round} refresh={refresh} report={report} />
          ))}
        </ul>
      </section>
    </div>
  );
}
