"use client";
import { BRAND } from "@/lib/brand";
import { dayKey, liftBests, monthGrid, sessionDetail, trainingDays, weeklyTotals, yearGrid } from "@/lib/dashboard";
import { defaultProfile } from "@/lib/defaults";
import { derive } from "@/lib/derive";
import { can } from "@/lib/entitlements";
import { exerciseName, goalStreak, levelOf, trophies, xpTotal } from "@/lib/game";
import { load } from "@/lib/localdb";
import { track } from "@/lib/analytics";
import { MUSCLE_LABEL, MUSCLES, type AppEvent, type Profile, type Unit } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";
import { APP_PATH } from "@/lib/site";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LineChart, MonthCalendar, WeekBars, YearHeatmap } from "./Charts";
import { LogPast } from "./LogPast";
import { SharePanel } from "./Share";

// The web dashboard (/me/), Hevy-style big-screen view of your training: overview, a calendar of the
// days you trained, lift progress, history, trophies, logging a past workout, and a share link.
// It reads the same on-device event log as the app. Workouts from other devices arrive with sync.

const TABS = [
  ["overview", "Overview"],
  ["calendar", "Calendar"],
  ["lifts", "Lifts"],
  ["history", "History"],
  ["trophies", "Trophies"],
  ["log", "Log a workout"],
  ["share", "Share"],
] as const;
type Tab = (typeof TABS)[number][0];

const isTab = (s: string): s is Tab => TABS.some(([t]) => t === s);

