"use client";

// The Traffic tab's Google Search section (ported from Gradelings' Traffic tab): clicks, times shown, click rate and
// position against the period before, by day, the top searches and pages, searches close to page one that rarely
// get clicked (the ones worth a better title), and the sitemaps. Read on the server; the page only gets numbers.
import { useEffect, useState } from "react";

import { dayNumber, nearMisses, pathOf, type SearchPart, type SearchReport, type SearchRow } from "@/lib/searchConsole";

import { BarList, Card, fmtDay, fmtInt, fmtPct, LineChart, Table, Tile } from "./charts";
import { ago } from "./time";

export const delta = (a: number, b: number) => (b > 0 ? (a - b) / b : null);
export const pos = (n: number) => n.toFixed(1);
export const shortDate = (d: string) => fmtDay(dayNumber(d));

export function rowsTable(rows: SearchRow[], label: (k: string) => string) {
  return rows.map((r) => [label(r.key), fmtInt(r.clicks), fmtInt(r.impressions), fmtPct(r.ctr), pos(r.position)]);
}
export const COLUMNS = ["Clicks", "Shown", "Click rate", "Position"];

function Report({ r }: { r: SearchReport }) {
  const t = r.totals;
  const p = r.previous;
  const misses = nearMisses(r.queries);
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Clicks from Google" value={fmtInt(t.clicks)} delta={delta(t.clicks, p.clicks)} sub="vs the period before" />
        <Tile label="Times shown" value={fmtInt(t.impressions)} delta={delta(t.impressions, p.impressions)} sub="in Google results" />
        <Tile label="Click rate" value={fmtPct(t.ctr)} sub={p.impressions ? `${fmtPct(p.ctr)} the period before` : undefined} />
        <Tile
          label="Average position"
          value={t.impressions ? pos(t.position) : "—"}
          sub={p.impressions ? `${pos(p.position)} the period before (lower is better)` : "1 is the top of the page"}
        />
      </div>
      <Card title="Google search by day" subtitle={`${shortDate(r.start)} to ${shortDate(r.end)}. ${r.site}`}>
        <LineChart
          rows={r.daily.map((d) => ({ day: dayNumber(d.date), clicks: d.clicks, impressions: d.impressions }))}
          x="day"
          lines={[
            { key: "clicks", label: "Clicks" },
            { key: "impressions", label: "Times shown" },
          ]}
          xLabel={fmtDay}
          label="Clicks and times shown in Google a day"
        />
      </Card>
      <Card
        title="Worth a better title"
        subtitle="Searches where we show on page one or two (position 4 to 20) but under 3% click. A clearer title and description, or a page that answers the search more directly, turns these into clicks."
      >
        <Table
          columns={["Search", ...COLUMNS]}
          rows={rowsTable(misses, (k) => k)}
          empty="Nothing here: no search is shown often enough near the top without clicks."
        />
      </Card>
      <Card title="Top searches" subtitle="What people typed, most clicks first.">
        <Table columns={["Search", ...COLUMNS]} rows={rowsTable(r.queries.slice(0, 10), (k) => k)} empty="No searches with clicks yet." />
      </Card>
      <Card title="Top pages from Google" subtitle="Pages people reached from Google, most clicks first.">
        <Table columns={["Page", ...COLUMNS]} rows={rowsTable(r.pages, pathOf)} empty="No pages with clicks yet." />
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Countries" subtitle="Clicks from Google.">
          <BarList rows={r.countries.map((c) => ({ key: c.key.toUpperCase(), n: c.clicks }))} empty="No clicks yet." />
        </Card>
        <Card title="Devices" subtitle="Clicks from Google.">
          <BarList
            rows={r.devices.map((c) => ({ key: c.key.charAt(0) + c.key.slice(1).toLowerCase(), n: c.clicks }))}
            empty="No clicks yet."
          />
        </Card>
      </div>
      <Card title="Sitemaps" subtitle="When Google last read each one.">
        {r.sitemaps.length === 0 ? (
          <p className="text-sm text-muted">
            No sitemap submitted yet. Submit https://www.getliftsmith.com/sitemap.xml in Search Console so Google finds every exercise and
            guide page.
          </p>
        ) : (
          <ul className="text-sm">
            {r.sitemaps.map((m) => (
              <li key={m.path} className="break-all border-t border-line py-2 first:border-0">
                <span className="font-semibold">{pathOf(m.path)}</span>: {fmtInt(m.submitted)} pages listed, read{" "}
                {m.lastDownloaded ? ago(m.lastDownloaded) : "not yet"}
                {m.errors > 0 && <span className="font-semibold text-bad"> · {fmtInt(m.errors)} errors</span>}
                {m.warnings > 0 && <span className="text-warn"> · {fmtInt(m.warnings)} warnings</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

/** Google Search Console for the panel's period. Search Console keeps 16 months, so every period works. */
export function SearchConsole({ days }: { days: number }) {
  const [round, setRound] = useState(0);
  // The answer is kept with the request it answers, so a new period or "Check again" shows as loading at once.
  const key = `${days}:${round}`;
  const [got, setGot] = useState<{ key: string; part: SearchPart } | null>(null);
  const part = got?.key === key ? got.part : null;
  useEffect(() => {
    let live = true;
    const done = (p: SearchPart) => live && setGot({ key: `${days}:${round}`, part: p });
    fetch(`/api/admin/search/?days=${days}${round ? "&refresh=1" : ""}`)
      .then(async (res) => {
        const j = (await res.json().catch(() => ({}))) as SearchPart & { error?: string };
        done(res.ok ? j : { state: "error", error: j.error ?? `Answered ${res.status}.` });
      })
      .catch(() => done({ state: "error", error: "Didn't load." }));
    return () => {
      live = false;
    };
  }, [days, round]);
  return (
    <section aria-labelledby="search-h" aria-busy={!part} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="search-h" className="text-lg font-bold">
            Google Search
          </h2>
          <p className="text-xs text-muted">
            From Google Search Console. Google&apos;s numbers settle a few days late, so the period ends three days ago.
          </p>
        </div>
        <button
          type="button"
          disabled={!part}
          onClick={() => setRound((n) => n + 1)}
          className="press rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {part ? "Check again" : "Checking…"}
        </button>
      </div>
      {!part ? (
        <p className="text-sm text-muted">Reading Search Console…</p>
      ) : part.state === "ok" ? (
        <Report r={part.report} />
      ) : part.state === "setup" ? (
        <p className="card p-4 text-sm">
          <span className="font-semibold">Not set up.</span> {part.setup}
        </p>
      ) : (
        <p className="card p-4 text-sm text-bad">Couldn&apos;t read Search Console: {part.error}</p>
      )}
    </section>
  );
}
