"use client";

// Reported gym pages (docs/decisions/gyms.md "Reporting a gym page"), on the admin Reports tab under reported listings.
// Anyone can report a real gym's page from the website or the app: wrong details, closed, listed twice, not a gym.
// Staff hide the page, merge it into the gym it duplicates (its lifters move and its page redirects), fix its details,
// or dismiss the reports. Support staff can read; only admins act.
import { useEffect, useState } from "react";

import type { PlaceReportAction, PlaceReportReason } from "@/lib/gymPlaceReport";
import type { ReportedPlace } from "@/server/gymPlaceReports";

import { Card } from "./charts";
import { Loading, RowBones } from "./Skeletons";
import { ago } from "./time";

const REASON: Record<PlaceReportReason, string> = {
  wrong: "Wrong details",
  closed: "Closed for good",
  duplicate: "Listed twice",
  notGym: "Not a gym",
  other: "Something else",
};

const box = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm";
const btn = "press rounded-lg border border-line px-3 py-1.5 text-muted";

type Open = { id: string; mode: "merge" | "edit" } | null;
type Draft = { into: string; name: string; address: string; website: string; phone: string; hours: string; kind: "gym" | "studio" };

function Row({
  g,
  admin,
  act,
}: {
  g: ReportedPlace;
  admin: boolean;
  act: (g: ReportedPlace, action: PlaceReportAction, extra?: object) => Promise<boolean>;
}) {
  const [open, setOpen] = useState<Open>(null);
  const [d, setD] = useState<Draft>({
    into: "",
    name: g.name,
    address: g.address,
    website: g.website,
    phone: g.phone,
    hours: g.hours,
    kind: g.kind,
  });
  const field = (k: Exclude<keyof Draft, "kind">, label: string) => (
    <label className="grid gap-1 text-sm">
      <span className="text-muted">{label}</span>
      <input className={box} value={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.value })} />
    </label>
  );
  const counts = g.lines.reduce<Partial<Record<PlaceReportReason, number>>>((m, l) => ({ ...m, [l.reason]: (m[l.reason] ?? 0) + 1 }), {});
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold break-words">
            <a href={`/gyms/${g.citySlug}/${g.slug}/`} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
              {g.name}
            </a>
          </p>
          <p className="text-sm text-muted break-words">
            {[g.address, [g.city, g.region].filter(Boolean).join(", ") || "No city"].filter(Boolean).join(" · ")} · {g.kind} · {g.lifters}{" "}
            {g.lifters === 1 ? "lifter" : "lifters"}
            {g.official ? " · claimed" : ""}
            {g.hidden ? " · hidden" : ""}
          </p>
          <p className="text-sm text-muted">
            {g.reports} {g.reports === 1 ? "report" : "reports"} ·{" "}
            {Object.entries(counts)
              .map(([k, n]) => `${REASON[k as PlaceReportReason]} ${n}`)
              .join(", ")}{" "}
            · last {ago(g.lastAt)}
          </p>
          {g.lines.some((l) => l.note) && (
            <ul className="mt-1 grid gap-1 text-sm">
              {g.lines
                .filter((l) => l.note)
                .map((l, i) => (
                  <li key={i} className="break-words">
                    <span className="text-muted">{REASON[l.reason]}:</span> {l.note}
                  </li>
                ))}
            </ul>
          )}
        </div>
        {admin && (
          <div className="flex flex-wrap gap-2 text-sm">
            <button type="button" onClick={() => setOpen(open?.mode === "edit" ? null : { id: g.id, mode: "edit" })} className={btn}>
              Edit
            </button>
            {!g.official && (
              <button type="button" onClick={() => setOpen(open?.mode === "merge" ? null : { id: g.id, mode: "merge" })} className={btn}>
                Merge
              </button>
            )}
            {!g.hidden && (
              <button
                type="button"
                onClick={() => void act(g, "hide")}
                className="press rounded-lg border border-bad/40 px-3 py-1.5 text-bad"
              >
                Hide
              </button>
            )}
            <button type="button" onClick={() => void act(g, "dismiss")} className={btn}>
              Dismiss
            </button>
          </div>
        )}
      </div>
      {admin && open?.mode === "merge" && (
        <form
          className="mt-3 grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void act(g, "merge", { into: d.into });
          }}
        >
          <label className="grid gap-1 text-sm">
            <span className="text-muted">
              Page address of the gym to keep (this one is hidden, its lifters move there and its page redirects)
            </span>
            <input
              className={box}
              placeholder="https://www.getliftsmith.com/gyms/…/…/"
              value={d.into}
              onChange={(e) => setD({ ...d, into: e.target.value })}
            />
          </label>
          <button type="submit" className="press justify-self-start rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink">
            Merge into that gym
          </button>
        </form>
      )}
      {admin && open?.mode === "edit" && (
        <form
          className="mt-3 grid gap-2 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void act(g, "edit", {
              name: d.name,
              address: d.address,
              website: d.website,
              phone: d.phone,
              hours: d.hours,
              kind: d.kind,
            }).then((ok) => ok && setOpen(null));
          }}
        >
          {field("name", "Name")}
          {field("address", "Address")}
          {field("website", "Website")}
          {field("phone", "Phone")}
          {field("hours", "Opening hours (OpenStreetMap format, e.g. Mo-Fr 06:00-22:00)")}
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Kind</span>
            <select className={box} value={d.kind} onChange={(e) => setD({ ...d, kind: e.target.value === "studio" ? "studio" : "gym" })}>
              <option value="gym">Gym</option>
              <option value="studio">Studio</option>
            </select>
          </label>
          <p className="text-sm text-muted sm:col-span-2">The city is fixed on the Gyms tab, which keeps the old page address working.</p>
          <button type="submit" className="press justify-self-start rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink">
            Save and close the reports
          </button>
        </form>
      )}
    </li>
  );
}

export function GymPlaceReports({ admin }: { admin: boolean }) {
  const [rows, setRows] = useState<ReportedPlace[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    fetch("/api/admin/gyms/")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const j = (await r.json()) as { places?: ReportedPlace[] };
        if (live) setRows(j.places ?? []);
      })
      .catch(() => live && setError("The gym page reports didn't load."));
    return () => {
      live = false;
    };
  }, [version]);
  const act = async (g: ReportedPlace, action: PlaceReportAction, extra: object = {}) => {
    setError(null);
    const r = await fetch("/api/admin/gyms/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ place: true, id: g.id, action, ...extra }),
    });
    if (!r.ok) {
      setError(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "That didn't work.");
      return false;
    }
    setVersion((v) => v + 1);
    return true;
  };
  return (
    <Card title="Reported gym pages">
      <p className="text-sm text-muted">
        Real gyms whose page someone reported from the website or the app. Reports never hide a page by themselves. Edit fixes the details,
        Merge sends a duplicate to the gym it copies, Hide takes the page down, Dismiss leaves it as it is.
      </p>
      {error && (
        <p className="mt-2 text-sm text-bad" role="alert">
          {error}
        </p>
      )}
      {rows === null ? (
        <Loading label="Loading reports" className="mt-3">
          <RowBones n={3} />
        </Loading>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nothing waiting.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {rows.map((g) => (
            <Row key={g.id} g={g} admin={admin} act={act} />
          ))}
        </ul>
      )}
    </Card>
  );
}
