// Loading placeholders for the admin panel, shaped like what they stand in for (tiles, charts, bar lists,
// tables, lists), so the page doesn't jump when the numbers land (Melvin, 2026-11-13). They use the app's
// shimmering `.skeleton` from globals.css. Each group says "Loading" once to a screen reader; the bones
// themselves are hidden from it.
import type { CSSProperties, ReactNode } from "react";

/** One grey shape. */
export function Bone({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div className={`skeleton rounded-md ${className}`} style={style} aria-hidden />;
}

/** Wraps bones so assistive tech hears one "Loading …" for the whole group. */
export function Loading({ label = "Loading", className, children }: { label?: string; className?: string; children: ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      {children}
    </div>
  );
}

// Varied widths read as text rather than a grid of bars.
const WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-5/6", "w-2/5", "w-3/5"];
const width = (i: number) => WIDTHS[i % WIDTHS.length];

/** A row of headline tiles, like `Tile` in charts.tsx. */
export function TileBones({ n = 4, cols = "grid-cols-2 md:grid-cols-4" }: { n?: number; cols?: string }) {
  return (
    <div className={`grid gap-3 ${cols}`} aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="card p-4">
          <Bone className="h-3 w-24" />
          <Bone className="mt-2 h-7 w-20" />
          <Bone className="mt-2 h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

/** Rows of a list: a title line and a smaller line under it, with a button-sized shape on the right. */
export function RowBones({ n = 4, action = true }: { n?: number; action?: boolean }) {
  return (
    <ul className="divide-y divide-line/60" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <li key={i} className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Bone className={`h-4 ${width(i)}`} />
            <Bone className={`h-3 ${width(i + 3)} max-w-xs`} />
          </div>
          {action && <Bone className="h-8 w-20 shrink-0 rounded-lg" />}
        </li>
      ))}
    </ul>
  );
}

/** A bar list (`BarList`): a label and a bar of falling length. */
export function BarBones({ n = 5 }: { n?: number }) {
  return (
    <ul className="space-y-2.5" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <li key={i} className="flex items-center gap-3">
          <Bone className="h-3 w-24 shrink-0" />
          <Bone className="h-4 rounded-sm" style={{ width: `${Math.max(12, 80 - i * 15)}%` }} />
          <Bone className="ml-auto h-3 w-8 shrink-0" />
        </li>
      ))}
    </ul>
  );
}

