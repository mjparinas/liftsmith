"use client";

// One install's page in the admin panel: the device and where it came from, what it did (event names and
// times from the allow-list in analyticsSchema.ts), its subscription events and store entitlement.
import { useEffect, useState } from "react";

import type { installDetail } from "@/server/adminUsers";

import { Card, fmtUsd, Table, Tile } from "./charts";
import { ago, when } from "./time";

type Detail = NonNullable<Awaited<ReturnType<typeof installDetail>>>;

export function InstallDetail({ id, close }: { id: string; close: () => void }) {
  const [d, setD] = useState<Detail | null | "missing">(null);
  useEffect(() => {
    let live = true;
    fetch(`/api/admin/installs/?id=${encodeURIComponent(id)}`)
      .then(async (r) => live && setD(r.ok ? ((await r.json()) as Detail) : "missing"))
      .catch(() => live && setD("missing"));
    return () => {
      live = false;
    };
  }, [id]);
  const closeBtn = (
    <button type="button" onClick={close} className="press rounded-lg border border-line px-3 py-1 text-sm text-muted">
      Close
    </button>
  );
  if (d === null) return <Card title="Install">Loading…</Card>;
  if (d === "missing")
    return (
      <Card title="Install" right={closeBtn}>
        <p className="text-sm text-muted">No install with that id.</p>
      </Card>
    );
  const i = d.install;
  const e = d.entitlement;
  return (
    <Card title={`Install ${i.id.slice(0, 8)}${i.test ? " (test)" : ""}`} subtitle={i.id} right={closeBtn}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="First seen" value={when(i.firstSeen)} sub={i.firstVersion ? `version ${i.firstVersion}` : undefined} />
        <Tile label="Last seen" value={ago(i.lastSeen)} sub={i.appVersion ? `version ${i.appVersion}` : undefined} />
        <Tile label="Device" value={i.device ?? i.platform} sub={[i.os, i.formFactor].filter(Boolean).join(", ")} />
        <Tile
          label="Pro"
          value={e ? (e.active ? "Active" : "Ended") : "Never"}
          sub={
            e
              ? [e.plan, e.store, e.family ? "family share" : null, e.expiresAt ? `until ${when(e.expiresAt)}` : null]
                  .filter(Boolean)
                  .join(", ")
              : undefined
          }
        />
      </div>
      <p className="mt-3 text-sm text-muted">
        {[i.country, i.locale, i.timeZone].filter(Boolean).join(" · ")}
        {i.source ? ` · came from ${i.source}` : ""}
        {i.landing ? ` · landed on ${i.landing}` : ""}
        {d.creator ? ` · creator code ${d.creator.code}` : ""}
      </p>
      <h3 className="mt-4 text-sm font-semibold">What it did</h3>
      <Table columns={["Event", "Times", "Last"]} rows={d.counts.map((c) => [c.name, c.n, ago(c.last)])} empty="No events." />
      <h3 className="mt-4 text-sm font-semibold">Subscription events</h3>
      <Table
        columns={["When", "Store", "Kind", "Plan", "USD", "From"]}
        rows={d.subs.map((s) => [
          when(s.at),
          s.store,
          s.reason ? `${s.kind} (${s.reason})` : s.kind,
          s.plan ?? "—",
          fmtUsd(s.usd, 2),
          s.source,
        ])}
        empty="None."
      />
      <h3 className="mt-4 text-sm font-semibold">Latest events</h3>
      <Table
        columns={["When", "Event", "Version", "Details"]}
        rows={d.recent.map((r) => [
          when(r.at),
          r.name,
          r.appVersion ?? "",
          <code key="p" className="break-all text-xs text-muted">
            {r.props ?? ""}
          </code>,
        ])}
      />
    </Card>
  );
}
