"use client";
// The monthly recap and the year in lifting (#/recap/m<start> or #/recap/y<year>): a short run of big
// cards with the period's highlights, and a share button. Derived from events (recap.ts).
import { haptic } from "@/lib/juice";
import { fmtTonnage } from "@/lib/moments";
import { monthOf, recap, recapMonths, yearOf, type Period } from "@/lib/recap";
import { useApp } from "@/lib/store";
import { MUSCLE_LABEL } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";
import { useNow } from "@/lib/useNow";
import { useMemo, useState } from "react";
import { shareText } from "@/lib/buddy";
import { go } from "./router";
import { Button, Chip } from "./ui";

export function parsePeriod(arg: string | undefined, now: number): Period {
  if (arg?.startsWith("y")) {
    const y = Number(arg.slice(1));
    if (y > 2000) return yearOf(new Date(y, 6, 1).getTime());
  }
  if (arg?.startsWith("m")) {
    const t = Number(arg.slice(1));
    if (t > 0) return monthOf(t + 86400_000);
  }
  return monthOf(now);
}

export function Recap({ arg }: { arg?: string }) {
  const { events, profile } = useApp();
  const now = useNow(3600_000);
  const [period, setPeriod] = useState(() => parsePeriod(arg, now));
  const r = useMemo(() => recap(events, period, now), [events, period, now]);
  const months = useMemo(() => recapMonths(events).slice(0, 12), [events]);
  const [note, setNote] = useState<string | null>(null);
  const unit = profile.unit;
  const hours = Math.round(r.seconds / 360) / 10;
  const cards: { k: string; big: string; small: string }[] = [
    { k: "workouts", big: String(r.workouts), small: `workout${r.workouts === 1 ? "" : "s"}${r.weeks > 1 ? ` across ${r.activeWeeks} of ${r.weeks} weeks` : ""}` },
    { k: "volume", big: fmtTonnage(r.volumeKg, unit), small: r.likeA ? `lifted. That's more than ${r.likeA}.` : "lifted" },
    { k: "sets", big: r.sets.toLocaleString("en-US"), small: `sets and ${r.reps.toLocaleString("en-US")} reps in ${hours} hours` },
  ];
  if (r.prs.length) cards.push({ k: "prs", big: String(r.prs.length), small: `personal best${r.prs.length > 1 ? "s" : ""}, led by ${r.prs[0].name} at ${fmtNum(fromKg(r.prs[0].weight, unit))} ${unit} × ${r.prs[0].reps}` });
  if (r.topExercise) cards.push({ k: "top", big: r.topExercise.name, small: `your most-done lift, ${r.topExercise.sets} sets` });
  if (r.topMuscle) cards.push({ k: "muscle", big: MUSCLE_LABEL[r.topMuscle.muscle], small: "got the most work" });
  if (r.favouriteDay) cards.push({ k: "day", big: r.favouriteDay, small: `was your day${r.timeOfDay ? `, and you're a ${r.timeOfDay}` : ""}` });
  if (r.heaviest) cards.push({ k: "heavy", big: `${fmtNum(fromKg(r.heaviest.weight, unit))} ${unit}`, small: `heaviest bar: ${r.heaviest.name}` });
  if (r.volumeChange !== null) cards.push({ k: "change", big: `${r.volumeChange >= 0 ? "+" : ""}${Math.round(r.volumeChange * 100)}%`, small: `volume against the ${period.kind} before` });
  if (r.avgHr) cards.push({ k: "hr", big: `${r.avgHr} bpm`, small: "average heart rate while lifting" });

  const share = async () => {
    haptic("tap");
    const lines = [`My ${r.label} in lifting`, `${r.workouts} workouts · ${fmtTonnage(r.volumeKg, unit)} lifted`, r.prs.length ? `${r.prs.length} PRs, top: ${r.prs[0].name}` : null, r.likeA ? `That's more than ${r.likeA} 💪` : null].filter(Boolean);
    const res = await shareText(lines.join("\n"));
    setNote(res === "copied" ? "Copied to share." : null);
  };

  return (
    <div className="pb-28">
      <button type="button" onClick={() => go("stats")} className="press -ml-2 min-h-11 px-2 pt-2 text-muted">‹ Progress</button>
      <p className="text-sm uppercase tracking-wider text-accent">{period.kind === "year" ? "Year in lifting" : "Monthly recap"}</p>
      <h1 className="text-3xl font-bold">{r.label}</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip active={period.kind === "year"} onClick={() => setPeriod(yearOf(period.start))}>Whole year</Chip>
        {months.map((m) => <Chip key={m.start} active={period.kind === "month" && period.start === m.start} onClick={() => setPeriod(m)}>{new Date(m.start).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}</Chip>)}
      </div>
      {r.workouts === 0 ? (
        <p className="card mt-6 p-5 text-muted">No workouts in {r.label} yet. Your recap fills in as you train.</p>
      ) : (
        <ol className="mt-5 space-y-3">
          {cards.map((c, i) => (
            <li key={c.k} className="card animate-rise overflow-hidden p-5" style={{ animationDelay: `${i * 70}ms`, background: i === 0 ? "linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 22%, var(--color-surface)), var(--color-surface))" : undefined }}>
              <p className="num text-4xl font-bold leading-tight">{c.big}</p>
              <p className="mt-1 text-muted">{c.small}</p>
            </li>
          ))}
        </ol>
      )}
      {r.workouts > 0 && <Button className="mt-5 w-full py-4" onClick={() => void share()}>Share my {period.kind === "year" ? "year" : "month"}</Button>}
      {note && <p className="mt-2 text-center text-sm text-accent" role="status">{note}</p>}
    </div>
  );
}
