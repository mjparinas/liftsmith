"use client";

// The admin Reports tab: what lifters reported on Friends (docs/decisions/friends.md), grouped by what was reported,
// most reported first. Three reports have already hidden a post or comment; staff remove it, dismiss the reports
// (which shows it again), or suspend the author (hides everything they wrote and stops them posting). Support
// staff can read; only admins act.
import { useEffect, useState } from "react";

import type { ReportAction, ReportGroup } from "@/server/social";

import { Card } from "./charts";
import { REASON_NAME } from "./Moderation";
import { Loading, RowBones } from "./Skeletons";
import { ago } from "./time";

const ACTIONS: { action: ReportAction; label: string; danger?: boolean }[] = [
  { action: "remove", label: "Remove", danger: true },
  { action: "dismiss", label: "Dismiss" },
  { action: "suspend", label: "Ban author", danger: true },
];

export function Reports({ admin, onCount }: { admin: boolean; onCount: (n: number) => void }) {
  const [rows, setRows] = useState<ReportGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    fetch("/api/admin/reports/")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const j = (await r.json()) as { reports: ReportGroup[] };
        if (!live) return;
        setRows(j.reports);
        onCount(j.reports.length);
      })
      .catch(() => live && setError("The reports didn't load."));
    return () => {
      live = false;
    };
  }, [version, onCount]);
  const load = () => setVersion((v) => v + 1);
  const act = async (g: ReportGroup, action: ReportAction) => {
    const r = await fetch("/api/admin/reports/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: g.kind, id: g.targetId, action }),
    });
    if (!r.ok) setError(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "That didn't work.");
    load();
  };
  return (
    <Card title="Reports on Friends">
      <p className="text-sm text-muted">
        Posts, comments and profiles lifters reported. Three reports hide a post or comment until it&apos;s decided here. Remove deletes it
        (for a profile, resets the name to the handle), Dismiss shows it again, Ban author hides everything the author wrote and tells them.
        For warnings, suspensions, shadow bans and who reported whom, open the author on the Users tab.
      </p>
      {error && <p className="mt-2 text-sm text-bad">{error}</p>}
      {rows === null ? (
        !error && (
          <Loading label="Loading reports" className="mt-3">
            <RowBones n={3} />
          </Loading>
        )
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nothing waiting.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {rows.map((g) => (
            <li key={`${g.kind}:${g.targetId}`} className="flex flex-wrap items-start gap-3 py-3">
              <span className="mt-0.5 shrink-0 rounded-md border border-line px-2 py-0.5 text-xs text-muted">{g.kind}</span>
              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold">{g.content || "(empty)"}</p>
                <p className="text-sm text-muted">
                  {g.author ? `@${g.author.handle} (${g.author.name})${g.author.suspended ? " · banned or suspended" : ""}` : "author gone"}{" "}
                  · {g.reports} {g.reports === 1 ? "report" : "reports"} ·{" "}
                  {Object.entries(g.reasons)
                    .map(([k, n]) => `${REASON_NAME[k] ?? k} ${n}`)
                    .join(", ")}{" "}
                  · last {ago(g.lastAt)}
                  {g.hidden ? " · hidden" : ""}
                </p>
                {g.notes.length > 0 && <p className="mt-1 text-sm text-muted">Notes: {g.notes.join(" | ")}</p>}
              </div>
              {admin && (
                <div className="flex flex-wrap gap-2 text-sm">
                  {ACTIONS.filter((a) => !(a.action === "remove" && !g.content)).map((a) => (
                    <button
                      key={a.action}
                      type="button"
                      onClick={() => void act(g, a.action)}
                      className={`press rounded-lg px-3 py-1.5 ${a.danger ? "border border-bad/40 text-bad" : "border border-line text-muted"}`}
                    >
                      {a.label}
                    </button>
                  ))}
                  {g.author?.suspended && (
                    <button
                      type="button"
                      onClick={() => void act(g, "unsuspend")}
                      className="press rounded-lg border border-line px-3 py-1.5 text-muted"
                    >
                      Unban
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
