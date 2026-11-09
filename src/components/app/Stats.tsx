"use client";
import { useNow } from "@/lib/useNow";
import { exercise } from "@/lib/exercises";
import { AchievementRow, useGame } from "./Achievements";
import { go } from "./router";
import { useApp } from "@/lib/store";
import { MUSCLE_LABEL, MUSCLES } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";
import { ago, clock } from "./format";
import { Section } from "./ui";
import { GoalsCard, PlateausCard } from "./Coach";
import { StrengthCard, TonnageCard } from "./Extras";

function Spark({ points }: { points: number[] }) {
  if (points.length < 2) return <div className="h-10 text-xs text-faint">Needs two sessions</div>;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const w = 120;
  const h = 36;
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${(i / (points.length - 1)) * w},${h - ((p - min) / Math.max(1, max - min)) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} aria-hidden>
      <path d={d} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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
  const tiles = [
    ["Workouts", String(stats.sessions.length)],
    ["Week streak", String(streak.weeks)],
    ["Sets", String(stats.totalSets)],
    ["Volume", `${fmtNum(Math.round(fromKg(stats.totalVolume, unit) / 100) / 10)}k ${unit}`],
  ];
  return (
    <div className="pb-24">
      <h1 className="pt-2 text-2xl font-bold">Progress</h1>
      <div className="card mt-4 p-4">
        <div className="flex items-baseline justify-between">
          <span className="font-semibold">Level {lvl.level} · {lvl.title}</span>
          <span className="num text-sm text-muted">{xp} XP</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-raised">
          <div className="h-full rounded-full bg-gradient-to-r from-accent to-good" style={{ width: `${Math.min(100, (lvl.into / lvl.span) * 100)}%` }} />
        </div>
        {lvl.next && <p className="mt-1.5 text-xs text-faint num">{lvl.span - lvl.into} XP to {lvl.next}</p>}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {tiles.map(([k, v]) => (
          <div key={k} className="card p-4">
            <div className="text-xs uppercase tracking-wider text-faint">{k}</div>
            <div className="num mt-1 text-2xl font-bold">{v}</div>
          </div>
        ))}
      </div>
      <TonnageCard />
      <StrengthCard />

      <GoalsCard />
      <PlateausCard />

      <Section title="Sets per muscle this week">
        <div className="card p-4">
          <ul className="space-y-2">
            {MUSCLES.filter((m) => thisWeek.sets[m] > 0).sort((a, b) => thisWeek.sets[b] - thisWeek.sets[a]).map((m) => (
              <li key={m} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 text-muted">{MUSCLE_LABEL[m]}</span>
                <div className="relative h-2.5 flex-1 rounded-full bg-raised">
                  <div className="absolute inset-y-0 rounded-full bg-good/15" style={{ left: "50%", width: "50%" }} title="10 to 20 sets" />
                  <div className="relative h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (thisWeek.sets[m] / 20) * 100)}%` }} />
                </div>
                <span className="num w-8 text-right">{fmtNum(thisWeek.sets[m])}</span>
              </li>
            ))}
            {!MUSCLES.some((m) => thisWeek.sets[m] > 0) && <li className="text-muted">No sets yet this week.</li>}
          </ul>
          <p className="mt-3 text-xs text-faint">The green band is 10 to 20 hard sets a week, the range most research supports for growth.</p>
        </div>
      </Section>

      <Section title="Estimated one-rep max">
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
          {!top.length && <li className="px-4 py-3 text-muted">Log a few weighted sets to see your trends.</li>}
        </ul>
      </Section>

      <Section title="Personal records">
        <ul className="card divide-y divide-line">
          {stats.prs.slice(0, 8).map((p) => (
            <li key={p.at + p.exerciseId} className="flex justify-between px-4 py-3">
              <span>{exercise(p.exerciseId).name}</span>
              <span className="num text-muted">{fmtNum(fromKg(p.weight, unit))} {unit} × {p.reps} · {ago(p.at, now)}</span>
            </li>
          ))}
          {!stats.prs.length && <li className="px-4 py-3 text-muted">Your PRs will show here.</li>}
        </ul>
      </Section>

      <Section title={`Achievements · ${g.badges.earned} of ${g.badges.total} badges`} right={<button type="button" onClick={() => go("achievements")} className="press text-sm text-accent">See all</button>}>
        <ul className="card divide-y divide-line">
          {g.nearest.map((a) => <AchievementRow key={a.id} a={a} />)}
          {!g.nearest.length && <li className="px-4 py-3 text-muted">Finish a workout to start earning badges.</li>}
        </ul>
      </Section>

      <Section title="History">
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
          {!stats.sessions.length && <li className="px-4 py-3 text-muted">No workouts yet.</li>}
        </ul>
      </Section>
    </div>
  );
}
