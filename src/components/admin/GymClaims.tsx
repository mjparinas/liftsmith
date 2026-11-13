"use client";

// Gym claims waiting for staff (docs/decisions/gyms.md, step 3), at the top of the admin Gyms tab. A claim lands here
// when the owner's email isn't at the gym's own website domain. Check it (call the gym's listed phone and ask for the
// person by name, say), then approve or reject. Claims by emailed code or poster code are shown for the record.
import { useEffect, useState } from "react";

import type { ClaimRow } from "@/server/gymClaims";

import { Card } from "./charts";
import { Loading, RowBones } from "./Skeletons";
import { ago } from "./time";

export function GymClaims({ admin }: { admin: boolean }) {
  const [rows, setRows] = useState<ClaimRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    fetch("/api/admin/gym-claims/")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const j = (await r.json()) as { claims: ClaimRow[] };
        if (live) setRows(j.claims);
      })
      .catch(() => live && setError("The gym claims didn't load."));
    return () => {
      live = false;
    };
  }, [version]);
  const act = async (c: ClaimRow, action: "approve" | "reject") => {
    const r = await fetch("/api/admin/gym-claims/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, action }),
    });
    if (!r.ok) setError(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "That didn't work.");
    setVersion((v) => v + 1);
  };
  const waiting = rows?.filter((c) => c.status === "pending") ?? [];
  const recent = rows?.filter((c) => c.status !== "pending") ?? [];
  return (
    <Card title="Gym claims" subtitle={rows ? `${waiting.length} waiting` : undefined}>
      <p className="text-sm text-muted">
        Owners whose email isn&apos;t at the gym&apos;s own website. Check before approving: call the gym&apos;s listed phone and ask for
        them by name, or look for them on the gym&apos;s website. Approving makes the gym official and theirs to edit.
      </p>
      {error && <p className="mt-2 text-sm text-bad">{error}</p>}
      {rows === null ? (
        <Loading label="Loading claims" className="mt-3">
          <RowBones n={3} />
        </Loading>
      ) : waiting.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nothing waiting.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {waiting.map((c) => (
            <li key={c.id} className="flex flex-wrap items-start gap-3 py-3">
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold break-words">
                  {c.placeName} · {c.city}
                  {c.taken ? " · already has an owner" : ""}
                </p>
                <p className="break-words">
                  {c.name} ({c.role}) · {c.email}
                  {c.phone ? ` · ${c.phone}` : ""}
                </p>
                {c.note && <p className="break-words text-muted">“{c.note}”</p>}
                <p className="text-xs text-faint">
                  Gym&apos;s listed contact: {[c.placePhone, c.placeWebsite].filter(Boolean).join(" · ") || "none"} · {ago(c.createdAt)}
                </p>
              </div>
              {admin && (
                <div className="flex flex-wrap gap-2 text-sm">
                  <button
                    type="button"
                    disabled={c.taken}
                    onClick={() => void act(c, "approve")}
                    className="press rounded-lg border border-accent/50 px-3 py-1.5 text-accent"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void act(c, "reject")}
                    className="press rounded-lg border border-line px-3 py-1.5 text-muted"
                  >
                    Reject
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {recent.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-muted">Last 30 days ({recent.length})</summary>
          <ul className="mt-2 grid gap-1">
            {recent.map((c) => (
              <li key={c.id} className="text-muted">
                {c.placeName}: {c.status} by {c.method}
                {c.email ? ` (${c.email})` : ""} · {ago(c.createdAt)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}
