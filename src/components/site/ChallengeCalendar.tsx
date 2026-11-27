"use client";

// The calendar on a 30-day challenge page (ChallengeView.tsx, docs/decisions/thirty-day-challenges.md): pick a level,
// see its 30 days, print them as one page that carries the site's address and a code to scan, or join in the app at
// that level. Every word and number comes from the server as props, so no catalogue reaches the browser.
import Link from "next/link";
import { useState, type ReactNode } from "react";

import type { ThirtyLevel } from "@/lib/thirtyDay";

export interface CalendarLevel {
  level: ThirtyLevel;
  label: string;
  /** "Day 1 is 15 reps and day 30 is 100 reps…" */
  intro: string;
  /** The exercise at this level, when it differs from the others ("Knee push-up"). */
  lift: string;
  days: { day: number; rest: boolean; amount: string }[];
  /** The app's challenge screen at this level. */
  join: string;
}

export interface CalendarWords {
  level: string;
  day: string;
  rest: string;
  print: string;
  printNote: string;
  join: string;
  joinBody: string;
  sheetName: string;
  sheetStart: string;
  sheetFoot: string;
  qr: string;
  unit: string;
}

export function ChallengeCalendar({
  name,
  levels,
  words,
  site,
  qr,
  cta,
}: {
  name: string;
  levels: CalendarLevel[];
  words: CalendarWords;
  /** The page's address as printed ("www.getliftsmith.com/challenges/…"). */
  site: string;
  /** The code printed on the sheet (drawn on the server). */
  qr: ReactNode;
  cta: string;
}) {
  const [pick, setPick] = useState<ThirtyLevel>("beginner");
  const lv = levels.find((l) => l.level === pick) ?? levels[0]!;
  return (
    <div>
      <div role="group" aria-label={words.level} className="print-hide flex flex-wrap gap-2">
        {levels.map((l) => (
          <button
            key={l.level}
            type="button"
            aria-pressed={l.level === pick}
            onClick={() => setPick(l.level)}
            className={`press inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold ${
              l.level === pick ? "border-accent bg-accent/15 text-ink" : "border-line text-muted"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <p className="print-hide mt-3 max-w-3xl text-muted">{lv.intro}</p>

      <section className="print-sheet card mt-4 p-4 md:p-6" aria-label={`${name} · ${lv.label}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-xl font-extrabold tracking-tight">{name}</h3>
          <p className="text-sm font-semibold text-muted">
            {lv.label} · {lv.lift} · {words.unit}
          </p>
        </div>
        <div className="print-only mt-3 grid grid-cols-2 gap-6 text-sm">
          <p className="border-b border-line pb-1">{words.sheetName}:</p>
          <p className="border-b border-line pb-1">{words.sheetStart}:</p>
        </div>
        <ol className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
          {lv.days.map((d) => (
            <li
              key={d.day}
              className={`flex min-h-16 flex-col justify-between rounded-xl border border-line p-2 ${d.rest ? "opacity-70" : ""}`}
            >
              <span className="flex items-center justify-between text-xs text-muted">
                <span>{words.day.replace("{n}", String(d.day))}</span>
                <span className="inline-block size-4 rounded border border-line" aria-hidden />
              </span>
              <span className="num mt-1 text-lg font-bold">{d.rest ? words.rest : d.amount}</span>
            </li>
          ))}
        </ol>
        <div className="print-only mt-4 flex items-center justify-between gap-4 text-sm">
          <p>{words.sheetFoot.replace("{site}", site)}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs">{words.qr}</span>
            <span className="block size-20">{qr}</span>
          </div>
        </div>
      </section>

      <div className="print-hide mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          data-cta={`${cta}-print`}
          className="press inline-flex min-h-12 items-center rounded-2xl border border-line px-6 font-semibold"
        >
          {words.print}
        </button>
        <Link
          href={lv.join}
          prefetch={false}
          data-cta={`${cta}-join`}
          className="press btn-primary inline-flex min-h-12 items-center rounded-2xl px-6 font-semibold"
        >
          {words.join}
        </Link>
      </div>
      <p className="print-hide mt-2 text-sm text-muted">{words.printNote}</p>
      <p className="print-hide mt-1 text-sm text-muted">{words.joinBody}</p>
    </div>
  );
}
