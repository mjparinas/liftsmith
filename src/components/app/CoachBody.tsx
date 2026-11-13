"use client";

// A client's body, for their coach (2026-11-12; Melvin: "show a 3d body of the user using their health data, BMI,
// height, gender and measurements and body fat? users need to approve this"). Shown on the client's report only when
// the client turned on "Share body data" for this coach: the demo figure shaped from their numbers (bodyShape.ts),
// then their latest weight and body fat with the change over 30 days, and their tape measurements.
import { useMemo } from "react";

import { bodyFor, LiftDemo } from "@/components/demo/LiftDemo";
import { canShape, shapeBody, statsFrom } from "@/lib/bodyShape";
import { date, t } from "@/lib/i18n";
import { fromCm, lengthUnit, measureSummary } from "@/lib/measure";
import { useApp } from "@/lib/store";
import type { BodyShare } from "@/lib/trainer";
import { MEASURE_SITES, type AppEvent, type MeasureSite } from "@/lib/types";
import { fmtHeight, fmtNum, fmtWeight } from "@/lib/units";

import { Section } from "./ui";

const DAY = 86_400_000;

/** The shared data as the app's own events, so the same summaries and shaping read it. */
export function bodyEvents(b: BodyShare): AppEvent[] {
  const sites = new Set<string>(MEASURE_SITES);
  return [
    ...b.weights.map((w, i): AppEvent => ({
      id: `w${i}`,
      at: w.at,
      type: "bodyweight",
      kg: w.kg,
      ...(w.bodyFat != null ? { bodyFat: w.bodyFat } : {}),
    })),
    ...b.measures
      .filter((m) => sites.has(m.site))
      .map((m, i): AppEvent => ({ id: `m${i}`, at: m.at, type: "measure", site: m.site as MeasureSite, cm: m.cm })),
  ];
}

export function ClientBody({ name, body }: { name: string; body: BodyShare }) {
  const unit = useApp((s) => s.profile.unit);
  const events = useMemo(() => bodyEvents(body), [body]);
  const stats = useMemo(
    () => statsFrom({ sex: body.sex ?? undefined, heightCm: body.heightCm ?? undefined, bodyweight: 0 }, events),
    [body, events],
  );
  const key = bodyFor(body.sex);
  const shape = useMemo(() => (canShape(stats) ? shapeBody(key, stats) : undefined), [key, stats]);
  const measures = useMemo(() => measureSummary(events), [events]);
  const len = lengthUnit(unit);
  const latest = body.weights.at(-1);
  // The change over the 30 days up to the latest weigh-in.
  const month = latest ? body.weights.filter((w) => w.at >= latest.at - 30 * DAY) : [];
  const change = latest && month.length > 1 ? latest.kg - month[0]!.kg : null;
  const fats = body.weights.filter((w) => w.bodyFat != null);
  const fat = fats.at(-1)?.bodyFat ?? null;
  const signed = (n: number, s: string) => `${n >= 0 ? "+" : "−"}${s}`;
  const nothing = !latest && !measures.length && !body.heightCm;

  return (
    <Section title={t("trn.body")} icon="target">
      <div className="card p-4">
        {shape && (
          <div className="keep-colours relative mx-auto h-[18rem] max-w-[320px]">
            <LiftDemo
              className="h-full"
              body={key}
              shape={shape}
              view="front"
              label={t("trn.bodyFigure", { name: name || t("trn.noName") })}
            />
          </div>
        )}
        {nothing ? (
          <p className="text-sm text-muted">{t("trn.bodyNone")}</p>
        ) : (
          <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
            {latest && (
              <div>
                <dt className="text-xs text-muted">{t("trn.bodyWeight")}</dt>
                <dd className="num font-semibold">{fmtWeight(latest.kg, unit)}</dd>
                {change != null && (
                  <dd className="num text-xs text-muted">
                    {t("trn.bodyChange", { change: signed(change, fmtWeight(Math.abs(change), unit)) })}
                  </dd>
                )}
              </div>
            )}
            {fat != null && (
              <div>
                <dt className="text-xs text-muted">{t("trn.bodyFat")}</dt>
                <dd className="num font-semibold">{fmtNum(Math.round(fat * 10) / 10)}%</dd>
              </div>
            )}
            {body.heightCm && (
              <div>
                <dt className="text-xs text-muted">{t("trn.bodyHeight")}</dt>
                <dd className="num font-semibold">{fmtHeight(body.heightCm, unit)}</dd>
              </div>
            )}
          </dl>
        )}
        {measures.length > 0 && (
          <ul className="mt-3 divide-y divide-line/70 border-t border-line/70">
            {measures.map(({ site, last, change: c }) => (
              <li key={site} className="flex min-h-11 items-center justify-between gap-3 py-2">
                <span className="font-medium">{t(`body.meas.site.${site}`)}</span>
                <span className="num text-right text-sm">
                  <span className="font-semibold">
                    {fmtNum(Math.round(fromCm(last.cm, unit) * 10) / 10)} {len}
                  </span>
                  <span className="block text-muted">
                    {c === undefined
                      ? date(last.at, { month: "short", day: "numeric" })
                      : t("body.meas.change", { change: signed(c, fmtNum(Math.abs(Math.round(fromCm(c, unit) * 10) / 10))), unit: len })}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {shape && <p className="mt-3 text-xs text-muted">{t("trn.bodyApprox")}</p>}
      </div>
    </Section>
  );
}
