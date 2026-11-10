"use client";
import { Info } from "@/components/Info";
import type { Term } from "@/lib/glossary";
import { applyA11y, savedA11y } from "@/lib/a11y";
import { applyAppearance, savedAppearance } from "@/lib/appearance";
import { BRAND } from "@/lib/brand";
import { date, readPhoneLanguage, setLanguage, t } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
import { dayKey, liftBests, monthGrid, sessionDetail, trainingDays, weeklyTotals, yearGrid } from "@/lib/dashboard";
import { defaultProfile } from "@/lib/defaults";
import { derive, setWeekStart } from "@/lib/derive";
import { can } from "@/lib/entitlements";
import { exerciseName, game } from "@/lib/game";
import { CATEGORY_LABEL, type Category } from "@/lib/achievements";
import { AchievementRow, Badge, Bar, LeagueCard, QuestsCard, StreakCard, TIER_COLOUR } from "@/components/app/Achievements";
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
// days you trained, lift progress, history, achievements, logging a past workout, and a share link.
// It reads the same on-device event log as the app. Workouts from other devices arrive with sync.

const TABS = ["overview", "calendar", "lifts", "history", "trophies", "log", "share"] as const;
type Tab = (typeof TABS)[number];

const isTab = (s: string): s is Tab => (TABS as readonly string[]).includes(s);

