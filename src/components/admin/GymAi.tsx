"use client";

// AI gym cleanup on Admin › Gyms › Gym list (docs/decisions/admin-ai.md): "Fill with AI" reads one gym's own website
// and proposes its missing address, city, postcode, phone and hours for staff to check and save, and "Find
// duplicates" lists gyms in one city that look listed twice, each with a Merge button. Nothing changes until staff
// press Save or Merge; a merge goes through the same route as a reported duplicate (decidePlace in gymPlaceReports.ts).
import { useEffect, useState } from "react";

import type { DupePair, FillField, GymFill } from "@/server/aiHelpers";

import { aiBtn, AiNote, aiPost, useAiStatus } from "./Ai";

const FIELD: Record<FillField, string> = {
  address: "Address",
  city: "City",
  postcode: "Postcode",
  phone: "Phone",
  hours: "Opening hours (OpenStreetMap format)",
};
const box = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm";

/** One gym's fill: what its website gave, editable, then Save (empty fields only, unclaimed gyms only). */
export function GymFillPanel({ id, done }: { id: string; done: (note: string | null) => void }) {
  const [fill, setFill] = useState<GymFill | null>(null);
  const [vals, setVals] = useState<Partial<Record<FillField, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let live = true;
    void aiPost<{ fill: GymFill }>({ task: "gymFill", id }).then((r) => {
      if (!live) return;
      if (!r.ok) return setError(r.error);
      setFill(r.data.fill);
      setVals(r.data.fill.found);
    });
    return () => {
      live = false;
    };
  }, [id]);
  const keys = fill ? (Object.keys(fill.found) as FillField[]) : [];
  const save = async () => {
    setSaving(true);
    const r = await aiPost<{ saved: FillField[] }>({ task: "gymFillSave", id, fields: vals });
    setSaving(false);
    if (!r.ok) return setError(r.error);
    done(`Saved ${r.data.saved.map((k) => FIELD[k].split(" (")[0]!.toLowerCase()).join(", ")} for ${fill?.name ?? "the gym"}.`);
  };
  return (
    <div className="mt-3 rounded-lg border border-accent/30 bg-raised p-3 text-sm">
      {!fill && !error && <p className="text-muted">Claude is reading the gym&apos;s website…</p>}
      {error && (
        <p className="text-bad" role="alert">
          {error}
        </p>
      )}
      {fill && keys.length === 0 && (
        <p className="text-muted">The website didn&apos;t say anything that&apos;s missing.{fill.note ? ` ${fill.note}` : ""}</p>
      )}
      {fill && keys.length > 0 && (
        <form
          className="grid gap-2 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <p className="text-muted sm:col-span-2">
            From{" "}
            <a href={fill.website} target="_blank" rel="noreferrer noopener" className="underline">
              {fill.website}
            </a>
            . Check each one, clear what&apos;s wrong, then save. Only empty fields are filled.{fill.note ? ` ${fill.note}` : ""}
          </p>
          {keys.map((k) => (
            <label key={k} className="grid gap-1">
              <span className="text-muted">
                {FIELD[k]}
                {fill.now[k] ? ` (now “${fill.now[k]}”)` : ""}
              </span>
              <input className={box} value={vals[k] ?? ""} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} />
            </label>
          ))}
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button type="submit" disabled={saving} className="press rounded-lg btn-primary px-3 py-1.5 font-semibold">
              Save
            </button>
            <button type="button" onClick={() => done(null)} className="press rounded-lg border border-line px-3 py-1.5 text-muted">
              Cancel
            </button>
          </div>
        </form>
      )}
      {(error || (fill && keys.length === 0)) && (
        <button type="button" onClick={() => done(null)} className="press mt-2 rounded-lg border border-line px-3 py-1.5 text-muted">
          Close
        </button>
      )}
    </div>
  );
}

/** Likely duplicates in one city, each with Merge (the drop gym's lifters move to the kept one and its page redirects). */
export function FindDupes({ citySlug, cityLabel, changed }: { citySlug: string; cityLabel: string; changed: () => void }) {
  const ai = useAiStatus();
  const [pairs, setPairs] = useState<DupePair[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [merged, setMerged] = useState<Set<string>>(new Set());
  if (!ai?.configured) return null;
  const find = async () => {
    setBusy(true);
    setError(null);
    const r = await aiPost<{ pairs: DupePair[] }>({ task: "gymDupes", citySlug });
    setBusy(false);
    if (r.ok) setPairs(r.data.pairs);
    else setError(r.error);
  };
  const merge = async (p: DupePair) => {
    const r = await fetch("/api/admin/gyms/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ place: true, id: p.drop.id, action: "merge", into: p.keep.id }),
    }).catch(() => null);
    if (!r?.ok) return setError(((await r?.json().catch(() => ({}))) as { error?: string } | undefined)?.error ?? "The merge didn't work.");
    setMerged((m) => new Set(m).add(p.drop.id));
    changed();
  };
  return (
    <div className="mb-3 rounded-lg border border-line p-3 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={busy || !ai.ready} onClick={() => void find()} className={aiBtn}>
          {busy ? "Looking…" : `Find duplicates in ${cityLabel} with AI`}
        </button>
        <AiNote s={ai} />
      </div>
      {error && (
        <p className="mt-2 text-bad" role="alert">
          {error}
        </p>
      )}
      {pairs && pairs.length === 0 && <p className="mt-2 text-muted">No gyms here look listed twice.</p>}
      {pairs && pairs.length > 0 && (
        <ul className="mt-2 divide-y divide-line">
          {pairs.map((p) => (
            <li key={p.drop.id} className="flex flex-wrap items-start gap-3 py-2">
              <div className="min-w-0 flex-1 basis-64">
                <p>
                  <span className="font-semibold">{p.drop.name}</span>{" "}
                  <span className="text-muted">({p.drop.address || "no address"})</span> into{" "}
                  <span className="font-semibold">{p.keep.name}</span>{" "}
                  <span className="text-muted">({p.keep.address || "no address"})</span>
                </p>
                <p className="text-muted">{p.why}</p>
              </div>
              {merged.has(p.drop.id) ? (
                <span className="text-muted">Merged</span>
              ) : (
                <button type="button" onClick={() => void merge(p)} className="press rounded-lg btn-primary px-3 py-1.5 font-semibold">
                  Merge
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
