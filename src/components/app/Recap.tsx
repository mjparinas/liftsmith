"use client";

// The monthly recap and the year in lifting (#/recap/m<start> or #/recap/y<year>): a short run of big
// cards with the period's highlights, and a share button. Derived from events (recap.ts).
import { useMemo, useState } from "react";

import { date, num, t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";
import { fmtTonnage } from "@/lib/moments";
import { monthOf, recap, recapMonths, yearOf, type Period } from "@/lib/recap";
import { shareCard } from "@/lib/shareImage";
import { useApp } from "@/lib/store";
import { MUSCLE_LABEL } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";
import { useNow } from "@/lib/useNow";

import { go } from "./router";
import { Button, Chip, ScreenHeader } from "./ui";

const cap = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);

export function parsePeriod(arg: string | undefined, now: number): Period {
  if (arg?.startsWith("y")) {
    const y = Number(arg.slice(1));
    if (y > 2000) return yearOf(new Date(y, 6, 1).getTime());
  }
  if (arg?.startsWith("m")) {
    const ms = Number(arg.slice(1));
    if (ms > 0) return monthOf(ms + 86400_000);
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
    {
      k: "workouts",
      big: num(r.workouts),
      small:
        r.weeks > 1
          ? t("recap.workoutsWeeks", { count: r.workouts, active: r.activeWeeks, weeks: r.weeks })
          : t("recap.workouts", { count: r.workouts }),
    },
    { k: "volume", big: fmtTonnage(r.volumeKg, unit), small: r.likeA ? t("recap.liftedLike", { thing: r.likeA }) : t("recap.lifted") },
    { k: "sets", big: num(r.sets), small: t("recap.sets", { reps: num(r.reps), hours: num(hours) }) },
  ];
  if (r.prs.length)
    cards.push({
      k: "prs",
      big: num(r.prs.length),
      small: t("recap.prs", {
        count: r.prs.length,
        name: r.prs[0].name,
        weight: fmtNum(fromKg(r.prs[0].weight, unit)),
        unit,
        reps: r.prs[0].reps,
      }),
    });
  if (r.topExercise) cards.push({ k: "top", big: r.topExercise.name, small: t("recap.top", { sets: r.topExercise.sets }) });
  if (r.topMuscle) cards.push({ k: "muscle", big: MUSCLE_LABEL[r.topMuscle.muscle], small: t("recap.muscle") });
  if (r.favouriteDay)
    cards.push({
      k: "day",
      big: cap(r.favouriteDay),
      small: r.timeOfDay ? t("recap.dayTod", { tod: t(`recap.tod.${r.timeOfDay}`) }) : t("recap.day"),
    });
  if (r.heaviest)
    cards.push({
      k: "heavy",
      big: `${fmtNum(fromKg(r.heaviest.weight, unit))} ${unit}`,
      small: t("recap.heavy", { name: r.heaviest.name }),
    });
  if (r.volumeChange !== null)
    cards.push({
      k: "change",
      big: `${r.volumeChange >= 0 ? "+" : ""}${num(Math.round(r.volumeChange * 100))}%`,
      small: t(period.kind === "year" ? "recap.changeYear" : "recap.changeMonth"),
    });
  if (r.avgHr) cards.push({ k: "hr", big: `${num(r.avgHr)} bpm`, small: t("recap.hr") });

  const share = async () => {
    haptic("tap");
    const res = await shareCard(
      {
        kicker: t(period.kind === "year" ? "recap.year" : "recap.month"),
        headline: r.label,
        tiles: [
          [t("recap.card.workouts"), num(r.workouts)],
          [t("recap.card.lifted"), fmtTonnage(r.volumeKg, unit)],
          [t("recap.card.sets"), num(r.sets)],
          [t("recap.card.prs"), num(r.prs.length)],
        ] as [string, string][],
        lines: [
          r.likeA ? t("recap.card.like", { thing: r.likeA }) : null,
          r.topExercise ? t("recap.card.top", { name: r.topExercise.name }) : null,
          r.prs[0]
            ? t("recap.card.pr", { name: r.prs[0].name, weight: fmtNum(fromKg(r.prs[0].weight, unit)), unit, reps: r.prs[0].reps })
            : null,
          r.favouriteDay ? t("recap.card.day", { day: r.favouriteDay }) : null,
        ].filter((x): x is string => !!x),
        footer: "Liftsmith",
      },
      `liftsmith-recap-${period.kind}`,
    );
    setNote(res === "failed" ? t("recap.shareFailed") : res === "download" ? t("recap.saved") : null);
  };

  return (
    <div className="pb-2">
      <ScreenHeader
        back={{ label: t("recap.back"), onClick: () => go("stats") }}
        kicker={t(period.kind === "year" ? "recap.year" : "recap.month")}
        title={r.label}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip active={period.kind === "year"} onClick={() => setPeriod(yearOf(period.start))}>
          {t("recap.wholeYear")}
        </Chip>
        {months.map((m) => (
          <Chip key={m.start} active={period.kind === "month" && period.start === m.start} onClick={() => setPeriod(m)}>
            {date(m.start, { month: "short", year: "2-digit" })}
          </Chip>
        ))}
      </div>
      {r.workouts === 0 ? (
        <p className="card mt-6 p-5 text-muted">{t("recap.none", { period: r.label })}</p>
      ) : (
        <ol className="mt-5 space-y-3">
          {cards.map((c, i) => (
            <li
              key={c.k}
              className="card animate-rise overflow-hidden p-5"
              style={{
                animationDelay: `${i * 70}ms`,
                background:
                  i === 0
                    ? "linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 22%, var(--color-surface)), var(--color-surface))"
                    : undefined,
              }}
            >
              <p className="num text-4xl font-bold leading-tight">{c.big}</p>
              <p className="mt-1 text-muted">{c.small}</p>
            </li>
          ))}
        </ol>
      )}
      {r.workouts > 0 && (
        <Button className="mt-5 w-full py-4" onClick={() => void share()}>
          {t(period.kind === "year" ? "recap.shareYear" : "recap.shareMonth")}
        </Button>
      )}
      {note && (
        <p className="mt-2 text-center text-sm text-accent" role="status">
          {note}
        </p>
      )}
    </div>
  );
}
