"use client";

// The admin Flags tab (Gradelings' feature flags, on Liftsmith's value flags in src/lib/flags.ts): set a value for
// everyone or a share of installs, or go back to the default. Support staff can look; admins change. The A/B Tests
// tab was removed on 2026-11-15 (Melvin).
import { useCallback, useEffect, useState } from "react";

import { Card } from "./charts";
import { CardBones, Loading } from "./Skeletons";
import { ago } from "./time";

type Value = string | number | boolean;
type FlagRow = {
  name: string;
  label: string;
  description: string;
  default: Value;
  options: Value[];
  /** Set for a flag typed as a dollar amount (aiDailyCap) instead of picked from `options`. */
  amount: { min: number; max: number; confirmAbove: number } | null;
  state: { value: Value; rollout: number; updatedAt: number; updatedBy: string } | null;
};

const show = (v: Value) => (typeof v === "boolean" ? (v ? "On" : "Off") : String(v));
const parse = (s: string, options: Value[]) => options.find((o) => String(o) === s);
const money = (n: number) => "$" + (Number.isInteger(n) ? String(n) : n.toFixed(2));

/** A typed dollar amount: a number from min to max with at most two decimals ("$5", "2.50"), else why not. */
export function readAmount(text: string, a: { min: number; max: number }): { value: number } | { error: string } {
  const t = text.trim().replace(/^\$/, "").trim();
  if (!/^\d+(\.\d{1,2})?$|^\.\d{1,2}$/.test(t)) return { error: "Enter a dollar amount, like 2 or 2.50." };
  const value = Number(t);
  if (value < a.min) return { error: "Enter an amount above $0." };
  if (value > a.max) return { error: "The most is " + money(a.max) + " a day." };
  return { value };
}

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