function useTab(): [Tab, string | undefined, (t: Tab, arg?: string) => void] {
  const read = () => {
    const [t, arg] = (typeof location === "undefined" ? "" : location.hash.replace(/^#\/?/, "")).split("/");
    return { tab: isTab(t) ? t : ("overview" as Tab), arg };
  };
  const [st, setSt] = useState(read);
  useEffect(() => {
    const on = () => setSt(read());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const go = useCallback((t: Tab, arg?: string) => {
    location.hash = `#/${t}${arg ? `/${arg}` : ""}`;
  }, []);
  return [st.tab, st.arg, go];
}

const kgText = (kg: number, unit: Unit) => `${fmtNum(Math.round(fromKg(kg, unit)))} ${unit}`;
const tonnes = (kg: number, unit: Unit) => (unit === "kg" ? `${fmtNum(Math.round(kg / 100) / 10)} t` : `${fmtNum(Math.round(fromKg(kg, "lb") / 100) / 10)}k lb`);
const hours = (sec: number) => `${fmtNum(Math.round(sec / 360) / 10)} h`;
const dateText = (ms: number) => new Date(ms).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card min-w-0 p-5 ${className}`}>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">{title}</h2>
      {children}
    </section>
  );
}

function ProLock({ what }: { what: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line p-5 text-center">
      <p className="font-semibold">{what} is part of Pro</p>
      <p className="mt-1 text-sm text-muted">Pro is $6.99 a month or $39.99 a year, with a free trial. Start it in the app.</p>
    </div>
  );
}

export function Dashboard() {
  const [data, setData] = useState<{ events: AppEvent[]; profile: Profile } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [tab, arg, go] = useTab();

  const reload = useCallback(
    () =>
      load().then((snap) => {
        setNow(Date.now());
        setData({ events: snap.events, profile: snap.profile ?? defaultProfile() });
      }),
    [],
  );
  useEffect(() => {
    track("screen_view", { screen: "me" });
    load().then((snap) => {
      setNow(Date.now());
      setData({ events: snap.events, profile: snap.profile ?? defaultProfile() });
    });
    // Back from the app tab with new workouts: show them.
    const on = () => document.visibilityState === "visible" && void reload();
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, [reload]);

  const stats = useMemo(() => (data ? derive(data.events, now) : null), [data, now]);

  if (!data || !stats) return <div className="grid min-h-dvh place-items-center text-muted">Loading…</div>;
  const { events, profile } = data;
  const unit = profile.unit;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">{BRAND.name}</p>
          <h1 className="text-2xl font-bold">{profile.name.trim() ? `${profile.name.trim()}'s training` : "Your training"}</h1>
        </div>
        <a href={APP_PATH} className="press rounded-2xl bg-accent px-5 py-3 font-semibold text-accent-ink">Start a workout</a>
      </header>
      <nav aria-label="Dashboard" className="-mx-1 overflow-x-auto border-b border-line">
        <ul className="flex min-w-max gap-1 px-1">
          {TABS.map(([t, label]) => (
            <li key={t}>
              <a href={`#/${t}`} aria-current={tab === t ? "page" : undefined} className={`inline-block border-b-2 px-3 py-3 text-sm font-medium ${tab === t ? "border-accent text-ink" : "border-transparent text-muted"}`}>{label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <p className="mt-3 text-xs text-faint">Showing the workouts saved in this browser. Workouts from your phone will show here once sign-in and sync arrive.</p>

      <div className="mt-5">
        {tab === "overview" && <Overview events={events} profile={profile} stats={stats} now={now} go={go} />}
        {tab === "calendar" && <CalendarTab stats={stats} now={now} unit={unit} go={go} />}
        {tab === "lifts" && <Lifts events={events} stats={stats} unit={unit} />}
        {tab === "history" && <History events={events} stats={stats} unit={unit} open={arg} go={go} />}
        {tab === "trophies" && <Trophies events={events} stats={stats} profile={profile} />}
        {tab === "log" && <LogPast profile={profile} now={now} onSaved={(sid) => void reload().then(() => go("history", sid))} />}
        {tab === "share" && <SharePanel events={events} stats={stats} profile={profile} now={now} />}
      </div>
    </div>
  );
}

type Stats = ReturnType<typeof derive>;
type Go = (t: Tab, arg?: string) => void;

function Overview({ events, profile, stats, now, go }: { events: AppEvent[]; profile: Profile; stats: Stats; now: number; go: Go }) {
  const unit = profile.unit;
  const xp = xpTotal(stats);
  const lvl = levelOf(xp);
  const streak = goalStreak(stats, profile, now);
  const weeks = weeklyTotals(stats, now, 12);
  const days = trainingDays(stats);
  const tr = trophies(events, stats, profile);
  const nextTrophy = tr.find((t) => !t.earned);
  if (!stats.sessions.length) {
    return (
      <div className="card p-6">
        <h2 className="text-xl font-bold">No workouts here yet</h2>
        <p className="mt-2 text-muted">Start a workout in the app, or add one you&apos;ve already done.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={APP_PATH} className="press rounded-2xl bg-accent px-5 py-3 font-semibold text-accent-ink">Open the app</a>
          <button type="button" onClick={() => go("log")} className="press rounded-2xl border border-line bg-raised px-5 py-3">Log a past workout</button>
        </div>
      </div>
    );
  }
  const tiles: [string, string][] = [
    ["Workouts", fmtNum(stats.sessions.length)],
    ["Goal streak", `${streak.weeks} wk`],
    ["Sets", fmtNum(stats.totalSets)],
    ["Volume", tonnes(stats.totalVolume, unit)],
    ["Time lifting", hours(stats.totalSeconds)],
    ["PRs", fmtNum(stats.prs.length)],
  ];
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <section className="card p-5 lg:col-span-3" aria-label="Level">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-lg font-semibold">Level {lvl.level} · {lvl.title}</span>
          <span className="num text-sm text-muted">{fmtNum(xp)} XP{lvl.next ? ` · ${fmtNum(lvl.span - lvl.into)} to ${lvl.next}` : ""}</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-raised" role="progressbar" aria-label="Progress to the next level" aria-valuemin={0} aria-valuemax={lvl.span} aria-valuenow={lvl.into}>
          <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (lvl.into / lvl.span) * 100)}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted">This week: {streak.thisWeek} of {Math.max(1, profile.daysPerWeek)} training days{streak.needed ? `, ${streak.needed} to go` : ", goal met"}.</p>
      </section>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-3 lg:grid-cols-6">
        {tiles.map(([k, v]) => (
          <div key={k} className="card p-4">
            <dt className="text-xs uppercase tracking-wider text-faint">{k}</dt>
            <dd className="num mt-1 text-2xl font-bold">{v}</dd>
          </div>
        ))}
      </dl>
      <Panel title="Workouts a week" className="lg:col-span-2">
        <WeekBars weeks={weeks} value={(i) => weeks[i].sessions} format={(v) => `${v} workout${v === 1 ? "" : "s"}`} label="Workouts in each of the last 12 weeks" />
      </Panel>
      <Panel title="Recent PRs">
        <ul className="divide-y divide-line">
          {stats.prs.slice(0, 5).map((p) => (
            <li key={p.at + p.exerciseId} className="flex justify-between gap-2 py-2 text-sm">
              <span className="truncate">{exerciseName(p.exerciseId)}</span>
              <span className="num shrink-0 text-muted">{kgText(p.weight, unit)} × {p.reps}</span>
            </li>
          ))}
          {!stats.prs.length && <li className="py-2 text-sm text-muted">Beat a past best and it shows here.</li>}
        </ul>
      </Panel>
      <Panel title="Training days" className="lg:col-span-3">
        <YearHeatmap grid={yearGrid(now, 26)} days={days} onPick={(ms) => go("calendar", dayKey(ms))} />
      </Panel>
      {nextTrophy && (
        <Panel title="Next trophy" className="lg:col-span-3">
          <p><span className="font-semibold">{nextTrophy.name}</span> <span className="text-muted">· {nextTrophy.detail}</span></p>
        </Panel>
      )}
    </div>
  );
}

function CalendarTab({ stats, now, unit, go }: { stats: Stats; now: number; unit: Unit; go: Go }) {
  const days = trainingDays(stats);
  const initial = (() => {
    const [, arg] = location.hash.replace(/^#\/?/, "").split("/");
    return arg && /^\d{4}-\d{2}-\d{2}$/.test(arg) ? arg : null;
  })();
  const [selected, setSelected] = useState<string | null>(initial);
  const base = selected ? new Date(`${selected}T12:00:00`) : new Date(now);
  const [ym, setYm] = useState({ y: base.getFullYear(), m: base.getMonth() });
  const shift = (d: number) => setYm(({ y, m }) => ({ y: m + d < 0 ? y - 1 : m + d > 11 ? y + 1 : y, m: (m + d + 12) % 12 }));
  const month = new Date(ym.y, ym.m, 1).toLocaleDateString([], { month: "long", year: "numeric" });
  const daySessions = selected ? stats.sessions.filter((s) => dayKey(s.start) === selected) : [];
  const monthCount = stats.sessions.filter((s) => {
    const d = new Date(s.start);
    return d.getFullYear() === ym.y && d.getMonth() === ym.m;
  }).length;
  return (
    <div className="grid grid-cols-1 gap-4">
      <Panel title="The last year">
        <YearHeatmap
          grid={yearGrid(now)}
          days={days}
          onPick={(ms) => {
            const d = new Date(ms);
            setYm({ y: d.getFullYear(), m: d.getMonth() });
            setSelected(dayKey(ms));
          }}
        />
      </Panel>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2" aria-label={month}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <button type="button" onClick={() => shift(-1)} className="press h-11 w-11 rounded-xl border border-line bg-raised" aria-label="Previous month">‹</button>
            <h2 className="text-center font-semibold">{month} <span className="num font-normal text-muted">· {monthCount} workout{monthCount === 1 ? "" : "s"}</span></h2>
            <button type="button" onClick={() => shift(1)} className="press h-11 w-11 rounded-xl border border-line bg-raised" aria-label="Next month">›</button>
          </div>
          <MonthCalendar rows={monthGrid(ym.y, ym.m)} days={days} today={now} selected={selected} onPick={setSelected} />
        </section>
        <Panel title={selected ? dateText(new Date(`${selected}T12:00:00`).getTime()) : "Pick a day"}>
          {!selected && <p className="text-sm text-muted">Pick a day to see what you did.</p>}
          {selected && !daySessions.length && <p className="text-sm text-muted">Rest day.</p>}
          <ul className="space-y-3">
            {daySessions.map((s) => (
              <li key={s.sessionId}>
                <button type="button" onClick={() => go("history", s.sessionId)} className="press w-full rounded-2xl border border-line bg-raised p-3 text-left">
                  <span className="num block font-medium">{s.sets} sets · {tonnes(s.volume, unit)}{s.prs ? ` · ${s.prs} PR` : ""}</span>
                  <span className="mt-0.5 block text-sm text-muted">{s.exercises.map(exerciseName).join(", ")}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Lifts({ events, stats, unit }: { events: AppEvent[]; stats: Stats; unit: Unit }) {
  const bests = useMemo(() => liftBests(events), [events]);
  const pro = can("advancedStats");
  const charted = bests.filter((b) => (stats.e1rmSeries.get(b.exerciseId)?.length ?? 0) >= 2);
  const [pick, setPick] = useState<string>(charted[0]?.exerciseId ?? "");
  const series = stats.e1rmSeries.get(pick) ?? [];
  const week = stats.weeklyMuscleSets.at(-1)!;
  const lastWeek = stats.weeklyMuscleSets.at(-2)!;
  if (!bests.length) return <div className="card p-6 text-muted">Log a few sets and your lifts show here.</div>;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel title="Estimated one-rep max over time" className="lg:col-span-2">
        {!pro ? (
          <ProLock what="One-rep max trends" />
        ) : charted.length ? (
          <>
            <label className="mb-3 block max-w-sm">
              <span className="sr-only">Exercise</span>
              <select value={pick} onChange={(e) => setPick(e.target.value)} className="card w-full px-3 py-2">
                {charted.map((b) => <option key={b.exerciseId} value={b.exerciseId}>{exerciseName(b.exerciseId)}</option>)}
              </select>
            </label>
            <LineChart points={series.map((p) => [p.at, fromKg(p.e1rm, unit)])} format={(v) => `${fmtNum(Math.round(v))} ${unit}`} label={`${exerciseName(pick)} estimated one-rep max`} />
          </>
        ) : (
          <p className="text-sm text-muted">Train a weighted exercise in two sessions to draw its trend.</p>
        )}
      </Panel>
      <Panel title="Bests by exercise" className="lg:col-span-2">
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Bests by exercise, scrolls sideways">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-faint">
                <th scope="col" className="py-2 font-medium">Exercise</th>
                <th scope="col" className="py-2 text-right font-medium">Sessions</th>
                <th scope="col" className="py-2 text-right font-medium">Best e1RM</th>
                <th scope="col" className="py-2 text-right font-medium">From</th>
                <th scope="col" className="py-2 text-right font-medium">Heaviest</th>
                <th scope="col" className="py-2 text-right font-medium">Most reps</th>
              </tr>
            </thead>
            <tbody className="num">
              {bests.map((b) => (
                <tr key={b.exerciseId} className="border-b border-line/60">
                  <th scope="row" className="py-2 text-left font-medium">{exerciseName(b.exerciseId)}</th>
                  <td className="py-2 text-right">{b.sessions}</td>
                  <td className="py-2 text-right">{b.e1rm > 0 ? kgText(b.e1rm, unit) : "–"}</td>
                  <td className="py-2 text-right text-muted">{b.e1rmSet.weight > 0 ? `${kgText(b.e1rmSet.weight, unit)} × ${b.e1rmSet.reps}` : "–"}</td>
                  <td className="py-2 text-right">{b.heaviest > 0 ? kgText(b.heaviest, unit) : "Bodyweight"}</td>
                  <td className="py-2 text-right">{b.mostReps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Hard sets per muscle this week" className="lg:col-span-2">
        {!pro ? (
          <ProLock what="Weekly sets per muscle" />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="sr-only">
                <tr><th scope="col">Muscle</th><th scope="col">Sets this week</th><th scope="col">Last week</th></tr>
              </thead>
              <tbody>
                {MUSCLES.filter((m) => week.sets[m] > 0 || lastWeek.sets[m] > 0).sort((a, b) => week.sets[b] - week.sets[a]).map((m) => (
                  <tr key={m}>
                    <th scope="row" className="w-28 py-1 pr-3 text-left font-normal text-muted">{MUSCLE_LABEL[m]}</th>
                    <td className="py-1">
                      <div className="relative h-2.5 rounded-full bg-raised">
                        <div className="absolute inset-y-0 rounded-full bg-good/15" style={{ left: "50%", width: "50%" }} />
                        <div className="relative h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (week.sets[m] / 20) * 100)}%` }} />
                      </div>
                    </td>
                    <td className="num w-28 py-1 pl-3 text-right">{fmtNum(week.sets[m])} <span className="text-faint">(last wk {fmtNum(lastWeek.sets[m])})</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-faint">The shaded band is 10 to 20 hard sets a week. Secondary muscles count half a set.</p>
          </>
        )}
      </Panel>
    </div>
  );
}

function History({ events, stats, unit, open, go }: { events: AppEvent[]; stats: Stats; unit: Unit; open?: string; go: Go }) {
  const [shown, setShown] = useState(30);
  const detail = open ? sessionDetail(events, open) : null;
  if (!stats.sessions.length) return <div className="card p-6 text-muted">No workouts yet.</div>;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <ul className="card divide-y divide-line lg:col-span-2" aria-label="Workouts">
        {stats.sessions.slice(0, shown).map((s) => (
          <li key={s.sessionId}>
            <button type="button" aria-current={open === s.sessionId ? "true" : undefined} onClick={() => go("history", s.sessionId)} className={`w-full px-4 py-3 text-left ${open === s.sessionId ? "bg-accent/10" : ""}`}>
              <span className="flex justify-between gap-2">
                <span className="font-medium">{dateText(s.start)}</span>
                <span className="num text-sm text-muted">{s.sets} sets{s.prs ? ` · ${s.prs} PR` : ""}</span>
              </span>
              <span className="mt-0.5 block truncate text-sm text-muted">{s.exercises.map(exerciseName).join(", ")}</span>
            </button>
          </li>
        ))}
        {stats.sessions.length > shown && (
          <li><button type="button" onClick={() => setShown((n) => n + 30)} className="w-full px-4 py-3 text-accent">Show more</button></li>
        )}
      </ul>
      <section className="card p-5 lg:sticky lg:top-4 lg:col-span-3 lg:self-start" aria-label="Workout details">
        {!detail ? (
          <p className="text-muted">Pick a workout to see every set.</p>
        ) : (
          <SessionView detail={detail} summary={stats.sessions.find((s) => s.sessionId === detail.sessionId)!} unit={unit} />
        )}
      </section>
    </div>
  );
}

function SessionView({ detail, summary, unit }: { detail: NonNullable<ReturnType<typeof sessionDetail>>; summary: Stats["sessions"][number]; unit: Unit }) {
  const facts = [
    `${Math.round(summary.seconds / 60)} min`,
    `${summary.sets} sets`,
    tonnes(summary.volume, unit),
    ...(summary.avgHr ? [`avg ${summary.avgHr} bpm`] : []),
    ...(summary.prs ? [`${summary.prs} PR${summary.prs > 1 ? "s" : ""}`] : []),
  ];
  return (
    <>
      <h2 className="text-lg font-semibold">{dateText(detail.start)}</h2>
      <p className="num text-sm text-muted">{facts.join(" · ")}{detail.manual ? " · logged by hand" : ""}</p>
      <div className="mt-4 space-y-4">
        {detail.exercises.map((g, i) => (
          <div key={i}>
            <h3 className="font-medium">{exerciseName(g.exerciseId)}</h3>
            <table className="mt-1 w-full text-sm">
              <thead className="sr-only"><tr><th scope="col">Set</th><th scope="col">Weight and reps</th></tr></thead>
              <tbody className="num">
                {g.sets.map((s, j) => (
                  <tr key={s.id} className="border-b border-line/60">
                    <td className="w-12 py-1 text-faint">{j + 1}</td>
                    <td className="py-1">{s.weight > 0 ? `${kgText(s.weight, unit)} × ${s.reps}` : `${s.reps} reps`}{s.challenge ? " · challenge" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </>
  );
}

function Trophies({ events, stats, profile }: { events: AppEvent[]; stats: Stats; profile: Profile }) {
  const tr = trophies(events, stats, profile);
  const earned = tr.filter((t) => t.earned).length;
  return (
    <div>
      <p className="mb-4 text-muted">{earned} of {tr.length} earned.</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tr.map((t) => (
          <li key={t.id} className={`card p-4 ${t.earned ? "" : "border-dashed"}`}>
            <div className={`text-2xl ${t.earned ? "" : "grayscale"}`} aria-hidden>{t.earned ? (t.tier === "gold" ? "🥇" : t.tier === "silver" ? "🥈" : "🥉") : "🔒"}</div>
            <div className="mt-2 font-semibold">{t.name}</div>
            <div className="text-sm text-muted">{t.detail}</div>
            <div className="mt-1 text-xs text-faint">{t.earned ? "Earned" : "Not yet"}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
