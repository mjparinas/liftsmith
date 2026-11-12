"use client";

// Reported gym listings (docs/decisions/gym-sharing.md), under Friends reports on the admin Reports tab. Three
// reports hide a listing; staff remove it or dismiss the reports (which shows it again). Support staff can read;
// only admins act.
import { useEffect, useState } from "react";

import type { GymAction, ReportedGym } from "@/server/gymDirectory";

import { Card } from "./charts";
import { ago } from "./time";

export function GymReports({ admin }: { admin: boolean }) {
  const [rows, setRows] = useState<ReportedGym[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    fetch("/api/admin/gyms/")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const j = (await r.json()) as { gyms: ReportedGym[] };
        if (live) setRows(j.gyms);
      })
      .catch(() => live && setError("The gym reports didn't load."));
    return () => {
      live = false;
    };
  }, [version]);
  const act = async (g: ReportedGym, action: GymAction) => {
    const r = await fetch("/api/admin/gyms/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: g.id, action }),
    });
    if (!r.ok) setError(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "That didn't work.");
    setVersion((v) => v + 1);
  };
  return (
    <Card title="Reported gym listings">
      <p className="text-sm text-muted">
        Gyms lifters listed for others nearby, and reported. Three reports hide a listing until it&apos;s decided here. Remove deletes the
        listing, Dismiss shows it again.
      </p>
      {error && <p className="mt-2 text-sm text-bad">{error}</p>}
      {rows === null ? (
        <p className="mt-3 text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nothing waiting.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {rows.map((g) => (
            <li key={g.id} className="flex flex-wrap items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold break-words">{g.name}</p>
                <p className="text-sm text-muted">
                  {g.equipment} kinds of equipment · added {g.adds} times · {g.reports} {g.reports === 1 ? "report" : "reports"} ·{" "}
                  {Object.entries(g.reasons)
                    .map(([k, n]) => `${k} ${n}`)
                    .join(", ")}{" "}
                  · last {ago(g.lastAt)}
                  {g.hidden ? " · hidden" : ""}
                </p>
              </div>
              {admin && (
                <div className="flex flex-wrap gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => void act(g, "remove")}
                    className="press rounded-lg border border-bad/40 px-3 py-1.5 text-bad"
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => void act(g, "dismiss")}
                    className="press rounded-lg border border-line px-3 py-1.5 text-muted"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