/** One flag as a compact row: what it is and what it's set to, with the controls beside it. */
function FlagLine({ f, admin, changed }: { f: FlagRow; admin: boolean; changed: () => void }) {
  const was = { value: String(f.state?.value ?? f.default), rollout: String(f.state?.rollout ?? 100) };
  const [value, setValue] = useState(was.value);
  const [rollout, setRollout] = useState(was.rollout);
  const [msg, setMsg] = useState<string | null>(null);
  // An amount over the flag's limit waits here for "Yes, save" (Melvin, 2026-11-19: over $50 asks "Are you sure?").
  const [confirm, setConfirm] = useState<number | null>(null);
  const typed = f.amount ? readAmount(value, f.amount) : null;
  const dirty = (typed && "value" in typed ? String(typed.value) !== was.value : value !== was.value) || rollout !== was.rollout;
  const save = async (body: Record<string, unknown>) => {
    const err = await post("/api/admin/flags/", { name: f.name, ...body });
    setConfirm(null);
    setMsg(err ?? (f.amount ? "Saved." : "Saved. Apps pick it up next time they open."));
    if (!err) changed();
  };
  const saveAmount = () => {
    if (!typed) return;
    if ("error" in typed) return setMsg(typed.error);
    if (f.amount && typed.value > f.amount.confirmAbove) return setConfirm(typed.value);
    void save({ value: typed.value, rollout: 100 });
  };
  const now = f.amount
    ? f.state
      ? money(Number(f.state.value)) + " a day"
      : money(Number(f.default)) + " a day (default)"
    : f.state
      ? f.state.rollout >= 100
        ? `${show(f.state.value)} for everyone`
        : `${show(f.state.value)} for ${f.state.rollout}%, ${show(f.default)} for the rest`
      : `${show(f.default)} (default)`;
  const id = `flag-${f.name}`;
  return (
    <li className="flex flex-wrap items-start gap-x-4 gap-y-2 py-3">
      <div className="min-w-0 flex-1 basis-72">
        <p className="font-semibold" id={id}>
          {f.label.replace(/^Labs: /, "")}
          <span className={`ml-2 text-sm font-normal ${f.state ? "text-accent" : "text-muted"}`}>{now}</span>
        </p>
        <p className="text-sm text-muted">{f.description}</p>
        {f.state && (
          <p className="text-xs text-faint">
            Changed by {f.state.updatedBy} {ago(f.state.updatedAt)}
          </p>
        )}
        {msg && (
          <p role="status" className="mt-1 text-sm text-muted">
            {msg}
          </p>
        )}
      </div>
      {admin && f.amount && (
        <div className="flex flex-wrap items-center gap-2 text-sm" role="group" aria-labelledby={id}>
          {confirm === null ? (
            <>
              <span className="flex items-center gap-1 text-muted">
                <span aria-hidden>$</span>
                <input
                  aria-label="Amount in US dollars a day"
                  id={`${id}-v`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setMsg(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && dirty && saveAmount()}
                  aria-invalid={typed !== null && "error" in typed}
                  className="card w-24 px-2 py-1.5 text-ink"
                />
                <span aria-hidden>a day</span>
              </span>
              <button
                type="button"
                disabled={!dirty}
                className="press rounded-lg btn-primary px-3 py-1.5 font-semibold disabled:opacity-40"
                onClick={saveAmount}
              >
                Save
              </button>
              {f.state && (
                <button
                  type="button"
                  className="press rounded-lg border border-line px-3 py-1.5"
                  onClick={() => void save({ reset: true })}
                >
                  Reset
                </button>
              )}
            </>
          ) : (
            <div role="alertdialog" aria-labelledby={`${id}-sure`} className="flex flex-wrap items-center gap-2">
              <p id={`${id}-sure`} className="font-semibold text-warn">
                Are you sure? {money(confirm)} a day is more than {money(f.amount.confirmAbove)}.
              </p>
              <button
                type="button"
                className="press rounded-lg btn-primary px-3 py-1.5 font-semibold"
                onClick={() => void save({ value: confirm, rollout: 100 })}
              >
                Yes, save
              </button>
              <button type="button" className="press rounded-lg border border-line px-3 py-1.5" onClick={() => setConfirm(null)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
      {admin && !f.amount && (
        <div className="flex flex-wrap items-center gap-2 text-sm" role="group" aria-labelledby={id}>
          <label className="sr-only" htmlFor={`${id}-v`}>
            Value
          </label>
          <select id={`${id}-v`} value={value} onChange={(e) => setValue(e.target.value)} className="card px-2 py-1.5">
            {f.options.map((o) => (
              <option key={String(o)} value={String(o)}>
                {show(o)}
                {o === f.default ? " (default)" : ""}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-muted" htmlFor={`${id}-r`}>
            for
            <input
              id={`${id}-r`}
              type="number"
              min={0}
              max={100}
              value={rollout}
              onChange={(e) => setRollout(e.target.value)}
              className="card w-16 px-2 py-1.5 text-ink"
            />
            % of installs
          </label>
          <button
            type="button"
            disabled={!dirty}
            className="press rounded-lg btn-primary px-3 py-1.5 font-semibold disabled:opacity-40"
            onClick={() => void save({ value: parse(value, f.options), rollout: Number(rollout) })}
          >
            Save
          </button>
          {f.state && (
            <button type="button" className="press rounded-lg border border-line px-3 py-1.5" onClick={() => void save({ reset: true })}>
              Reset
            </button>
          )}
        </div>
      )}
    </li>
  );
}

export function Flags({ admin }: { admin: boolean }) {
  const [data, reload] = useLoad<{ flags: FlagRow[] }>("/api/admin/flags/");
  if (!data)
    return (
      <Loading label="Loading flags">
        <CardBones body="rows" />
      </Loading>
    );
  // Changed flags first, since they're what's different from the code; then the app's own, then Labs together.
  const isLab = (f: FlagRow) => f.label.startsWith("Labs:");
  const groups: [string, string, FlagRow[]][] = [
    ["Changed from the default", "Set here for everyone or a share of installs.", data.flags.filter((f) => f.state)],
    ["App", "Switches for features in the app.", data.flags.filter((f) => !f.state && !isLab(f))],
    [
      "Labs",
      "Experiments Pro lifters switch on in Settings › Labs. Turning one on here turns it on for every Pro lifter.",
      data.flags.filter((f) => !f.state && isLab(f)),
    ],
  ];
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Flags are defined in code (src/lib/flags.ts), so only switches that exist show here. Apps read them when they open and when they
        come back to the front, and keep the last answer offline. A partial rollout picks installs by a stable hash, so raising it only adds
        installs. Installs with usage stats off get the default.
      </p>
      {groups
        .filter(([, , xs]) => xs.length)
        .map(([title, subtitle, xs]) => (
          <Card key={title} title={`${title} (${xs.length})`} subtitle={subtitle}>
            <ul className="divide-y divide-line">
              {xs.map((f) => (
                <FlagLine key={`${f.name}:${f.state?.updatedAt ?? 0}`} f={f} admin={admin} changed={reload} />
              ))}
            </ul>
          </Card>
        ))}
    </div>
  );
}
