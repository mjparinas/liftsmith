"use client";

import { useMemo, useState } from "react";

import { can } from "@/lib/entitlements";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { date, list, num, t } from "@/lib/i18n";
import { liftSessions, liftTrend, repBests, type LiftTrend } from "@/lib/liftPage";
import { target } from "@/lib/progression";
import { useApp } from "@/lib/store";
import { MUSCLE_LABEL } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";
import { useNow } from "@/lib/useNow";

import { plateText, setText } from "./format";
import { ProLocked } from "./ProLocked";
import { goBack } from "./router";
import { SetHints } from "./SetHints";
import { HUE } from "./theme";
import { EmptyState, ScreenHeader, Section } from "./ui";

// One page for each exercise (Melvin, 2026-11-11: table stakes). It opens on what to do next time, with
// its reason, then which way the lift is going and what to do about it, then the best weight for each rep
// count and every past session (AGENTS.md: "what should I do?" before "what happened?"). Opened from an
// exercise's name in History and from Progress's records. Pure web code: Android, iOS and the web app.

const sameYear = (a: number, b: number) => new Date(a).getFullYear() === new Date(b).getFullYear();

/** Sessions shown before "Show more". */
const PAGE = 8;

function trendLine(tr: LiftTrend): string {
  switch (tr.kind) {
    case "up":
      return t("lift.trend.up", { pct: tr.pct });
    case "down":
      return t("lift.trend.down", { pct: tr.pct });
    case "stalled":
      return t("lift.trend.stalled", { count: tr.weeks });
    case "steady":
      return t("lift.trend.steady");
    case "new":
      return t("lift.trend.new");
  }
}

export function ExercisePage({ id }: { id?: string }) {
  const { events, profile, gyms } = useApp();
  const now = useNow(3600_000);
  const ex = id ? EXERCISE_BY_ID.get(id) : undefined;
  const unit = profile.unit;
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const sessions = useMemo(() => (ex ? liftSessions(events, ex.id) : []), [events, ex]);
  const next = useMemo(() => (ex && gym ? target(ex, events, profile, gym, now) : null), [ex, gym, events, profile, now]);
  const [shown, setShown] = useState(PAGE);
  const back = { label: t("lift.back"), onClick: goBack };
  if (!ex) {
    return (
      <div>
        <ScreenHeader back={back} title={t("lift.missing")} />
        <EmptyState icon="dumbbell" title={t("lift.missing")} body={t("lift.missingBody")} />
      </div>
    );
  }
  const loaded = ex.load !== "bodyweight" && !ex.cardio;
  const trend = loaded ? liftTrend(sessions, now) : null;
  const bests = loaded ? repBests(sessions, ex.id) : [];
  const best = sessions.reduce((a, s) => Math.max(a, s.e1rm), 0);
  const mostReps = Math.max(0, ...sessions.flatMap((s) => s.sets.map((x) => x.reps)));
  const plates = next && gym && next.weight > 0 ? plateText(ex, next.weight, gym) : undefined;
  return (
    // Desktop layout: the cards flow into two columns (.desk-cols), what to do next first.
    <div className="desk-cols pb-2">
      <ScreenHeader className="desk-span" back={back} kicker={list(ex.primary.map((m) => MUSCLE_LABEL[m]))} title={ex.name} />
      <SetHints ex={ex} className="desk-span mt-2" />

      {next && (
        <section
          className="card card-tint rise mt-4 p-4"
          style={{ "--tint": HUE.accent } as React.CSSProperties}
          aria-label={t("lift.next")}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">{t("lift.next")}</p>
          <p className="display mt-1 text-3xl" data-testid="lift-next">
            {setText(ex, next.weight, next.reps, unit)}
          </p>
          {plates && <p className="num mt-1 text-sm text-muted">{plates}</p>}
          {next.note && <p className="mt-2 text-sm text-muted">{next.note}</p>}
        </section>
      )}

      {trend && !can("advancedStats") && (
        <Section title={t("lift.trendTitle")} icon="progress" info="e1rm">
          <ProLocked from="lift" title={t("pro.ft.advancedStats")} body={t("lift.trend.lock")} />
        </Section>
      )}
      {trend && can("advancedStats") && (
        <Section title={t("lift.trendTitle")} icon="progress" info="e1rm">
          <div className="card p-4">
            {best > 0 && (
              <p className="num">
                <span className="display text-2xl">{fmtNum(Math.round(fromKg(best, unit)))}</span>{" "}
                <span className="text-sm text-muted">
                  {unit} · {t("lift.e1rm")}
                </span>
              </p>
            )}
            <p className="mt-1 text-sm" data-testid="lift-trend">
              {trendLine(trend)}
            </p>
          </div>
        </Section>
      )}

      {bests.length > 0 && (
        <Section title={t("lift.bests")} icon="trophy">
          <div className="card p-4">
            <table className="num w-full text-sm">
              <thead className="text-left text-faint">
                <tr>
                  <th scope="col" className="py-1 font-medium">
                    {t("lift.head.reps")}
                  </th>
                  <th scope="col" className="py-1 text-right font-medium">
                    {t("lift.head.weight")}
                  </th>
                  <th scope="col" className="py-1 text-right font-medium">
                    {t("lift.head.when")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {bests.map((b) => (
                  <tr key={b.reps}>
                    <th scope="row" className="py-1.5 text-left font-medium">
                      {t("lift.repsAtLeast", { count: b.reps })}
                    </th>
                    <td className="py-1.5 text-right">
                      {fmtNum(Math.round(fromKg(b.weight, unit) * 10) / 10)} {unit}
                    </td>
                    <td className="py-1.5 text-right text-muted">
                      {date(b.at, { month: "short", day: "numeric", year: sameYear(b.at, now) ? undefined : "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-faint">{t("lift.bestsNote")}</p>
          </div>
        </Section>
      )}

      {!loaded && mostReps > 0 && !ex.cardio && (
        <Section title={t("lift.bests")} icon="trophy">
          <p className="card num p-4">{t("lift.mostReps", { reps: num(mostReps) })}</p>
        </Section>
      )}

      <Section title={t("lift.history")} icon="calendar">
        {sessions.length ? (
          <ul className="space-y-3">
            {sessions.slice(0, shown).map((s) => (
              <li key={s.sessionId} className="card p-4">
                <h3 className="font-semibold">
                  {date(s.at, { weekday: "short", month: "short", day: "numeric", year: sameYear(s.at, now) ? undefined : "numeric" })}
                </h3>
                <ol className="mt-1 text-sm">
                  {s.sets.map((x, j) => (
                    <li key={x.id} className="num flex gap-3 border-b border-line/60 py-1 last:border-0">
                      <span className="w-5 text-faint">{j + 1}</span>
                      <span className="flex-1">{setText(ex, x.weight, x.reps, unit, x.distanceM)}</span>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        ) : (
          <div className="card">
            <EmptyState icon="dumbbell" title={t("lift.empty.title")} body={t("lift.empty.body")} />
          </div>
        )}
        {sessions.length > shown && (
          <button type="button" onClick={() => setShown(shown + PAGE)} className="press mt-3 min-h-11 w-full text-sm text-accent">
            {t("lift.showMore")}
          </button>
        )}
      </Section>
    </div>
  );
}
