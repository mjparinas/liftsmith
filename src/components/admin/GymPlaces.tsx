"use client";

// The admin Gyms tab (docs/decisions/gyms.md "The admin Gyms tab"). Four parts, one at a time, so the page isn't one
// long manual (Melvin, 2026-11-15): To do (claims, posters and gyms lifters added, with counts on the tab), Import
// (OpenStreetMap, with Recent imports), Website fill-in, and the Gym list with search, filters and Fix city names.
// Long explanations sit behind "How this works". Support staff can read; only admins import or change a gym.
import { useCallback, useEffect, useState } from "react";

import type { AdminPlace, AdminPlaceList, PlaceAction } from "@/server/gymPlaces";
import type { RepairChange, RepairStep } from "@/server/gymRepair";

import { Card } from "./charts";
import { GymClaims } from "./GymClaims";
import { GymEnrich } from "./GymEnrich";
import { GymImport } from "./GymImport";
import { GymPosters } from "./GymPosters";
import { HowItWorks } from "./HowItWorks";
import { Loading, TableBones } from "./Skeletons";

export const GYM_PARTS = ["To do", "Import", "Website fill-in", "Gym list"] as const;
export type GymPart = (typeof GYM_PARTS)[number];

type List = AdminPlaceList & { pending: AdminPlace[] };

async function post(body: Record<string, unknown>, url = "/api/admin/gym-places/") {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!r) return { error: "The admin server didn't answer." };
  const j = (await r.json().catch(() => ({}))) as { error?: string };
  return r.ok ? j : { error: j.error ?? "That didn't work." };
}

export function GymPlaces({ admin }: { admin: boolean }) {
  const [part, setPart] = useState<GymPart>("To do");
  const [version, setVersion] = useState(0);
  const changed = useCallback(() => setVersion((v) => v + 1), []);
  const [claims, setClaims] = useState(0);
  const [posters, setPosters] = useState(0);
  const [pending, setPending] = useState<AdminPlace[]>([]);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/admin/gym-places/?page=1&status=official")
      .then(async (r) => (r.ok ? ((await r.json()) as List) : null))
      .then((j) => live && j && setPending(j.pending))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [version]);
  const todo = claims + posters + pending.length;
  const badge: Partial<Record<GymPart, number>> = { "To do": todo };
  const act = (p: AdminPlace, action: PlaceAction) =>
    void post({ id: p.id, action }).then((j) => {
      if (j.error) setNote(j.error);
      changed();
    });
  return (
    <div className="grid min-w-0 gap-4 [&>*]:min-w-0">
      <nav className="flex flex-wrap gap-1 border-b border-line pb-2" aria-label="Gyms">
        {GYM_PARTS.map((t) => (
          <button
            key={t}
            type="button"
            aria-current={part === t ? "page" : undefined}
            onClick={() => setPart(t)}
            className={`press rounded-lg px-3 py-1.5 text-sm ${part === t ? "bg-raised text-ink" : "text-muted"}`}
          >
            {t}
            {badge[t] ? (
              <span
                className="ml-1.5 rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-ink"
                aria-label={`${badge[t]} waiting`}
              >
                {badge[t]}
              </span>
            ) : null}
          </button>
        ))}
      </nav>
      {note && (
        <p className="text-sm text-muted" role="status">
          {note}
        </p>
      )}

      {/* Every part stays mounted, so the To do counts are right whichever part is open. */}
      <div hidden={part !== "To do"} className="grid min-w-0 gap-4 [&>*]:min-w-0">
        {todo === 0 && <p className="text-sm text-muted">Nothing waiting: no claims to check, posters to send or gyms lifters added.</p>}
        <GymClaims admin={admin} onCount={setClaims} />
        <GymPosters admin={admin} version={version} onCount={setPosters} />
        <AddedGyms admin={admin} pending={pending} act={act} />
      </div>
      <div hidden={part !== "Import"} className="grid min-w-0 gap-4 [&>*]:min-w-0">
        <GymImport admin={admin} changed={changed} />
      </div>
      <div hidden={part !== "Website fill-in"} className="grid min-w-0 gap-4 [&>*]:min-w-0">
        <GymEnrich admin={admin} changed={changed} />
      </div>
      <div hidden={part !== "Gym list"} className="grid min-w-0 gap-4 [&>*]:min-w-0">
        <GymList admin={admin} version={version} changed={changed} act={act} setNote={setNote} />
      </div>
    </div>
  );
}