function useTab(): [Tab, string | undefined, (t: Tab, arg?: string) => void] {
  const read = () => {
    const [tab, arg] = (typeof location === "undefined" ? "" : location.hash.replace(/^#\/?/, "")).split("/");
    return { tab: isTab(tab) ? tab : ("overview" as Tab), arg };
  };
  const [st, setSt] = useState(read);
  useEffect(() => {
    const on = () => setSt(read());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const go = useCallback((to: Tab, arg?: string) => {
    location.hash = `#/${to}${arg ? `/${arg}` : ""}`;
  }, []);
  return [st.tab, st.arg, go];
}

const kgText = (kg: number, unit: Unit) => `${fmtNum(Math.round(fromKg(kg, unit)))} ${unit}`;
const tonnes = (kg: number, unit: Unit) => (unit === "kg" ? `${fmtNum(Math.round(kg / 100) / 10)} t` : `${fmtNum(Math.round(fromKg(kg, "lb") / 100) / 10)}k lb`);
const hours = (sec: number) => `${fmtNum(Math.round(sec / 360) / 10)} h`;
const dateText = (ms: number) => date(ms, { weekday: "short", month: "short", day: "numeric", year: "numeric" });

function Panel({ title, children, className = "", info }: { title: string; children: React.ReactNode; className?: string; info?: Term }) {
  return (
    <section className={`card min-w-0 p-5 ${className}`}>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">{title}{info && <Info term={info} />}</h2>
      {children}
    </section>
  );
}

function ProLock({ what }: { what: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line p-5 text-center">
      <p className="font-semibold">{t("dash.proLock", { what })}</p>
      <p className="mt-1 text-sm text-muted">{t("dash.proLockBody")}</p>
    </div>
  );
}

export function Dashboard() {
  const [data, setData] = useState<{ events: AppEvent[]; profile: Profile } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [tab, arg, go] = useTab();
  useLang();
  const language = data?.profile.language;
  useEffect(() => {
    setLanguage(language);
    void readPhoneLanguage();
  }, [language]);

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
    applyAppearance(savedAppearance());
    applyA11y(savedA11y());
    void load().then((snap) => {
      setNow(Date.now());
      setData({ events: snap.events, profile: snap.profile ?? defaultProfile() });
      applyAppearance(snap.profile?.theme ?? "dark");
      applyA11y(snap.profile?.a11y);
    });
    // Back from the app tab with new workouts: show them.
    const on = () => document.visibilityState === "visible" && void reload();
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, [reload]);

  const stats = useMemo(() => {
    if (!data) return null;
    setWeekStart(data.profile.training?.weekStart);
    return derive(data.events, now);
  }, [data, now]);

  if (!data || !stats) return <div className="grid min-h-dvh place-items-center text-muted">{t("dash.loading")}</div>;
  const { events, profile } = data;
  const unit = profile.unit;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">{BRAND.name}</p>
          <h1 className="text-2xl font-bold">{profile.name.trim() ? t("dash.titleNamed", { name: profile.name.trim() }) : t("dash.title")}</h1>
        </div>
        <a href={APP_PATH} className="press rounded-2xl bg-accent px-5 py-3 font-semibold text-accent-ink">{t("dash.start")}</a>
      </header>
      <nav aria-label={t("dash.nav")} className="-mx-1 overflow-x-auto border-b border-line">
        <ul className="flex min-w-max gap-1 px-1">
          {TABS.map((id) => (
            <li key={id}>
              <a href={`#/${id}`} aria-current={tab === id ? "page" : undefined} className={`inline-block border-b-2 px-3 py-3 text-sm font-medium ${tab === id ? "border-accent text-ink" : "border-transparent text-muted"}`}>{t(`dash.tab.${id}`)}</a>
            </li>
          ))}
        </ul>
      </nav>
      <p className="mt-3 text-xs text-faint">{t("dash.localOnly")}</p>

      <div className="mt-5">
        {tab === "overview" && <Overview events={events} profile={profile} stats={stats} now={now} go={go} />}
        {tab === "calendar" && <CalendarTab stats={stats} now={now} unit={unit} go={go} />}
        {tab === "lifts" && <Lifts events={events} stats={stats} unit={unit} />}
        {tab === "history" && <History events={events} stats={stats} unit={unit} open={arg} go={go} />}
        {tab === "trophies" && <Trophies events={events} stats={stats} profile={profile} now={now} />}
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
  const g = useMemo(() => game(events, stats, profile, now), [events, stats, profile, now]);
  const xp = g.xp;
  const lvl = g.level;
  const streak = g.streak;
  const weeks = weeklyTotals(stats, now, 12);
  const days = trainingDays(stats);
  if (!stats.sessions.length) {
    return (
      <div className="card p-6">
        <h2 className="text-xl font-bold">{t("dash.empty")}</h2>
        <p className="mt-2 text-muted">{t("dash.emptyBody")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={APP_PATH} className="press rounded-2xl bg-accent px-5 py-3 font-semibold text-accent-ink">{t("dash.openApp")}</a>
          <button type="button" onClick={() => go("log")} className="press rounded-2xl border border-line bg-raised px-5 py-3">{t("dash.logPast")}</button>
        </div>
      </div>
    );
  }
  const tiles: [string, string][] = [
    [t("dash.workouts"), fmtNum(stats.sessions.length)],
    [t("dash.goalStreak"), t("dash.weeksShort", { n: streak.weeks })],
    [t("dash.sets"), fmtNum(stats.totalSets)],
    [t("dash.volume"), tonnes(stats.totalVolume, unit)],
    [t("dash.timeLifting"), hours(stats.totalSeconds)],
    [t("dash.prs"), fmtNum(stats.prs.length)],
  ];
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <section className="card p-5 lg:col-span-3" aria-label={t("dash.level")}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-lg font-semibold">{t("dash.levelTitle", { level: lvl.level, title: lvl.title })}</span>
          <span className="num text-sm text-muted">{lvl.next ? t("dash.xpTo", { xp: fmtNum(xp), left: fmtNum(lvl.span - lvl.into), next: lvl.next }) : t("dash.xp", { xp: fmtNum(xp) })}</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-raised" role="progressbar" aria-label={t("awards.levelProgress")} aria-valuemin={0} aria-valuemax={lvl.span} aria-valuenow={lvl.into}>
          <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (lvl.into / lvl.span) * 100)}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted">{t(streak.needed ? "dash.weekGoal" : "dash.weekGoalMet", { done: streak.thisWeek, count: Math.max(1, profile.daysPerWeek), left: streak.needed })}</p>
      </section>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-3 lg:grid-cols-6">
        {tiles.map(([k, v]) => (
          <div key={k} className="card p-4">
            <dt className="text-xs uppercase tracking-wider text-faint">{k}</dt>
            <dd className="num mt-1 text-2xl font-bold">{v}</dd>
          </div>
        ))}
      </dl>
      <Panel title={t("dash.perWeek")} className="lg:col-span-2">
        <WeekBars weeks={weeks} value={(i) => weeks[i].sessions} format={(v) => t("dash.workoutsN", { count: v })} label={t("dash.weeksLabel")} />
      </Panel>
      <Panel title={t("dash.recentPrs")}>
        <ul className="divide-y divide-line">
          {stats.prs.slice(0, 5).map((p) => (
            <li key={p.at + p.exerciseId} className="flex justify-between gap-2 py-2 text-sm">
              <span className="truncate">{exerciseName(p.exerciseId)}</span>
              <span className="num shrink-0 text-muted">{kgText(p.weight, unit)} × {p.reps}</span>
            </li>
          ))}
          {!stats.prs.length && <li className="py-2 text-sm text-muted">{t("dash.noPrs")}</li>}
        </ul>
      </Panel>
      <Panel title={t("dash.days")} className="lg:col-span-3">
        <YearHeatmap grid={yearGrid(now, 26)} days={days} onPick={(ms) => go("calendar", dayKey(ms))} />
      </Panel>
      <Panel title={t("dash.quests")}>
        <QuestsCard g={g} />
      </Panel>
      <Panel title={t("dash.leagueStreak")}>
        <div className="space-y-3"><LeagueCard g={g} /><StreakCard g={g} /></div>
      </Panel>
      <Panel title={t("dash.almost", { earned: g.badges.earned, total: g.badges.total })}>
        <ul className="divide-y divide-line">
          {g.nearest.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-2">
              <Badge a={a} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.next?.detail ?? a.detail}</p>
                <div className="mt-1"><Bar value={a.progress} label={t("awards.progress", { name: a.name })} colour={a.next ? TIER_COLOUR[a.next.tier] : undefined} /></div>
              </div>
            </li>
          ))}
          {!g.nearest.length && <li className="py-2 text-sm text-muted">{t("dash.allDone")}</li>}
        </ul>
        <button type="button" onClick={() => go("trophies")} className="press mt-3 text-sm text-accent">{t("dash.seeAll")}</button>
      </Panel>
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
  const month = date(new Date(ym.y, ym.m, 1), { month: "long", year: "numeric" });
  const daySessions = selected ? stats.sessions.filter((s) => dayKey(s.start) === selected) : [];
  const monthCount = stats.sessions.filter((s) => {
    const d = new Date(s.start);
    return d.getFullYear() === ym.y && d.getMonth() === ym.m;
  }).length;
  return (
    <div className="grid grid-cols-1 gap-4">
      <Panel title={t("dash.lastYear")}>
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
            <button type="button" onClick={() => shift(-1)} className="press h-11 w-11 rounded-xl border border-line bg-raised" aria-label={t("dash.prevMonth")}>‹</button>
            <h2 className="text-center font-semibold">{month} <span className="num font-normal text-muted">· {t("dash.workoutsN", { count: monthCount })}</span></h2>
            <button type="button" onClick={() => shift(1)} className="press h-11 w-11 rounded-xl border border-line bg-raised" aria-label={t("dash.nextMonth")}>›</button>
          </div>
          <MonthCalendar rows={monthGrid(ym.y, ym.m)} days={days} today={now} selected={selected} onPick={setSelected} />
        </section>
        <Panel title={selected ? dateText(new Date(`${selected}T12:00:00`).getTime()) : t("dash.pickDay")}>
          {!selected && <p className="text-sm text-muted">{t("dash.pickDayBody")}</p>}
          {selected && !daySessions.length && <p className="text-sm text-muted">{t("dash.restDay")}</p>}
          <ul className="space-y-3">
            {daySessions.map((s) => (
              <li key={s.sessionId}>
                <button type="button" onClick={() => go("history", s.sessionId)} className="press w-full rounded-2xl border border-line bg-raised p-3 text-left">
                  <span className="num block font-medium">{[t("dash.setsN", { count: s.sets }), tonnes(s.volume, unit), ...(s.prs ? [t("dash.prN", { count: s.prs })] : [])].join(" · ")}</span>
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
  if (!bests.length) return <div className="card p-6 text-muted">{t("dash.noLifts")}</div>;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel title={t("dash.e1rm")} className="lg:col-span-2" info="e1rm">
        {!pro ? (
          <ProLock what={t("dash.e1rmLock")} />
        ) : charted.length ? (
          <>
            <label className="mb-3 block max-w-sm">
              <span className="sr-only">{t("dash.exercise")}</span>
              <select value={pick} onChange={(e) => setPick(e.target.value)} className="card w-full px-3 py-2">
                {charted.map((b) => <option key={b.exerciseId} value={b.exerciseId}>{exerciseName(b.exerciseId)}</option>)}
              </select>
            </label>
            <LineChart points={series.map((p) => [p.at, fromKg(p.e1rm, unit)])} format={(v) => `${fmtNum(Math.round(v))} ${unit}`} label={t("dash.e1rmOf", { name: exerciseName(pick) })} />
          </>
        ) : (
          <p className="text-sm text-muted">{t("dash.e1rmNeed")}</p>
        )}
      </Panel>
      <Panel title={t("dash.bests")} className="lg:col-span-2">
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={t("dash.bestsScroll")}>
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-faint">
                <th scope="col" className="py-2 font-medium">{t("dash.exercise")}</th>
                <th scope="col" className="py-2 text-right font-medium">{t("dash.col.sessions")}</th>
                <th scope="col" className="py-2 text-right font-medium">{t("dash.col.e1rm")}</th>
                <th scope="col" className="py-2 text-right font-medium">{t("dash.col.from")}</th>
                <th scope="col" className="py-2 text-right font-medium">{t("dash.col.heaviest")}</th>
                <th scope="col" className="py-2 text-right font-medium">{t("dash.col.mostReps")}</th>
              </tr>
            </thead>
            <tbody className="num">
              {bests.map((b) => (
                <tr key={b.exerciseId} className="border-b border-line/60">
                  <th scope="row" className="py-2 text-left font-medium">{exerciseName(b.exerciseId)}</th>
                  <td className="py-2 text-right">{b.sessions}</td>
                  <td className="py-2 text-right">{b.e1rm > 0 ? kgText(b.e1rm, unit) : "–"}</td>
                  <td className="py-2 text-right text-muted">{b.e1rmSet.weight > 0 ? `${kgText(b.e1rmSet.weight, unit)} × ${b.e1rmSet.reps}` : "–"}</td>
                  <td className="py-2 text-right">{b.heaviest > 0 ? kgText(b.heaviest, unit) : t("dash.bodyweight")}</td>
                  <td className="py-2 text-right">{b.mostReps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title={t("dash.muscleSets")} className="lg:col-span-2" info="weeklySets">
        {!pro ? (
          <ProLock what={t("dash.muscleLock")} />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="sr-only">
                <tr><th scope="col">{t("dash.col.muscle")}</th><th scope="col">{t("dash.col.thisWeek")}</th><th scope="col">{t("dash.col.lastWeek")}</th></tr>
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
                    <td className="num w-28 py-1 pl-3 text-right">{fmtNum(week.sets[m])} <span className="text-faint">{t("dash.lastWk", { n: fmtNum(lastWeek.sets[m]) })}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-faint">{t("dash.band")}</p>
          </>
        )}
      </Panel>
    </div>
  );
}

function History({ events, stats, unit, open, go }: { events: AppEvent[]; stats: Stats; unit: Unit; open?: string; go: Go }) {
  const [shown, setShown] = useState(30);
  const detail = open ? sessionDetail(events, open) : null;
  if (!stats.sessions.length) return <div className="card p-6 text-muted">{t("dash.noWorkouts")}</div>;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <ul className="card divide-y divide-line lg:col-span-2" aria-label={t("dash.list")}>
        {stats.sessions.slice(0, shown).map((s) => (
          <li key={s.sessionId}>
            <button type="button" aria-current={open === s.sessionId ? "true" : undefined} onClick={() => go("history", s.sessionId)} className={`w-full px-4 py-3 text-left ${open === s.sessionId ? "bg-accent/10" : ""}`}>
              <span className="flex justify-between gap-2">
                <span className="font-medium">{dateText(s.start)}</span>
                <span className="num text-sm text-muted">{t("dash.setsN", { count: s.sets })}{s.prs ? ` · ${t("dash.prN", { count: s.prs })}` : ""}</span>
              </span>
              <span className="mt-0.5 block truncate text-sm text-muted">{s.exercises.map(exerciseName).join(", ")}</span>
            </button>
          </li>
        ))}
        {stats.sessions.length > shown && (
          <li><button type="button" onClick={() => setShown((n) => n + 30)} className="w-full px-4 py-3 text-accent">{t("dash.more")}</button></li>
        )}
      </ul>
      <section className="card p-5 lg:sticky lg:top-4 lg:col-span-3 lg:self-start" aria-label={t("dash.details")}>
        {!detail ? (
          <p className="text-muted">{t("dash.pickWorkout")}</p>
        ) : (
          <SessionView detail={detail} summary={stats.sessions.find((s) => s.sessionId === detail.sessionId)!} unit={unit} />
        )}
      </section>
    </div>
  );
}

function SessionView({ detail, summary, unit }: { detail: NonNullable<ReturnType<typeof sessionDetail>>; summary: Stats["sessions"][number]; unit: Unit }) {
  const facts = [
    t("dash.min", { n: Math.round(summary.seconds / 60) }),
    t("dash.setsN", { count: summary.sets }),
    tonnes(summary.volume, unit),
    ...(summary.avgHr ? [t("dash.avgHr", { n: summary.avgHr })] : []),
    ...(summary.prs ? [t("dash.prN", { count: summary.prs })] : []),
  ];
  return (
    <>
      <h2 className="text-lg font-semibold">{dateText(detail.start)}</h2>
      <p className="num text-sm text-muted">{facts.join(" · ")}{detail.manual ? t("dash.byHand") : ""}</p>
      <div className="mt-4 space-y-4">
        {detail.exercises.map((g, i) => (
          <div key={i}>
            <h3 className="font-medium">{exerciseName(g.exerciseId)}</h3>
            <table className="mt-1 w-full text-sm">
              <thead className="sr-only"><tr><th scope="col">{t("dash.col.set")}</th><th scope="col">{t("dash.col.weightReps")}</th></tr></thead>
              <tbody className="num">
                {g.sets.map((s, j) => (
                  <tr key={s.id} className="border-b border-line/60">
                    <td className="w-12 py-1 text-faint">{j + 1}</td>
                    <td className="py-1">{s.weight > 0 ? `${kgText(s.weight, unit)} × ${s.reps}` : t("dash.repsN", { count: s.reps })}{s.challenge ? t("dash.challenge") : ""}</td>
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

const CATEGORIES: Category[] = ["consistency", "strength", "volume", "records", "explore", "smart", "secret"];

function Trophies({ events, stats, profile, now }: { events: AppEvent[]; stats: Stats; profile: Profile; now: number }) {
  const g = useMemo(() => game(events, stats, profile, now), [events, stats, profile, now]);
  return (
    <div>
      <div className="card mb-4 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-lg font-semibold">{t("dash.badges", { earned: g.badges.earned, total: g.badges.total })}</span>
          <span className="text-sm text-muted">{t("dash.started", { started: g.achievements.filter((a) => a.level > 0).length, total: g.achievements.length })}</span>
        </div>
        <div className="mt-2"><Bar value={g.badges.earned / g.badges.total} label={t("dash.badgesEarned")} /></div>
        <p className="mt-2 text-sm text-muted">{t("dash.tiersNote")}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {CATEGORIES.map((c) => {
          const list = g.achievements.filter((a) => a.category === c).sort((a, b) => b.level - a.level || b.progress - a.progress);
          return (
            <Panel key={c} title={t("dash.catCount", { cat: CATEGORY_LABEL[c], done: list.reduce((n, a) => n + a.level, 0), total: list.reduce((n, a) => n + a.levels, 0) })}>
              <ul className="-mx-4 divide-y divide-line">{list.map((a) => <AchievementRow key={a.id} a={a} />)}</ul>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
