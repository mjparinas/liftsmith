"use client";

// The admin Flags and A/B Tests tabs (Gradelings' feature flags and experiments, on Liftsmith's value flags in
// src/lib/flags.ts). Flags: set a value for everyone or a share of installs, or go back to the default. Tests:
// draft, start, read the results and verdict, stop with a winner, delete. Support staff can look; admins change.
import { useCallback, useEffect, useState } from "react";

import type { Experiment } from "@/lib/experiments";
import type { ExperimentResults } from "@/server/flags";

import { Card, fmtInt, fmtPct, Table } from "./charts";
import { ago, when } from "./time";

type Value = string | number | boolean;
type FlagRow = {
  name: string;
  label: string;
  description: string;
  default: Value;
  options: Value[];
  state: { value: Value; rollout: number; updatedAt: number; updatedBy: string } | null;
  experiment: "running" | "stopped" | null;
};
type Exp = Experiment & { results: ExperimentResults };

const show = (v: Value) => (typeof v === "boolean" ? (v ? "On" : "Off") : String(v));
const parse = (s: string, options: Value[]) => options.find((o) => String(o) === s);

async function post(url: string, body: Record<string, unknown>): Promise<string | null> {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = (await r.json().catch(() => ({}))) as { error?: string };
  return r.ok ? null : (j.error ?? "That didn't work.");
}

function useLoad<T>(url: string): [T | null, () => void] {
  const [data, setData] = useState<T | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    fetch(url)
      .then(async (r) => r.ok && live && setData((await r.json()) as T))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [url, version]);
  return [data, useCallback(() => setVersion((v) => v + 1), [])];
}

