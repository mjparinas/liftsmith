"use client";

// The admin Log tab (Gradelings' change log): every sign-in and change made in the panel, newest first, 100 at a
// time, filtered by who and by what.
import { useEffect, useState } from "react";

import { Card, Table } from "./charts";
import { when } from "./time";

type Audit = { id: number; at: number; admin: string; action: string; target: string | null; detail: string | null };
type Page = { audit: Audit[]; next: number | null; people: string[]; actions: string[] };

/** Action groups for the filter: "2fa" for 2fa.enable, 2fa.verify and the rest, plus each action itself. */
export function actionChoices(actions: string[]): string[] {
  const groups = new Set(actions.filter((a) => a.includes(".")).map((a) => a.split(".")[0]!));
  return [...new Set([...groups, ...actions])].sort();
}

export function Log() {
  const [who, setWho] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState<Page | null>(null);
  const [more, setMore] = useState<Audit[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    const q = new URLSearchParams();
    if (who) q.set("who", who);
    if (action) q.set("action", action);
    fetch(`/api/admin/audit/?${q}`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const j = (await r.json()) as Page;
        if (!live) return;
        setPage(j);
        setMore([]);
      })
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, [who, action]);
  // Where "Load more" carries on from: the first page's cursor until more has loaded, then the last page's.
  const [moreNext, setMoreNext] = useState<number | null | undefined>(undefined);
  const cursor = moreNext === undefined ? page?.next : moreNext;
  const loadMore = async () => {
    if (!cursor) return;
    const q = new URLSearchParams({ before: String(cursor) });
    if (who) q.set("who", who);
    if (action) q.set("action", action);
    const r = await fetch(`/api/admin/audit/?${q}`);
    if (!r.ok) return setError(true);
    const j = (await r.json()) as Page;
    setMore((m) => [...m, ...j.audit]);
    setMoreNext(j.next);
  };
  const rows = page ? [...page.audit, ...more] : [];
  const select = "card px-3 py-2 text-sm";
  return (
    <Card title="Change log" subtitle="Every sign-in and change made in the panel, newest first.">
      {page && (
        <div className="mb-3 flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="log-who">
            Who
          </label>
          <select
            id="log-who"
            className={select}
            value={who}
            onChange={(e) => {
              setMoreNext(undefined);
              setWho(e.target.value);
            }}
          >
            <option value="">Everyone</option>
            {page.people.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="log-action">
            What
          </label>
          <select
            id="log-action"
            className={select}
            value={action}
            onChange={(e) => {
              setMoreNext(undefined);
              setAction(e.target.value);
            }}
          >
            <option value="">Every action</option>
            {actionChoices(page.actions).map((a) => (
              <option key={a} value={a}>
                {a.includes(".") ? a : `${a} (all)`}
              </option>
            ))}
          </select>
        </div>
      )}
      {error && <p className="text-sm text-bad">The log didn&apos;t load. Reload to try again.</p>}
      {!page ? (
        !error && <p className="text-sm text-muted">Loading…</p>
      ) : (
        <>
          <Table
            columns={["When", "Who", "What", "Target", "Detail"]}
            rows={rows.map((a) => [
              when(a.at),
              a.admin,
              a.action,
              a.target ?? "",
              <span key="d" className="break-all text-xs text-muted">
                {a.detail ?? ""}
              </span>,
            ])}
            empty={who || action ? "Nothing matches." : "No changes yet."}
          />
          {cursor ? (
            <button type="button" onClick={() => void loadMore()} className="press mt-3 rounded-lg border border-line px-3 py-1.5 text-sm">
              Load more
            </button>
          ) : null}
        </>
      )}
    </Card>
  );
}
