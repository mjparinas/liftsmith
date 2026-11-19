"use client";

// The Seasons tab (src/lib/seasons.ts, /api/admin/seasons/): the season schedule, a form to add the next season and
// edit ones that haven't started. A season picks a reward set (kit) that ships with the app, because its app icons
// are native files; a new kit comes with an app release. A season that has started can't change, so nobody's tier
// or rewards move after the fact. The app reads the schedule from /api/seasons/.
import { useEffect, useState } from "react";

import {
  BUILT_IN,
  challengeGoal,
  changeProblem,
  KITS,
  MAX_WEEKS,
  MIN_WEEKS,
  seasonWindow,
  type ChallengeDef,
  type SeasonDef,
} from "@/lib/seasons";

import { Card } from "./charts";

const day = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

/** The next Monday after `ms`, as "YYYY-MM-DD". */
function nextMonday(ms: number): string {
  const d = new Date(ms);
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The season challenges in the admin's English (the app's words are ssn.ch.* in every language). */
function challengeLine(c: ChallengeDef, weeks: number): string {
  const n = challengeGoal(c, weeks);
  switch (c.id) {
    case "goal-weeks":
      return `Meet the weekly goal in ${n} weeks`;
    case "prs":
      return `${n} new bests`;
    case "new-ex":
      return `Try ${n} new exercises`;
    case "streak":
      return `Meet the goal ${n} weeks in a row`;
    case "pr-lifts":
      return `New bests on ${n} different exercises`;
    case "quests":
      return `${n} weekly quests`;
    case "bookends":
      return "Meet the goal in the first and last week";
    case "stretch":
      return `${n} stretch routines of 10+ minutes on their own`;
  }
}

/** A reward set's look and challenges, so the schedule shows what each season brings. */
function KitSummary({ kit, weeks }: { kit: string; weeks: number }) {
  const k = KITS[kit];
  if (!k) return null;
  const themes = k.rewards.filter((r) => r.kind === "theme");
  return (
    <span className="block w-full text-xs text-muted">
      <span aria-hidden className="mr-1.5 inline-block size-2.5 rounded-full align-middle" style={{ background: k.hue }} />
      Themes and app icons: {themes.map((r) => `${r.id}${r.pro ? " (Pro)" : ""}`).join(", ")} · rare drop {k.drop} · challenges:{" "}
      {k.challenges.map((c) => challengeLine(c, weeks)).join("; ")}
    </span>
  );
}

