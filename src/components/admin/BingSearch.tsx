"use client";

// The Traffic tab's Bing section, under Google's: clicks, times shown, click rate and position against the period
// before, by day, the searches near the top that rarely get clicked, and the top searches and pages. Bing's index
// also feeds DuckDuckGo, Yahoo and ChatGPT search, so this is most of the searches that aren't Google. Read on the
// server (src/server/bing.ts); the page only gets numbers.
import { useEffect, useState } from "react";

import type { BingPart, BingReport } from "@/lib/bing";
import { dayNumber, nearMisses, pathOf } from "@/lib/searchConsole";

import { Card, fmtDay, fmtInt, fmtPct, LineChart, Table, Tile } from "./charts";
import { COLUMNS, delta, pos, rowsTable, shortDate } from "./SearchConsole";
import { CardBones, Loading, TileBones } from "./Skeletons";

function Report({ r }: { r: BingReport }) {
  const t = r.totals;
  const p = r.previous;
  const misses = nearMisses(r.queries);
  const partly = r.firstDay && r.firstDay > r.start;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Clicks from Bing" value={fmtInt(t.clicks)} delta={delta(t.clicks, p.clicks)} sub="vs the period before" />
        <Tile label="Times shown" value={fmtInt(t.impressions)} delta={delta(t.impressions, p.impressions)} sub="in Bing results" />
        <Tile label="Click rate" value={fmtPct(t.ctr)} sub={p.impressions ? `${fmtPct(p.ctr)} the period before` : undefined} />
        <Tile
          label="Average position"
          value={t.position ? pos(t.position) : "—"}
          sub={p.position ? `${pos(p.position)} the period before (lower is better)` : "1 is the top of the page"}
        />
      </div>
      <Card
        title="Bing search by day"
        subtitle={`${shortDate(r.start)} to ${shortDate(r.end)}. ${r.site}${partly ? `. Bing has numbers from ${shortDate(r.firstDay ?? r.start)} on.` : ""}`}
      >
        <LineChart
          rows={r.daily.map((d) => ({ day: dayNumber(d.date), clicks: d.clicks, impressions: d.impressions }))}
          x="day"
          lines={[
            { key: "clicks", label: "Clicks" },
            { key: "impressions", label: "Times shown" },
          ]}
          xLabel={fmtDay}
          label="Clicks and times shown in Bing a day"
        />
      </Card>
      <Card
        title="Worth a better title on Bing"
        subtitle="Searches where we show on page one or two (position 4 to 20) but under 3% click. Bing reports searches by week, so this covers the weeks that end in the period."
      >
        <Table
          columns={["Search", ...COLUMNS]}
          rows={rowsTable(misses, (k) => k)}
          empty="Nothing here: no search is shown often enough near the top without clicks."
        />
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Top searches on Bing" subtitle="What people typed, most clicks first.">
          <Table columns={["Search", ...COLUMNS]} rows={rowsTable(r.queries.slice(0, 10), (k) => k)} empty="No searches yet." />
        </Card>
        <Card title="Top pages from Bing" subtitle="Pages people reached from Bing, most clicks first.">
          <Table columns={["Page", ...COLUMNS]} rows={rowsTable(r.pages, pathOf)} empty="No pages yet." />
        </Card>
      </div>
    </>
  );
}

/** Bing Webmaster Tools for the panel's period. Bing keeps about six months, so a year shows what there is. */
export function BingSearch({ days }: { days: number }) {
  const [round, setRound] = useState(0);
  // The answer is kept with the request it answers, so a new period or "Check again" shows as loading at once.
  const key = `${days}:${round}`;
  const [got, setGot] = useState<{ key: string; part: BingPart } | null>(null);
  const part = got?.key === key ? got.part : null;
  useEffect(() => {
    let live = true;
    const done = (p: BingPart) => live && setGot({ key: `${days}:${round}`, part: p });
    fetch(`/api/admin/bing/?days=${days}${round ? "&refresh=1" : ""}`)
      .then(async (res) => {
        const j = (await res.json().catch(() => ({}))) as BingPart & { error?: string };
        done(res.ok ? j : { state: "error", error: j.error ?? `Answered ${res.status}.` });
      })
      .catch(() => done({ state: "error", error: "Didn't load." }));
    return () => {
      live = false;
    };
  }, [days, round]);
  return (
    <section aria-labelledby="bing-h" aria-busy={!part} className={`space-y-4 pt-4 ${part?.state === "setup" ? "order-last" : ""}`}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="bing-h" className="text-lg font-bold">
            Bing Search
          </h2>
          <p className="text-xs text-muted">
            From Bing Webmaster Tools. Bing also powers DuckDuckGo, Yahoo and ChatGPT search. New and changed pages are sent to Bing each
            day through IndexNow.
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
        <Loading label="Reading Bing Webmaster Tools" className="space-y-4">
          <TileBones />
          <CardBones body="chart" />
        </Loading>
      ) : part.state === "ok" ? (
        <Report r={part.report} />
      ) : part.state === "setup" ? (
        <p className="card p-4 text-sm">
          <span className="font-semibold">Not set up.</span> {part.setup}
        </p>
      ) : (
        <p className="card p-4 text-sm text-bad">Couldn&apos;t read Bing Webmaster Tools: {part.error}</p>
      )}
    </section>
  );
}
