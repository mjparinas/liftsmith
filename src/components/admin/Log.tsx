"use client";

// The admin Log tab (Gradelings' change log): the latest 200 sign-ins and changes made in the panel.
import { useEffect, useState } from "react";

import { Card, Table } from "./charts";
import { when } from "./time";

type Audit = { id: number; at: number; admin: string; action: string; target: string | null; detail: string | null };

export function Log() {
  const [rows, setRows] = useState<Audit[] | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/admin/audit/")
      .then(async (r) => r.ok && live && setRows(((await r.json()) as { audit: Audit[] }).audit))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return (
    <Card title="Change log" subtitle="Every sign-in and change made in the panel, newest first.">
      {!rows ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
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
          empty="No changes yet."
        />
      )}
    </Card>
  );
}
