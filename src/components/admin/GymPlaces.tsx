"use client";

// The admin Gyms tab (docs/decisions/gyms.md): seed a city's gyms from OpenStreetMap, then tidy the list (a studio
// marked as a gym, a closed gym to hide). Support staff can read; only admins import or change a gym.
import { useEffect, useRef, useState } from "react";

import type { AdminPlace, AdminPlaceList, PlaceAction } from "@/server/gymPlaces";

import { Card } from "./charts";
import { GymClaims } from "./GymClaims";
import { GymPosters } from "./GymPosters";

export function GymPlaces({ admin }: { admin: boolean }) {
  const [data, setData] = useState<(AdminPlaceList & { pending: AdminPlace[] }) | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [where, setWhere] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [ordering, setOrdering] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      fetch(`/api/admin/gym-places/?q=${encodeURIComponent(q)}&page=${page}`)
        .then(async (r) => {
          if (!r.ok) throw new Error();
          const j = (await r.json()) as AdminPlaceList & { pending: AdminPlace[] };
          if (live) setData(j);
        })
        .catch(() => live && setNote("The gym list didn't load."));
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, page, version]);
  const post = async (body: Record<string, unknown>, url = "/api/admin/gym-places/") => {
    const r = await fetch(url, {
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
  // Major cities in one go (majorCities.ts): one import after another, two seconds apart, so OpenStreetMap's free
  // servers aren't hit all at once. Stop leaves what's done; running it again refreshes.
  const [run, setRun] = useState<{ country: string; done: number; of: number; log: string[] } | null>(null);
  const stop = useRef(false);
  const importAll = async (country: "CA" | "US") => {
    const r = await fetch(`/api/admin/gym-places/?cities=${country}`);
    const { cities } = (await r.json().catch(() => ({ cities: [] }))) as { cities: string[] };
    stop.current = false;
    const log: string[] = [];
    let found = 0;
    let added = 0;
    for (let i = 0; i < cities.length && !stop.current; i++) {
      setRun({ country, done: i, of: cities.length, log: [...log] });
      const j = await post({ action: "import", where: cities[i] });
      if (j.error) log.unshift(`${cities[i]}: ${j.error}`);
      else {
        found += j.found ?? 0;
        added += j.added ?? 0;
        log.unshift(`${j.area}: ${j.found} found, ${j.added} new`);
      }
      await new Promise((ok) => setTimeout(ok, 2000));
    }
    setRun(null);
    setNote(`${stop.current ? "Stopped. " : ""}${country === "CA" ? "Canada" : "US"}: ${found} gyms and studios found, ${added} new.`);
  };
  const act = (p: AdminPlace, action: PlaceAction) => void post({ id: p.id, action }).then((j) => j.error && setNote(j.error));
  return (
    <div className="grid gap-4">
      <GymClaims admin={admin} />
      <GymPosters admin={admin} version={version} />
      {data && data.pending.length > 0 && (
        <Card title="Gyms lifters added" subtitle="Not on the map. Look each one up, then approve it to show it, or reject it.">
          <ul className="divide-y divide-line">
            {data.pending.map((p) => (
              <li key={p.id} className="flex flex-wrap items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold break-words">{p.name}</p>
                  <p className="text-sm text-muted">
                    {[p.address, [p.city, p.region].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
                  </p>
                  <p className="text-xs text-faint">
                    {p.kind} · added {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {admin && (
                  <div className="flex flex-wrap gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => act(p, "approve")}
                      className="press btn-primary rounded-lg px-3 py-1.5 font-semibold"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => act(p, "reject")}
                      className="press rounded-lg border border-line px-3 py-1.5 text-muted"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card title="Add a city's gyms">
        <p className="text-sm text-muted">
          Pulls every named fitness centre in an area from OpenStreetMap. They show in Find gyms near you as unofficial gyms until an owner
          claims one. Running it again refreshes unclaimed gyms and never touches a claimed one. Yoga, pilates, martial arts and similar
          places are marked as studios, which the finder leaves out. Rec and community centres with a gym come in too.
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
            <button type="submit" disabled={busy || !!run} className="press btn-primary rounded-lg px-4 py-2 font-semibold">
              {busy ? "Importing…" : "Import"}
            </button>
          </form>
        )}
        {admin && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {run ? (
              <>
                <span className="text-muted" role="status">
                  Importing {run.country === "CA" ? "Canada" : "the US"}: {run.done} of {run.of} cities
                </span>
                <button
                  type="button"
                  onClick={() => (stop.current = true)}
                  className="press rounded-lg border border-line px-3 py-1.5 text-muted"
                >
                  Stop
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void importAll("CA")}
                  className="press rounded-lg border border-line px-3 py-1.5"
                >
                  Import Canada&apos;s major cities
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void importAll("US")}
                  className="press rounded-lg border border-line px-3 py-1.5"
                >
                  Import the US&apos;s major cities
                </button>
              </>
            )}
          </div>
        )}
        {run && run.log.length > 0 && (
          <ul className="mt-2 max-h-40 overflow-y-auto text-xs text-faint">
            {run.log.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
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
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search"
            className="w-40 rounded-lg border border-line bg-raised px-3 py-1.5 text-sm"
          />
        }
      >
        {data === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : data.places.length === 0 ? (
          <p className="text-sm text-muted">{q.trim() ? "No gyms match that search." : "No gyms yet. Import a city above."}</p>
        ) : (
          <>
            <ul className="divide-y divide-line">
              {data.places.map((p) => (
                <li key={p.id} className={`flex flex-wrap items-start gap-3 py-3 ${p.hidden ? "opacity-60" : ""}`}>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold break-words">
                      <a href={`/gyms/${p.citySlug}/${p.slug}/`} target="_blank" rel="noopener" className="hover:underline">
                        {p.name}
                      </a>
                      {p.official ? " ✓" : ""}
                    </p>
                    <p className="text-sm text-muted">
                      {[p.address, [p.city, p.region].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-xs text-faint">
                      {p.kind} · {p.official ? "official" : "unofficial"} · {p.lifters} {p.lifters === 1 ? "lifter" : "lifters"} ·{" "}
                      {p.setups} {p.setups === 1 ? "setup" : "setups"} listed{p.hasKit ? "" : " · no equipment yet"}
                      {p.hidden ? " · hidden" : ""}
                      {p.qrScans ? ` · ${p.qrScans} QR ${p.qrScans === 1 ? "scan" : "scans"}` : ""}
                    </p>
                    {ordering === p.id && (
                      <PosterForm
                        place={p}
                        done={(error) => {
                          setNote(error ?? `Posters for ${p.name} are in the queue above.`);
                          if (!error) setOrdering(null);
                        }}
                        post={post}
                      />
                    )}
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
                        onClick={() => setOrdering(ordering === p.id ? null : p.id)}
                        className="press rounded-lg border border-line px-3 py-1.5 text-muted"
                      >
                        Send posters
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
            <Pager list={data} go={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}

/** Page x of y, with Previous and Next, under the gym list (50 a page; a country can have thousands). */
function Pager({ list, go }: { list: AdminPlaceList; go: (page: number) => void }) {
  const btn = "press rounded-lg border border-line px-3 py-1.5 text-sm text-muted disabled:opacity-40";
  return (
    <nav aria-label="Gym pages" className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
      <p className="text-sm text-muted">
        Page {list.page} of {list.pages} · {list.matches} {list.matches === 1 ? "gym" : "gyms"}
      </p>
      {list.pages > 1 && (
        <div className="flex gap-2">
          <button type="button" className={btn} disabled={list.page <= 1} onClick={() => go(list.page - 1)}>
            ‹ Previous
          </button>
          <button type="button" className={btn} disabled={list.page >= list.pages} onClick={() => go(list.page + 1)}>
            Next ›
          </button>
        </div>
      )}
    </nav>
  );
}

/** A poster order for one gym: what to send, who to, the mailing address (the map's address to start) and the language. */
function PosterForm({
  place,
  post,
  done,
}: {
  place: AdminPlace;
  post: (body: Record<string, unknown>, url?: string) => Promise<{ error?: string }>;
  done: (error: string | null) => void;
}) {
  const [items, setItems] = useState("both");
  const [shipTo, setShipTo] = useState("");
  const [address, setAddress] = useState([place.address, [place.city, place.region].filter(Boolean).join(" ")].filter(Boolean).join("\n"));
  const [lang, setLang] = useState("en");
  const field = "w-full rounded-lg border border-line bg-raised px-3 py-2 text-sm";
  return (
    <form
      className="mt-3 grid gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void post({ action: "order", place: place.id, items, shipTo, address, lang }, "/api/admin/gym-posters/").then((j) =>
          done(j.error ?? null),
        );
      }}
    >
      <label className="grid gap-1 text-xs text-muted">
        Send
        <select value={items} onChange={(e) => setItems(e.target.value)} className={field}>
          <option value="both">Poster and stand</option>
          <option value="poster">Poster</option>
          <option value="stand">Stand</option>
        </select>
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Attention (optional)
        <input value={shipTo} onChange={(e) => setShipTo(e.target.value)} placeholder="Manager" className={field} />
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Mailing address, with the postal code
        <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} className={field} />
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Language
        <select value={lang} onChange={(e) => setLang(e.target.value)} className={field}>
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="es">Spanish</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="ja">Japanese</option>
        </select>
      </label>
      <button type="submit" className="press btn-primary rounded-lg px-4 py-2 text-sm font-semibold">
        Add to the queue
      </button>
    </form>
  );
}