/** Gyms lifters added that aren't on the map: look each one up, then approve or reject it. */
function AddedGyms({ admin, pending, act }: { admin: boolean; pending: AdminPlace[]; act: (p: AdminPlace, a: PlaceAction) => void }) {
  return (
    <Card title="Gyms lifters added" subtitle={`${pending.length} waiting`}>
      <HowItWorks>
        <p>Gyms a lifter or owner added that the map doesn&apos;t have. Look each one up, then approve it to show it, or reject it.</p>
      </HowItWorks>
      {pending.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nothing waiting.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {pending.map((p) => (
            <li key={p.id} className="flex flex-wrap items-start gap-3 py-3">
              <div className="min-w-0 flex-1 basis-64">
                <p className="font-semibold break-words">{p.name}</p>
                <p className="text-sm text-muted">{placeLine(p)}</p>
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
      )}
    </Card>
  );
}

const placeLine = (p: AdminPlace) => [p.address, [p.city, p.region].filter(Boolean).join(", ")].filter(Boolean).join(" · ");

const STATUS = [
  ["", "Any status"],
  ["official", "Official"],
  ["unofficial", "Unofficial"],
  ["studio", "Studios"],
  ["hidden", "Hidden"],
] as const;
const MISSING = [
  ["", "Any details"],
  ["city", "City is a postcode or missing"],
  ["address", "No address"],
  ["phone", "No phone"],
  ["hours", "No hours"],
  ["website", "No website"],
  ["email", "No email"],
  ["kit", "No equipment"],
] as const;

const countryName = (() => {
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    names = null;
  }
  return (code: string) => {
    try {
      return names?.of(code) ?? code;
    } catch {
      return code;
    }
  };
})();

/** The gym list: search, filters, 50 a page, and Fix city names when some cities are postcodes. */
function GymList({
  admin,
  version,
  changed,
  act,
  setNote,
}: {
  admin: boolean;
  version: number;
  changed: () => void;
  act: (p: AdminPlace, a: PlaceAction) => void;
  setNote: (note: string | null) => void;
}) {
  const [data, setData] = useState<List | null>(null);
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("");
  const [missing, setMissing] = useState("");
  const [page, setPage] = useState(1);
  const [ordering, setOrdering] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  // Once shown, Fix city names stays until the page closes, so its result is still there when the count reaches 0.
  const [fixShown, setFixShown] = useState(false);
  if (!fixShown && data && data.badCities > 0) setFixShown(true);
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      const u = new URLSearchParams({ q, country, city, status, missing, page: String(page) });
      fetch(`/api/admin/gym-places/?${u}`)
        .then(async (r) => {
          if (!r.ok) throw new Error();
          const j = (await r.json()) as List;
          if (live) {
            setData(j);
            setFailed(false);
          }
        })
        .catch(() => live && setFailed(true));
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, country, city, status, missing, page, version]);
  const set = (f: (v: string) => void) => (v: string) => {
    f(v);
    setPage(1);
  };
  const filtered = !!(q.trim() || country || city.trim() || status || missing);
  const field = "rounded-lg border border-line bg-raised px-3 py-1.5 text-sm";
  return (
    <>
      {fixShown && data && <FixCities admin={admin} count={data.badCities} changed={changed} show={() => set(setMissing)("city")} />}
      <Card title="Gyms" subtitle={data ? `${data.total} in all, ${data.official} official` : undefined}>
        <div className="mb-3 flex flex-wrap gap-2" role="search" aria-label="Find gyms">
          <input
            aria-label="Search by name, address or city"
            value={q}
            onChange={(e) => set(setQ)(e.target.value)}
            placeholder="Search name, address or city"
            className={`${field} min-w-0 flex-1 basis-48`}
          />
          <select aria-label="Country" value={country} onChange={(e) => set(setCountry)(e.target.value)} className={field}>
            <option value="">All countries</option>
            {data?.countries.map((c) => (
              <option key={c.code} value={c.code}>
                {countryName(c.code)} ({c.n})
              </option>
            ))}
          </select>
          <input
            aria-label="City"
            value={city}
            onChange={(e) => set(setCity)(e.target.value)}
            placeholder="City"
            className={`${field} w-36`}
          />
          <select aria-label="Status" value={status} onChange={(e) => set(setStatus)(e.target.value)} className={field}>
            {STATUS.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
          <select aria-label="Missing details" value={missing} onChange={(e) => set(setMissing)(e.target.value)} className={field}>
            {MISSING.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setCountry("");
                setCity("");
                setStatus("");
                setMissing("");
                setPage(1);
              }}
              className="press rounded-lg px-3 py-1.5 text-sm text-muted underline"
            >
              Clear
            </button>
          )}
        </div>
        {failed && <p className="mb-2 text-sm text-bad">The gym list didn&apos;t load.</p>}
        {data === null ? (
          <Loading label="Loading gyms">
            <TableBones />
          </Loading>
        ) : data.places.length === 0 ? (
          <p className="text-sm text-muted">{filtered ? "No gyms match." : "No gyms yet. Import a city first."}</p>
        ) : (
          <>
            <ul className="divide-y divide-line">
              {data.places.map((p) => (
                <li key={p.id} className={`flex flex-wrap items-start gap-3 py-3 ${p.hidden ? "opacity-60" : ""}`}>
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="font-semibold break-words">
                      <a href={`/gyms/${p.citySlug}/${p.slug}/`} target="_blank" rel="noopener" className="hover:underline">
                        {p.name}
                      </a>
                      {p.official ? " ✓" : ""}
                    </p>
                    <p className="text-sm text-muted">{placeLine(p)}</p>
                    <p className="text-xs text-faint">
                      {p.kind} · {p.official ? "official" : "unofficial"} · {p.lifters} {p.lifters === 1 ? "lifter" : "lifters"} ·{" "}
                      {p.setups} {p.setups === 1 ? "setup" : "setups"} listed{p.hasKit ? "" : " · no equipment yet"}
                      {p.hidden ? " · hidden" : ""}
                      {p.qrScans ? ` · ${p.qrScans} QR ${p.qrScans === 1 ? "scan" : "scans"}` : ""}
                      {p.pictures ? ` · ${p.pictures} ${p.pictures === 1 ? "picture" : "pictures"}` : ""}
                    </p>
                    {ordering === p.id && (
                      <PosterForm
                        place={p}
                        done={(error) => {
                          setNote(error ?? `Posters for ${p.name} are in the queue (To do).`);
                          if (!error) {
                            setOrdering(null);
                            changed();
                          }
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
                      {p.pictures > 0 && (
                        <button
                          type="button"
                          onClick={() => window.confirm(`Take down ${p.name}'s logo and photos?`) && act(p, "pictures")}
                          className="press rounded-lg border border-line px-3 py-1.5 text-muted"
                        >
                          Remove pictures
                        </button>
                      )}
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
    </>
  );
}

/**
 * Fix city names (gymRepair.ts): gyms filed under a postcode or house number ("80145, Campania") or no city get the
 * right one, untidy addresses are cleaned, and moved pages redirect. Runs a thousand gyms a step until the list ends.
 */
function FixCities({ admin, count, changed, show }: { admin: boolean; count: number; changed: () => void; show: () => void }) {
  const [running, setRunning] = useState(false);
  const [sums, setSums] = useState<Omit<RepairStep, "next" | "changes"> | null>(null);
  const [changes, setChanges] = useState<RepairChange[]>([]);
  const [error, setError] = useState<string | null>(null);
  const start = async () => {
    setRunning(true);
    setError(null);
    setChanges([]);
    const all = { checked: 0, cities: 0, addresses: 0, moved: 0, unsure: 0 };
    let after = "";
    for (;;) {
      const r = await fetch("/api/admin/gym-places/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "repair", after }),
      }).catch(() => null);
      const j = r?.ok ? ((await r.json().catch(() => null)) as RepairStep | null) : null;
      if (!j) {
        setError(r ? `The admin server answered ${r.status}.` : "The admin server didn't answer.");
        break;
      }
      for (const k of Object.keys(all) as (keyof typeof all)[]) all[k] += j[k];
      setSums({ ...all });
      setChanges((c) => [...c, ...j.changes].slice(-200));
      if (!j.next) break;
      after = j.next;
    }
    setRunning(false);
    changed();
  };
  return (
    <Card
      title="Fix city names"
      subtitle={
        count
          ? `${count} ${count === 1 ? "gym's city looks" : "gyms' cities look"} like a postcode or house number, or are missing`
          : "Every city looks right now."
      }
    >
      <HowItWorks>
        <p>
          Some map entries have a postcode or house number where the city goes, so their pages were filed under cities like &ldquo;80145,
          Campania&rdquo; or &ldquo;1, ON&rdquo;. This gives each one its right city: the name inside the value when there is one
          (&ldquo;80145 Napoli&rdquo;), else the city most gyms within about 3 km are under, else OpenStreetMap&apos;s answer for the
          gym&apos;s position (a dozen lookups a step). It also tidies addresses (stray commas, repeated parts) and moves each fixed page to
          its new address, with a permanent redirect from the old one. Claimed gyms are left as their owner set them.
        </p>
      </HowItWorks>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        {admin && (
          <button
            type="button"
            disabled={running}
            onClick={() => void start()}
            className="press btn-primary rounded-lg px-3 py-1.5 font-semibold"
          >
            {running ? "Fixing…" : "Fix city names and addresses"}
          </button>
        )}
        <button type="button" onClick={show} className="press rounded-lg border border-line px-3 py-1.5 text-muted">
          Show them
        </button>
        {sums && (
          <span className="text-muted" role="status">
            {sums.checked} checked, {sums.cities} cities fixed, {sums.addresses} addresses tidied, {sums.moved} pages moved
            {sums.unsure ? `, ${sums.unsure} not sure yet (run it again)` : ""}
          </span>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-bad">{error}</p>}
      {changes.length > 0 && (
        <ul className="mt-2 max-h-48 overflow-y-auto text-xs text-faint">
          {changes.map((c, i) => (
            <li key={`${c.id}-${i}`}>
              {c.name}: {c.what}
            </li>
          ))}
        </ul>
      )}
    </Card>
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
