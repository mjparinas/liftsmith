"use client";

// High school coaches waiting for staff (docs/decisions/school-teams.md), at the top of the admin Users tab. A coach
// lands here when they proved an address at a domain we don't know is a school yet. Check the domain is the school's
// (or its district's) on the school's own website, then approve, which trusts the domain for every coach there, or
// reject. Block stops the whole domain (a company, a university, a domain anyone can get an address at).
import { useEffect, useState } from "react";

import type { SchoolReview } from "@/server/teams";

import { Card } from "./charts";
import { ago } from "./time";

export function SchoolCoaches({ admin }: { admin: boolean }) {
  const [rows, setRows] = useState<SchoolReview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    fetch("/api/admin/schools/")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const j = (await r.json()) as { coaches: SchoolReview[] };
        if (live) setRows(j.coaches);
      })
      .catch(() => live && setError("The school coaches didn't load."));
    return () => {
      live = false;
    };
  }, [version]);
  const act = async (c: SchoolReview, action: "approve" | "reject" | "block") => {
    const r = await fetch("/api/admin/schools/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.accountId, action }),
    });
    if (!r.ok) setError(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "That didn't work.");
    setVersion((v) => v + 1);
  };
  const waiting = rows?.filter((c) => c.status === "pending") ?? [];
  const decided = rows?.filter((c) => c.status !== "pending") ?? [];
  if (rows && rows.length === 0) return null;
  return (
    <Card title="School coaches" subtitle={rows ? `${waiting.length} waiting` : undefined}>
      <p className="text-sm text-muted">
        High school coaches get Pro free, and so do their athletes aged 13 to 18. These proved an address at a domain we don&apos;t know
        yet. Check it&apos;s the school&apos;s or its district&apos;s on the school&apos;s own website. Approving trusts the domain for
        every coach there.
      </p>
      {error && <p className="mt-2 text-sm text-bad">{error}</p>}
      {rows === null ? (
        <p className="mt-3 text-sm text-muted">Loading…</p>
      ) : waiting.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nothing waiting.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {waiting.map((c) => (
            <li key={c.accountId} className="flex flex-wrap items-start gap-3 py-3">
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold break-words">{c.school}</p>
                <p className="break-words">
                  {c.email} · {c.domain}
                </p>
                <p className="text-xs text-faint">{c.verifiedAt ? `Address proven ${ago(c.verifiedAt)}` : ""}</p>
              </div>
              {admin && (
                <div className="flex flex-wrap gap-2 text-sm">
                  <button
                    type="button"
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
                  <button
                    type="button"
                    onClick={() => void act(c, "block")}
                    className="press rounded-lg border border-bad/50 px-3 py-1.5 text-bad"
                  >
                    Block domain
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {decided.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-muted">Coaches ({decided.length})</summary>
          <ul className="mt-2 grid gap-1">
            {decided.map((c) => (
              <li key={c.accountId} className="text-muted">
                {c.school} ({c.domain}): {c.status}, {c.teams} teams, {c.athletes} athletes
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}