export function Seasons({ admin }: { admin: boolean }) {
  const [list, setList] = useState<SeasonDef[] | null>(null);
  const [saved, setSaved] = useState<SeasonDef[]>([]);
  const [kits, setKits] = useState<string[]>([]);
  const [now, setNow] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/admin/seasons/")
      .then(async (r) => {
        if (!r.ok || !live) return;
        const j = (await r.json()) as { seasons: SeasonDef[]; kits: string[]; now: number };
        setList(j.seasons);
        setSaved(j.seasons);
        setKits(j.kits);
        setNow(j.now);
      })
      .catch(() => setMsg("The schedule didn't load."));
    return () => {
      live = false;
    };
  }, []);
  if (!list) return msg ? <p className="text-sm text-muted">{msg}</p> : null;
  const started = (s: SeasonDef) => seasonWindow(s).start - 86400_000 <= now;
  const unused = kits.filter((k) => !list.some((s) => s.kit === k));
  const change = (id: string, patch: Partial<SeasonDef>) => setList(list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const problem = changeProblem(saved, list, now);
  const dirty = JSON.stringify(list) !== JSON.stringify(saved);
  const add = () => {
    const last = [...list].sort((a, b) => a.start.localeCompare(b.start)).at(-1);
    const after = last ? seasonWindow(last).end : now;
    let n = list.length + 1;
    while (list.some((s) => s.id === `s${n}`)) n++;
    setList([...list, { id: `s${n}`, kit: unused[0]!, start: nextMonday(Math.max(after - 86400_000, now)), weeks: 10 }]);
  };
  const save = async () => {
    const r = await fetch("/api/admin/seasons/", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seasons: list }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string; seasons?: SeasonDef[] };
    if (r.ok && j.seasons) {
      setList(j.seasons);
      setSaved(j.seasons);
    }
    setMsg(r.ok ? "Saved. The app picks it up the next time it opens." : (j.error ?? "That didn't save."));
  };
  return (
    <div className="space-y-4">
      <Card
        title="Season schedule"
        subtitle={`Training seasons of ${MIN_WEEKS} to ${MAX_WEEKS} weeks, each starting on a Monday with a reward set that ships with the app. The built-in plan runs back to back through 2027 and starts and ends on its own; change or remove any season that hasn't started. A season that has started can't change.`}
      >
        <ul className="divide-y divide-line text-sm">
          {list.map((s, i) => {
            const w = seasonWindow(s);
            const locked = started(s) && saved.some((x) => x.id === s.id);
            const status = now >= w.end ? "Ended" : now >= w.start ? "Running" : "Upcoming";
            return (
              <li key={s.id} className="flex flex-wrap items-end gap-3 py-3">
                <span className="w-24">
                  <span className="block font-semibold">Season {i + 1}</span>
                  <span className="block text-xs text-muted">
                    {status}
                    {BUILT_IN.has(s.id) ? " · built in" : ""}
                  </span>
                </span>
                <label className="block">
                  <span className="block text-xs text-muted">Reward set</span>
                  <select
                    value={s.kit}
                    disabled={locked || !admin}
                    onChange={(e) => change(s.id, { kit: e.target.value })}
                    className="card mt-1 px-2 py-1.5"
                  >
                    {[s.kit, ...unused.filter((k) => k !== s.kit)].map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs text-muted">First day (a Monday)</span>
                  <input
                    type="date"
                    value={s.start}
                    disabled={locked || !admin}
                    onChange={(e) => change(s.id, { start: e.target.value })}
                    className="card mt-1 px-2 py-1.5"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs text-muted">Weeks</span>
                  <input
                    type="number"
                    min={MIN_WEEKS}
                    max={MAX_WEEKS}
                    value={s.weeks}
                    disabled={locked || !admin}
                    onChange={(e) => change(s.id, { weeks: Number(e.target.value) })}
                    className="card mt-1 w-20 px-2 py-1.5"
                  />
                </label>
                <span className="text-xs text-muted">
                  {day(w.start)} to {day(w.end - 86400_000)}
                </span>
                {!locked && admin && !started(s) && (
                  <button type="button" className="text-xs text-muted underline" onClick={() => setList(list.filter((x) => x.id !== s.id))}>
                    Remove
                  </button>
                )}
                <KitSummary kit={s.kit} weeks={s.weeks} />
              </li>
            );
          })}
        </ul>
        {admin && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {unused.length ? (
              <button type="button" className="press rounded-lg border border-line px-3 py-1.5" onClick={add}>
                Add the next season
              </button>
            ) : (
              <span className="text-muted">Every reward set in this build is scheduled. A new set comes with an app release.</span>
            )}
            <button
              type="button"
              disabled={!dirty || !!problem}
              className="press rounded-lg bg-accent px-3 py-1.5 font-semibold text-accent-ink disabled:opacity-50"
              onClick={() => void save()}
            >
              Save schedule
            </button>
          </div>
        )}
        {dirty && problem && <p className="mt-2 text-sm text-warn">{problem}</p>}
        {msg && (
          <p role="status" className="mt-2 text-sm text-muted">
            {msg}
          </p>
        )}
      </Card>
      <Card title="How a season works" subtitle="The rules in src/lib/seasons.ts, the same for every lifter.">
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          <li>20 tiers of 400 points. Past tier 20, a prestige star every 1,000 points.</li>
          <li>
            Points come from training toward the lifter&apos;s own weekly goal: 600 a week shared over the goal days, 200 for meeting it
            (twice after a missed week), 50 per weekly quest, 500 per season challenge. Days past the goal earn nothing.
          </li>
          <li>The last week counts double. Each new best during the season has a 1 in 6 chance to drop the rare item.</li>
          <li>Pro bonus rewards count when the lifter had Pro in any month of the season.</li>
          <li>Each reward set brings its own three season challenges, so no two seasons ask the same.</li>
        </ul>
      </Card>
    </div>
  );
}