function FlagCard({ f, admin, changed }: { f: FlagRow; admin: boolean; changed: () => void }) {
  const [value, setValue] = useState(String(f.state?.value ?? f.default));
  const [rollout, setRollout] = useState(String(f.state?.rollout ?? 100));
  const [msg, setMsg] = useState<string | null>(null);
  const save = async (body: Record<string, unknown>) => {
    const err = await post("/api/admin/flags/", { name: f.name, ...body });
    setMsg(err ?? "Saved. Apps pick it up next time they open.");
    if (!err) changed();
  };
  const now = f.state
    ? f.state.rollout >= 100
      ? `${show(f.state.value)} for everyone`
      : `${show(f.state.value)} for ${f.state.rollout}% of installs, ${show(f.default)} for the rest`
    : `${show(f.default)} (the default)`;
  return (
    <Card title={f.label} subtitle={f.description}>
      <p className="text-sm">
        Now: <strong>{now}</strong>
        {f.state && (
          <span className="text-muted">
            {" "}
            · changed by {f.state.updatedBy} {ago(f.state.updatedAt)}
          </span>
        )}
      </p>
      {f.experiment && (
        <p className="mt-1 text-sm text-warn">An A/B test on this flag is {f.experiment}, so the test decides what installs get.</p>
      )}
      {admin && (
        <div className="mt-3 flex flex-wrap items-end gap-3 text-sm">
          <label className="block">
            <span className="block text-xs text-muted">Value</span>
            <select value={value} onChange={(e) => setValue(e.target.value)} className="card mt-1 px-2 py-1.5">
              {f.options.map((o) => (
                <option key={String(o)} value={String(o)}>
                  {show(o)}
                  {o === f.default ? " (default)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs text-muted">Share of installs (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={rollout}
              onChange={(e) => setRollout(e.target.value)}
              className="card mt-1 w-24 px-2 py-1.5"
            />
          </label>
          <button
            type="button"
            className="press rounded-lg bg-accent px-3 py-1.5 font-semibold text-accent-ink"
            onClick={() => void save({ value: parse(value, f.options), rollout: Number(rollout) })}
          >
            Save
          </button>
          {f.state && (
            <button type="button" className="press rounded-lg border border-line px-3 py-1.5" onClick={() => void save({ reset: true })}>
              Back to the default
            </button>
          )}
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

export function Flags({ admin }: { admin: boolean }) {
  const [data, reload] = useLoad<{ flags: FlagRow[] }>("/api/admin/flags/");
  if (!data) return <p className="text-muted">Loading…</p>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Flags are defined in code (src/lib/flags.ts), so only switches that exist show here. Apps read them when they open and when they
        come back to the front, and keep the last answer offline. A partial rollout picks installs by a stable hash, so raising it only adds
        installs. Installs with usage stats off get the default.
      </p>
      {data.flags.map((f) => (
        <FlagCard key={`${f.name}:${f.state?.updatedAt ?? 0}`} f={f} admin={admin} changed={reload} />
      ))}
    </div>
  );
}

const pText = (p: number | null) => (p == null ? "—" : p < 0.001 ? "<0.001" : p.toFixed(3));

function ExperimentCard({ e, admin, changed }: { e: Exp; admin: boolean; changed: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const act = async (body: Record<string, unknown>) => {
    const err = await post("/api/admin/experiments/", { flag: e.flag, ...body });
    setMsg(err);
    if (!err) changed();
  };
  const r = e.results;
  const status =
    e.status === "draft"
      ? "Draft: everyone sees the control and nothing is counted."
      : e.status === "running"
        ? `Running since ${when(e.startedAt ?? 0)}.`
        : `Stopped ${when(e.stoppedAt ?? 0)}: everyone gets ${show(e.winner ?? e.variants[0]?.value ?? "")}.`;
  return (
    <Card title={`Test: ${e.flag}`} subtitle={e.description || undefined}>
      <p className="text-sm">{status}</p>
      <Table
        columns={["Variant", "Weight", "Installs", "Started a trial", "p", "Paid", "p", "Worked out this week", "p"]}
        rows={r.rows.map((x, i) => [
          `${show(x.variant)}${i === 0 ? " (control)" : ""}`,
          e.variants[i]?.weight ?? "",
          fmtInt(x.installs),
          `${fmtInt(x.trials)} (${fmtPct(x.installs ? x.trials / x.installs : null, 0)})`,
          pText(x.pTrials),
          `${fmtInt(x.paid)} (${fmtPct(x.installs ? x.paid / x.installs : null, 0)})`,
          pText(x.pPaid),
          `${fmtInt(x.active)} (${fmtPct(x.installs ? x.active / x.installs : null, 0)})`,
          pText(x.pActive),
        ])}
      />
      {e.status !== "draft" && (
        <div className="mt-3 space-y-1 text-sm">
          <p>
            <strong>Paying:</strong> {r.verdict.message}
          </p>
          <p>
            <strong>Trials:</strong> {r.trialVerdict.message}
          </p>
          <p className="text-xs text-muted">A p-value under 0.05 is unlikely to be chance. With small groups, wait for more installs.</p>
        </div>
      )}
      {admin && (
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {e.status === "draft" && (
            <button
              type="button"
              className="press rounded-lg bg-accent px-3 py-1.5 font-semibold text-accent-ink"
              onClick={() => void act({ action: "start" })}
            >
              Start the test
            </button>
          )}
          {e.status === "running" &&
            e.variants.map((v) => (
              <button
                key={String(v.value)}
                type="button"
                className={`press rounded-lg px-3 py-1.5 ${r.verdict.ready && r.verdict.leader === v.value ? "bg-accent font-semibold text-accent-ink" : "border border-line"}`}
                onClick={() => void act({ action: "stop", winner: v.value })}
              >
                Use {show(v.value)} for everyone
              </button>
            ))}
          {e.status !== "running" && (
            <button
              type="button"
              className="press rounded-lg border border-line px-3 py-1.5 text-muted"
              onClick={() => void act({ action: "delete" })}
            >
              Delete the test
            </button>
          )}
        </div>
      )}
      {msg && (
        <p role="status" className="mt-2 text-sm text-bad">
          {msg}
        </p>
      )}
    </Card>
  );
}

function NewExperiment({ flags, taken, changed }: { flags: FlagRow[]; taken: Set<string>; changed: () => void }) {
  const free = flags.filter((f) => !taken.has(f.name));
  const [name, setName] = useState(free[0]?.name ?? "");
  const [description, setDescription] = useState("");
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const f = free.find((x) => x.name === name);
  if (!f) return null;
  // The default is the control, so it goes first.
  const options = [f.default, ...f.options.filter((o) => o !== f.default)];
  const create = async () => {
    const variants = options.map((o) => ({ value: o, weight: Number(weights[String(o)] ?? 50) })).filter((v) => v.weight > 0);
    const err = await post("/api/admin/experiments/", { action: "create", flag: f.name, description, variants });
    setMsg(err);
    if (!err) {
      setDescription("");
      changed();
    }
  };
  return (
    <Card title="New test" subtitle="A test splits installs between a flag's values. The default is the control. It starts as a draft.">
      <div className="flex flex-wrap items-end gap-3 text-sm">
        <label className="block">
          <span className="block text-xs text-muted">Flag</span>
          <select value={name} onChange={(e) => setName(e.target.value)} className="card mt-1 px-2 py-1.5">
            {free.map((x) => (
              <option key={x.name} value={x.name}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
        {options.map((o) => (
          <label key={String(o)} className="block">
            <span className="block text-xs text-muted">Weight for {show(o)}</span>
            <input
              type="number"
              min={0}
              max={100}
              value={weights[String(o)] ?? "50"}
              onChange={(e) => setWeights((w) => ({ ...w, [String(o)]: e.target.value }))}
              className="card mt-1 w-20 px-2 py-1.5"
            />
          </label>
        ))}
        <label className="block min-w-60 flex-1">
          <span className="block text-xs text-muted">What it tests</span>
          <input
            value={description}
            maxLength={300}
            onChange={(e) => setDescription(e.target.value)}
            className="card mt-1 w-full px-2 py-1.5"
          />
        </label>
        <button
          type="button"
          className="press rounded-lg bg-accent px-3 py-1.5 font-semibold text-accent-ink"
          onClick={() => void create()}
        >
          Create draft
        </button>
      </div>
      {msg && (
        <p role="status" className="mt-2 text-sm text-bad">
          {msg}
        </p>
      )}
    </Card>
  );
}

export function Experiments({ admin }: { admin: boolean }) {
  const [data, reload] = useLoad<{ experiments: Exp[] }>("/api/admin/experiments/");
  const [flags] = useLoad<{ flags: FlagRow[] }>("/api/admin/flags/");
  if (!data) return <p className="text-muted">Loading…</p>;
  return (
    <div className="space-y-4">
      {admin && flags && <NewExperiment flags={flags.flags} taken={new Set(data.experiments.map((e) => e.flag))} changed={reload} />}
      {data.experiments.length ? (
        data.experiments.map((e) => <ExperimentCard key={e.flag} e={e} admin={admin} changed={reload} />)
      ) : (
        <p className="text-sm text-muted">No tests yet.</p>
      )}
      <p className="text-xs text-muted">
        Installs are counted from the first time they ask for flags during a running test, and only installs that send usage stats. Started
        a trial and Paid count only after joining the test; Worked out this week counts a finished workout in the last 7 days. The verdict
        needs 30 installs in each variant.
      </p>
    </div>
  );
}