/** A chart's plot area: bars rising and falling along a baseline. */
export function ChartBones({ height = "h-40" }: { height?: string }) {
  const bars = [40, 55, 35, 60, 70, 50, 65, 80, 60, 75, 55, 85, 70, 90];
  return (
    <div className={`flex ${height} items-end gap-1.5 border-b border-line/60 pb-px`} aria-hidden>
      {bars.map((h, i) => (
        <div key={i} className="skeleton flex-1 rounded-t-sm" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

/** A table (`Table`): a header and rows on a wide screen, small cards on a phone, as the real one does. */
export function TableBones({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div aria-hidden>
      <div className="hidden md:block">
        <div className="flex gap-4 border-b border-line pb-2">
          {Array.from({ length: cols }, (_, c) => (
            <Bone key={c} className="h-3 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex gap-4 border-b border-line/50 py-3">
            {Array.from({ length: cols }, (_, c) => (
              <div key={c} className="flex-1">
                <Bone className={`h-3.5 ${c === 0 ? "w-5/6" : width(r + c)}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <ul className="space-y-2 md:hidden">
        {Array.from({ length: Math.min(rows, 4) }, (_, r) => (
          <li key={r} className="space-y-2 rounded-xl border border-line/70 px-3 py-3">
            <Bone className={`h-4 ${width(r)}`} />
            <Bone className="h-3 w-1/2" />
            <Bone className="h-3 w-2/5" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Lines of text. */
export function LineBones({ n = 4 }: { n?: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <Bone key={i} className={`h-3.5 ${width(i)}`} />
      ))}
    </div>
  );
}

type Body = "chart" | "bars" | "table" | "rows" | "funnel" | "lines";

function BodyBones({ body }: { body: Body }) {
  switch (body) {
    case "chart":
      return <ChartBones />;
    case "bars":
      return <BarBones />;
    case "table":
      return <TableBones />;
    case "rows":
      return <RowBones />;
    case "funnel":
      return (
        <div className="space-y-2" aria-hidden>
          {[100, 78, 56, 40, 26].map((w, i) => (
            <Bone key={i} className="h-7 rounded-lg" style={{ width: `${w}%` }} />
          ))}
        </div>
      );
    case "lines":
      return <LineBones />;
  }
}

/** A `Card` still loading. With `title` the real title shows (so the page reads right away); without, a bone. */
export function CardBones({ title, body = "lines", className = "" }: { title?: string; body?: Body; className?: string }) {
  return (
    <section className={`card p-4 ${className}`}>
      <div className="mb-4">
        {title ? <h2 className="font-semibold">{title}</h2> : <Bone className="h-4 w-40" />}
        <Bone className="mt-2 h-3 w-2/3 max-w-sm" />
      </div>
      <BodyBones body={body} />
    </section>
  );
}

/** The Inbox: folders and search above a list of messages. */
export function InboxBones() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="flex flex-wrap gap-2">
        {["w-20", "w-24", "w-16", "w-20"].map((w, i) => (
          <Bone key={i} className={`h-8 rounded-full ${w}`} />
        ))}
        <Bone className="ml-auto h-8 w-48 rounded-lg" />
      </div>
      <div className="card px-4">
        <ul className="divide-y divide-line/60">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="flex items-start gap-3 py-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex gap-3">
                  <Bone className="h-4 w-40" />
                  <Bone className="ml-auto h-3 w-14" />
                </div>
                <Bone className={`h-3.5 ${width(i)}`} />
                <Bone className={`h-3 ${width(i + 2)}`} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const grid2 = "grid gap-4 md:grid-cols-2";

/** A whole tab still loading, shaped like that tab's own layout in AdminApp. */
export function TabSkeleton({ tab }: { tab: string }) {
  const content = (() => {
    switch (tab) {
      case "Overview":
        return (
          <>
            <CardBones body="rows" />
            <TileBones n={8} />
            <CardBones body="chart" />
            <CardBones body="chart" />
          </>
        );
      case "Traffic":
        return (
          <>
            <TileBones />
            <CardBones body="chart" />
            <div className={grid2}>
              {[0, 1, 2, 3].map((i) => (
                <CardBones key={i} body="bars" />
              ))}
            </div>
          </>
        );
      case "Acquisition":
        return (
          <>
            <TileBones />
            <div className={grid2}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <CardBones key={i} body="bars" />
              ))}
            </div>
          </>
        );
      case "Funnel":
        return (
          <>
            <div className={grid2}>
              <CardBones body="funnel" />
              <CardBones body="funnel" />
            </div>
            <CardBones body="funnel" />
          </>
        );
      case "Retention":
        return (
          <>
            <TileBones n={3} cols="grid-cols-3" />
            <CardBones body="table" />
          </>
        );
      case "Engagement":
        return (
          <>
            <TileBones />
            <CardBones body="chart" />
            <div className={grid2}>
              <CardBones body="bars" />
              <CardBones body="bars" />
            </div>
          </>
        );
      case "Devices":
        return (
          <div className={grid2}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <CardBones key={i} body="bars" />
            ))}
          </div>
        );
      case "Revenue":
        return (
          <>
            <TileBones />
            <CardBones body="chart" />
            <CardBones body="table" />
          </>
        );
      case "To Do":
        return (
          <>
            <CardBones body="rows" />
            <CardBones body="rows" />
          </>
        );
      case "Inbox":
        return <InboxBones />;
      case "Reports":
      case "Automations":
        return <CardBones body="rows" />;
      case "Gyms":
        return (
          <>
            <CardBones body="rows" />
            <CardBones body="table" />
          </>
        );
      case "Flags":
      case "A/B Tests":
        return <CardBones body="rows" />;
      case "Users":
      case "Installs":
      case "Log":
        return <CardBones body="table" />;
      case "System":
        return (
          <div className={grid2}>
            {[0, 1, 2, 3].map((i) => (
              <CardBones key={i} body="lines" />
            ))}
          </div>
        );
      default:
        return (
          <>
            <TileBones n={5} cols="grid-cols-2 md:grid-cols-5" />
            <CardBones body="table" />
          </>
        );
    }
  })();
  return (
    <Loading label={`Loading ${tab}`} className="space-y-4">
      {content}
    </Loading>
  );
}

/** The whole panel before the first answer: the header, the tab row and the tab's own shape. */
export function AdminSkeleton({ tab }: { tab: string }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <div className="-mx-4 border-b border-line px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="mr-auto text-lg font-bold">Liftsmith admin</h1>
          <Bone className="h-8 w-48 rounded-lg" />
          <Bone className="h-8 w-56 rounded-full" />
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {Array.from({ length: 20 }, (_, i) => (
            <Bone key={i} className={`h-8 rounded-lg ${["w-20", "w-16", "w-24", "w-14"][i % 4]}`} />
          ))}
        </div>
      </div>
      <div className="mt-4">
        <TabSkeleton tab={tab} />
      </div>
    </div>
  );
}
