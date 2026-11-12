"use client";

// The admin Installs tab: the latest installs, 50 at a time, searchable by part of an id, a device, a source or a
// campaign, and filtered by store, country, test devices and whether they worked out. Open one for its page; mark
// the owner's and CI devices as test so they're left out of every number.
import { useEffect, useState } from "react";

import { Card, Table } from "./charts";
import { InstallDetail } from "./InstallDetail";
import { ago, countryName, shortDay, when } from "./time";

type Install = {
  id: string;
  firstSeen: number;
  lastSeen: number;
  platform: string;
  store: string | null;
  appVersion: string | null;
  device: string | null;
  os: string | null;
  country: string | null;
  locale: string | null;
  source: string | null;
  test: boolean;
  events: number;
  workouts: number;
};
type Page = { installs: Install[]; next: number | null; countries: string[] };

const STORE_LABEL: Record<string, string> = { play: "Google Play", appstore: "App Store", testflight: "TestFlight", web: "Web" };
const PLATFORM_LABEL: Record<string, string> = { android: "Android", ios: "iOS", web: "Web" };
type Filters = { q: string; store: string; country: string; test: string; worked: boolean };
const NONE: Filters = { q: "", store: "", country: "", test: "", worked: false };

export function installsQuery(f: Filters, before?: number | null): string {
  const q = new URLSearchParams();
  if (f.q.trim()) q.set("q", f.q.trim());
  if (f.store) q.set("store", f.store);
  if (f.country) q.set("country", f.country);
  if (f.test) q.set("test", f.test);
  if (f.worked) q.set("worked", "1");
  if (before) q.set("before", String(before));
  const s = q.toString();
  return `/api/admin/installs/${s ? `?${s}` : ""}`;
}

export function Installs({ admin, open, setOpen }: { admin: boolean; open: string | null; setOpen: (id: string | null) => void }) {
  const [typed, setTyped] = useState("");
  const [f, setF] = useState<Filters>(NONE);
  const [page, setPage] = useState<Page | null>(null);
  const [more, setMore] = useState<Install[]>([]);
  const [next, setNext] = useState<number | null>(null);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    fetch(installsQuery(f))
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const j = (await r.json()) as Page;
        if (!live) return;
        setPage(j);
        setMore([]);
        setNext(j.next);
        setError(false);
      })
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, [f, version]);
  // The search box filters as you type, after a short pause.
  useEffect(() => {
    const t = setTimeout(() => setF((x) => (x.q === typed ? x : { ...x, q: typed })), 300);
    return () => clearTimeout(t);
  }, [typed]);
  const loadMore = async () => {
    if (!next) return;
    const r = await fetch(installsQuery(f, next));
    if (!r.ok) return setError(true);
    const j = (await r.json()) as Page;
    setMore((m) => [...m, ...j.installs]);
    setNext(j.next);
  };
  const mark = async (id: string, test: boolean) => {
    await fetch("/api/admin/installs/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, test }),
    });
    setVersion((v) => v + 1);
  };
  const rows = page ? [...page.installs, ...more] : [];
  const filtered = f.q || f.store || f.country || f.test || f.worked;
  const field = "card px-3 py-2 text-sm";
  return (
    <div className="space-y-4">
      {open && <InstallDetail id={open} close={() => setOpen(null)} />}
      <Card
        title="Installs"
        subtitle="Newest first. Device and source only. Mark your own phones and CI devices as test so they're left out of every number. The install id is shown in the app under Settings › Usage stats."
      >
        <form className="mb-3 flex flex-wrap items-center gap-2" role="search" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="install-search" className="sr-only">
            Search installs
          </label>
          <input
            id="install-search"
            type="search"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Install id, device, source or campaign"
            className={`${field} w-full sm:w-72`}
          />
          <label htmlFor="install-store" className="sr-only">
            Store
          </label>
          <select id="install-store" className={field} value={f.store} onChange={(e) => setF({ ...f, store: e.target.value })}>
            <option value="">Every store</option>
            <option value="play">Google Play</option>
            <option value="appstore">App Store</option>
            <option value="web">Web</option>
          </select>
          <label htmlFor="install-country" className="sr-only">
            Country
          </label>
          <select id="install-country" className={field} value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })}>
            <option value="">Every country</option>
            {(page?.countries ?? []).map((c) => (
              <option key={c} value={c}>
                {countryName(c)}
              </option>
            ))}
          </select>
          <label htmlFor="install-test" className="sr-only">
            Test devices
          </label>
          <select id="install-test" className={field} value={f.test} onChange={(e) => setF({ ...f, test: e.target.value })}>
            <option value="">Real and test</option>
            <option value="real">Real only</option>
            <option value="test">Test devices only</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.worked} onChange={(e) => setF({ ...f, worked: e.target.checked })} />
            Worked out
          </label>
          {filtered ? (
            <button
              type="button"
              className="text-sm text-muted underline"
              onClick={() => {
                setTyped("");
                setF(NONE);
              }}
            >
              Clear
            </button>
          ) : null}
        </form>
        {error && <p className="text-sm text-bad">The installs didn&apos;t load. Reload to try again.</p>}
        {!page ? (
          !error && <p className="text-sm text-muted">Loading…</p>
        ) : (
          <>
            <Table
              columns={["Install", "First seen", "Last seen", "Store", "Device", "Version", "Country", "Source", "Workouts", "Events", ""]}
              rows={rows.map((i) => [
                <button
                  key="id"
                  type="button"
                  className="text-left text-accent underline"
                  title="Open this install"
                  onClick={() => setOpen(i.id)}
                >
                  <code className="text-xs">{i.id.slice(0, 12)}</code>
                  {i.test && <span className="ml-1.5 rounded border border-line px-1 text-xs text-muted no-underline">test</span>}
                </button>,
                <span key="f" className="whitespace-nowrap" title={when(i.firstSeen)}>
                  {shortDay(i.firstSeen)}
                </span>,
                <span key="l" className="whitespace-nowrap" title={when(i.lastSeen)}>
                  {ago(i.lastSeen)}
                </span>,
                STORE_LABEL[i.store ?? ""] ?? PLATFORM_LABEL[i.platform] ?? i.platform,
                <span key="d" title={i.os ?? undefined}>
                  {i.device ?? "—"}
                  {i.os ? <span className="block text-xs text-muted">{i.os}</span> : null}
                </span>,
                i.appVersion ?? "—",
                i.country ? countryName(i.country) : "—",
                i.source ?? "—",
                i.workouts,
                i.events,
                admin ? (
                  <button
                    key="t"
                    type="button"
                    className="whitespace-nowrap text-xs text-accent underline"
                    onClick={() => void mark(i.id, !i.test)}
                  >
                    {i.test ? "Count it" : "Mark test"}
                  </button>
                ) : (
                  ""
                ),
              ])}
              empty={filtered ? "No install matches." : "No installs yet."}
            />
            <p className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
              {rows.length} shown
              {next ? (
                <button type="button" onClick={() => void loadMore()} className="press rounded-lg border border-line px-3 py-1.5 text-ink">
                  Load more
                </button>
              ) : null}
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
