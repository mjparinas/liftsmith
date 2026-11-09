"use client";
import { useNow } from "@/lib/useNow";
import { exercise } from "@/lib/exercises";
import { AchievementRow, useGame } from "./Achievements";
import { go } from "./router";
import { useApp } from "@/lib/store";
import { MUSCLE_LABEL, MUSCLES } from "@/lib/types";
import { fmtNum, fromKg, toKg } from "@/lib/units";
import { useState } from "react";
import { ago, clock } from "./format";
import type { CSSProperties } from "react";
import { Icon, type IconName } from "./icons";
import { HUE } from "./theme";
import { Button, EmptyState, Section, StatTile } from "./ui";
import { StrengthCard, TonnageCard } from "./Extras";

function Spark({ points, empty = "Needs two sessions" }: { points: number[]; empty?: string }) {
  if (points.length < 2) return <div className="h-10 text-xs text-faint">{empty}</div>;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const w = 120;
  const h = 36;
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${(i / (points.length - 1)) * w},${h - ((p - min) / Math.max(1, max - min)) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} aria-hidden>
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--grad-a)", stopOpacity: 0.35 }} />
          <stop offset="1" style={{ stopColor: "var(--grad-a)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill="url(#spark)" stroke="none" />
      <path d={d} fill="none" stroke="var(--color-accent)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Stats() {
  const { stats, profile } = useApp();
  const now = useNow();
  const unit = profile.unit;
  const g = useGame();
  const xp = g.xp;
  const lvl = g.level;
  const streak = g.streak;
  const top = [...stats.e1rmSeries.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 6);
  const thisWeek = stats.weeklyMuscleSets.at(-1)!;
  const tiles: [string, string, IconName, string][] = [
    ["Workouts", String(stats.sessions.length), "dumbbell", HUE.accent],
    ["Week streak", String(streak.weeks), "flame", HUE.ember],
    ["Sets", String(stats.totalSets), "layers", HUE.violet],
    ["Volume", `${fmtNum(Math.round(fromKg(stats.totalVolume, unit) / 100) / 10)}k ${unit}`, "progress", HUE.cyan],
  ];
  return (
    <div className="pb-24">
      <h1 className="pt-3 text-[28px] font-extrabold tracking-tight">Progress</h1>
      <div className="card-tint mt-4 p-4" style={{ "--tint": HUE.violet } as CSSProperties}>
        <div className="flex items-baseline justify-between">
          <span className="font-bold">Level {lvl.level} · <span className="text-gradient">{lvl.title}</span></span>
          <span className="num text-sm text-muted">{xp} XP</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-raised">
          <div className="h-full rounded-full bg-gradient-to-r from-accent to-violet shadow-[0_0_12px_rgb(139_123_255/0.6)]" style={{ width: `${Math.min(100, (lvl.into / lvl.span) * 100)}%` }} />
        </div>
        {lvl.next && <p className="mt-1.5 text-xs text-faint num">{lvl.span - lvl.into} XP to {lvl.next}</p>}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {tiles.map(([k, v, icon, hue]) => <StatTile key={k} label={k} value={v} icon={icon} tint={hue} />)}
      </div>
      <TonnageCard />
      <StrengthCard />

      <Section title="Sets per muscle this week" icon="target">
        <div className="card p-4">
          <ul className="space-y-2">
            {MUSCLES.filter((m) => thisWeek.sets[m] > 0).sort((a, b) => thisWeek.sets[b] - thisWeek.sets[a]).map((m) => (
              <li key={m} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 text-muted">{MUSCLE_LABEL[m]}</span>
                <div className="relative h-2.5 flex-1 rounded-full bg-raised">
                  <div className="absolute inset-y-0 rounded-full bg-good/15" style={{ left: "50%", width: "50%" }} title="10 to 20 sets" />
                  <div className="relative h-full rounded-full bg-gradient-to-r from-accent to-accent-2" style={{ width: `${Math.min(100, (thisWeek.sets[m] / 20) * 100)}%` }} />
                </div>
                <span className="num w-8 text-right">{fmtNum(thisWeek.sets[m])}</span>
              </li>
            ))}
            {!MUSCLES.some((m) => thisWeek.sets[m] > 0) && <li><EmptyState icon="target" title="No sets yet this week" body="Each set you log fills these bars toward this week's target." /></li>}
          </ul>
          <p className="mt-3 text-xs text-faint">The green band is 10 to 20 hard sets a week, the range most research supports for growth.</p>
        </div>
      </Section>

      <BodyweightCard />

      <Section title="Estimated one-rep max" icon="progress">
        <ul className="card divide-y divide-line">
          {top.map(([id, series]) => (
            <li key={id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{exercise(id).name}</div>
                <div className="num text-sm text-muted">{fmtNum(Math.round(fromKg(series.at(-1)!.e1rm, unit)))} {unit}</div>
              </div>
              <Spark points={series.map((p) => p.e1rm)} />
            </li>
          ))}
          {!top.length && <li><EmptyState icon="progress" tint={HUE.cyan} title="Trends appear here" body="Log a few weighted sets and your estimated maxes will chart themselves." /></li>}
        </ul>
      </Section>

      <Section title="Personal records" icon="trophy">
        <ul className="card divide-y divide-line">
          {stats.prs.slice(0, 8).map((p) => (
            <li key={p.at + p.exerciseId} className="flex justify-between px-4 py-3">
              <span className="flex items-center gap-2 font-medium"><span className="text-gold"><Icon name="trophy" size={16} /></span>{exercise(p.exerciseId).name}</span>
              <span className="num text-muted">{fmtNum(fromKg(p.weight, unit))} {unit} × {p.reps} · {ago(p.at, now)}</span>
            </li>
          ))}
          {!stats.prs.length && <li><EmptyState icon="trophy" tint={HUE.gold} title="Your PRs will show here" body="Beat a previous best weight or reps and it lands on this list." /></li>}
        </ul>
      </Section>

      <Section title={`Achievements · ${g.badges.earned} of ${g.badges.total} badges`} right={<button type="button" onClick={() => go("achievements")} className="press text-sm text-accent">See all</button>}>
        <ul className="card divide-y divide-line">
          {g.nearest.map((a) => <AchievementRow key={a.id} a={a} />)}
          {!g.nearest.length && <li className="px-4 py-3 text-muted">Finish a workout to start earning badges.</li>}
        </ul>
      </Section>

      <Section title="History" icon="calendar">
        <ul className="card divide-y divide-line">
          {stats.sessions.slice(0, 20).map((s) => (
            <li key={s.sessionId} className="px-4 py-3">
              <div className="flex justify-between">
                <span className="font-medium">{ago(s.start, now)}</span>
                <span className="num text-sm text-muted">{clock(s.seconds)} · {s.sets} sets{s.avgHr ? ` · ♥ ${s.avgHr}` : ""}{s.prs ? ` · ${s.prs} PR` : ""}</span>
              </div>
              <div className="mt-0.5 truncate text-sm text-muted">{s.exercises.map((e) => exercise(e).name).join(", ")}</div>
            </li>
          ))}
          {!stats.sessions.length && <li><EmptyState icon="calendar" title="No workouts yet" body="Finish your first workout and it starts your history." action={<Button icon="play" onClick={() => go("today")}>Plan today&apos;s workout</Button>} /></li>}
        </ul>
      </Section>
    </div>
  );
}

/** Body weight log: one input, a trend line and the change over the last month. */
function BodyweightCard() {
  const { events, profile, logBodyweight } = useApp();
  const unit = profile.unit;
  const log = events.filter((e) => e.type === "bodyweight").sort((a, b) => a.at - b.at);
  const [value, setValue] = useState("");
  const last = log.at(-1);
  const monthAgo = [...log].reverse().find((e) => !!last && e.type === "bodyweight" && e.at <= last.at - 28 * 86400_000);
  const kg = (e: (typeof log)[number] | undefined) => (e?.type === "bodyweight" ? e.kg : undefined);
  const change = kg(last) !== undefined && kg(monthAgo) !== undefined ? fromKg(kg(last)! - kg(monthAgo)!, unit) : undefined;
  const submit = () => {
    const n = Number(value);
    if (!(n > 0)) return;
    logBodyweight(toKg(n, unit));
    setValue("");
  };
  return (
    <Section title="Body weight" icon="heart">
      <div className="card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="num text-2xl font-bold">{fmtNum(Math.round(fromKg(kg(last) ?? profile.bodyweight, unit) * 10) / 10)} {unit}</div>
            <div className="text-sm text-muted">{change !== undefined ? `${change >= 0 ? "+" : ""}${fmtNum(Math.round(change * 10) / 10)} ${unit} in 4 weeks` : log.length ? `${log.length} weigh-in${log.length > 1 ? "s" : ""}` : "No weigh-ins yet"}</div>
          </div>
          <Spark points={log.map((e) => (e.type === "bodyweight" ? e.kg : 0))} empty="Log twice for a trend" />
        </div>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ""))} placeholder={`Today, in ${unit}`} aria-label={`Today's body weight in ${unit}`} className="num min-h-11 w-0 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3" />
          <Button kind="ghost" label="Log body weight" onClick={submit}>Log</Button>
        </form>
      </div>
    </Section>
  );
}
