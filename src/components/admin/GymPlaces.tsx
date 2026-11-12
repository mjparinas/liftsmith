"use client";

// The admin Gyms tab (docs/decisions/gyms.md): seed a city's gyms from OpenStreetMap, then tidy the list (a studio
// marked as a gym, a closed gym to hide). Support staff can read; only admins import or change a gym.
import { useEffect, useState } from "react";

import type { AdminPlace, PlaceAction } from "@/server/gymPlaces";

import { Card } from "./charts";

type Data = { places: AdminPlace[]; total: number; official: number };

export function GymPlaces({ admin }: { admin: boolean }) {
  const [data, setData] = useState<Data | null>(null);
  const [q, setQ] = useState("");
  const [where, setWhere] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      fetch(`/api/admin/gym-places/?q=${encodeURIComponent(q)}`)
        .then(async (r) => {
          if (!r.ok) throw new Error();
          const j = (await r.json()) as Data;
          if (live) setData(j);
        })
        .catch(() => live && setNote("The gym list didn't load."));
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, version]);
  const post = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/admin/gym-places/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string; area?: string; found?: number; added?: number; updated?: number };
    setVersion((v) => v + 1);
    return r.ok ? j : { error: j.error ?? "That didn't work." };
  };
  const importArea = async () => {
    if (!where.trim()) return;
    setBusy(true);
    setNote("Asking OpenStreetMap…");
    const j = await post({ action: "import", where });
    setBusy(false);
    setNote(j.error ?? `${j.area}: found ${j.found} named gyms and studios, ${j.added} new, ${j.updated} refreshed.`);
  };
  const act = (p: AdminPlace, action: PlaceAction) => void post({ id: p.id, action }).then((j) => j.error && setNote(j.error));
  return (
    <div className="grid gap-4">
      <Card title="Add a city's gyms">
        <p className="text-sm text-muted">
          Pulls every named fitness centre in an area from OpenStreetMap. They show in Find gyms near you as unofficial gyms until an owner
          claims one. Running it again refreshes unclaimed gyms and never touches a claimed one. Yoga, pilates, martial arts and similar
          places are marked as studios, which the finder leaves out.
        </p>
        {admin && (
          <form
            className="mt-3 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void importArea();
            }}
          >
            <label className="sr-only" htmlFor="gym-area">
              City
            </label>
            <input
              id="gym-area"
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              placeholder="Langley, BC"
              className="min-w-0 flex-1 rounded-lg border border-line bg-raised px-3 py-2"
            />
            <button type="submit" disabled={busy} className="press btn-primary rounded-lg px-4 py-2 font-semibold">
              {busy ? "Importing…" : "Import"}
            </button>
          </form>
        )}
        {note && (
          <p className="mt-2 text-sm text-muted" role="status">
            {note}
          </p>
        )}
        <p className="mt-2 text-xs text-faint">Gym data © OpenStreetMap contributors, under the Open Database Licence.</p>
      </Card>

      <Card
        title="Gyms"
        subtitle={data ? `${data.total} in all, ${data.official} official` : undefined}
        right={
          <input
            aria-label="Search gyms"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="w-40 rounded-lg border border-line bg-raised px-3 py-1.5 text-sm"
          />
        }
      >
        {data === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : data.places.length === 0 ? (
          <p className="text-sm text-muted">No gyms yet. Import a city above.</p>
        ) : (
          <ul className="divide-y divide-line">
            {data.places.map((p) => (
              <li key={p.id} className={`flex flex-wrap items-start gap-3 py-3 ${p.hidden ? "opacity-60" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold break-words">
                    {p.name}
                    {p.official ? " ✓" : ""}
                  </p>
                  <p className="text-sm text-muted">
                    {[p.address, [p.city, p.region].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
                  </p>
                  <p className="text-xs text-faint">
                    {p.kind} · {p.official ? "official" : "unofficial"} · {p.lifters} {p.lifters === 1 ? "lifter" : "lifters"} · {p.setups}{" "}
                    {p.setups === 1 ? "setup" : "setups"} listed{p.hasKit ? "" : " · no equipment yet"}
                    {p.hidden ? " · hidden" : ""}
                  </p>
                </div>
                {admin && (
                  <div className="flex flex-wrap gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => act(p, p.kind === "gym" ? "studio" : "gym")}
                      className="press rounded-lg border border-line px-3 py-1.5 text-muted"
                    >
                      {p.kind === "gym" ? "Mark studio" : "Mark gym"}
                    </button>
                    <button
                      type="button"
                      onClick={() => act(p, p.hidden ? "show" : "hide")}
                      className="press rounded-lg border border-line px-3 py-1.5 text-muted"
                    >
                      {p.hidden ? "Show" : "Hide"}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
