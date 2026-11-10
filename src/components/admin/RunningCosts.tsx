"use client";

// The Revenue tab's running costs and profit (src/lib/runningCosts.ts, /api/admin/costs/). Admins edit the list;
// support staff see the totals.
import { useEffect, useState } from "react";

import { COST_LIMITS, profit, type RunningCost } from "@/lib/runningCosts";

import { Card, fmtUsd, Tile } from "./charts";

/** A starting list, so the first edit isn't a blank page. Amounts are left at 0 to fill in. */
const SUGGESTED: RunningCost[] = [
  "Vercel",
  "Turso",
  "Resend",
  "RevenueCat",
  "Apple Developer (yearly, ÷ 12)",
  "Google Play (one-off)",
  "Anthropic (AI drafts)",
].map((name) => ({ name, monthly: 0 }));

export function RunningCosts({ admin, netMrr }: { admin: boolean; netMrr: number }) {
  const [list, setList] = useState<RunningCost[] | null>(null);
  const [draft, setDraft] = useState<{ name: string; monthly: string }[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/admin/costs/")
      .then(async (r) => r.ok && live && setList(((await r.json()) as { costs: RunningCost[] }).costs))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  if (!list) return null;
  const p = profit(netMrr, list);
  const edit = () => setDraft((list.length ? list : SUGGESTED).map((c) => ({ name: c.name, monthly: String(c.monthly) })));
  const save = async () => {
    if (!draft) return;
    const costs = draft.filter((c) => c.name.trim()).map((c) => ({ name: c.name, monthly: Number(c.monthly) || 0 }));
    const r = await fetch("/api/admin/costs/", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ costs }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) return setMsg(j.error ?? "That didn't save.");
    setList(costs);
    setDraft(null);
    setMsg("Saved.");
  };
  return (
    <Card title="Running costs and profit" subtitle="What the business pays each month, against net MRR. Enter a yearly fee as a twelfth.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Running costs" value={fmtUsd(p.costs, 2)} sub="a month" />
        <Tile label="Profit" value={fmtUsd(p.monthly, 2)} sub="a month, net MRR less costs" />
        <Tile label="Profit a year" value={fmtUsd(p.yearly)} sub="at today's net MRR" />
        <Tile label="Costs covered" value={p.covered == null ? "—" : `${Math.round(p.covered * 100)}%`} sub="net MRR ÷ costs" />
      </div>
      {!draft && list.length > 0 && (
        <ul className="mt-3 divide-y divide-line/60 text-sm">
          {list.map((c) => (
            <li key={c.name} className="flex justify-between py-1.5">
              <span>{c.name}</span>
              <span className="tabular-nums">{fmtUsd(c.monthly, 2)}</span>
            </li>
          ))}
        </ul>
      )}
      {!draft && !list.length && <p className="mt-3 text-sm text-muted">No costs entered yet, so profit is the same as net MRR.</p>}
      {admin && !draft && (
        <button type="button" className="press mt-3 rounded-lg border border-line px-3 py-1.5 text-sm" onClick={edit}>
          Edit costs
        </button>
      )}
      {draft && (
        <div className="mt-3 space-y-2 text-sm">
          {draft.map((c, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2">
              <label className="block min-w-48 flex-1">
                <span className="block text-xs text-muted">What</span>
                <input
                  value={c.name}
                  maxLength={COST_LIMITS.name}
                  onChange={(e) => setDraft(draft.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  className="card mt-1 w-full px-2 py-1.5"
                />
              </label>
              <label className="block">
                <span className="block text-xs text-muted">$ a month</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={c.monthly}
                  onChange={(e) => setDraft(draft.map((x, j) => (j === i ? { ...x, monthly: e.target.value } : x)))}
                  className="card mt-1 w-28 px-2 py-1.5"
                />
              </label>
              <button type="button" className="pb-2 text-xs text-muted underline" onClick={() => setDraft(draft.filter((_, j) => j !== i))}>
                Remove
              </button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            {draft.length < COST_LIMITS.count && (
              <button
                type="button"
                className="press rounded-lg border border-line px-3 py-1.5"
                onClick={() => setDraft([...draft, { name: "", monthly: "0" }])}
              >
                Add a cost
              </button>
            )}
            <button
              type="button"
              className="press rounded-lg bg-accent px-3 py-1.5 font-semibold text-accent-ink"
              onClick={() => void save()}
            >
              Save costs
            </button>
            <button type="button" className="press rounded-lg border border-line px-3 py-1.5" onClick={() => setDraft(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {msg && (
        <p role="status" className="mt-2 text-sm text-muted">
          {msg}
        </p>
      )}
    </Card>
  );
}
