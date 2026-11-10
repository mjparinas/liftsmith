"use client";

import { useState } from "react";

import { available } from "@/lib/exercises";
import { alternatives } from "@/lib/generator";
import { date, inSentence, list, t } from "@/lib/i18n";
import {
  affects,
  DEFAULT_PCT,
  effectFor,
  injuries,
  LIGHT_PCTS,
  LOW_PAIN,
  painTrend,
  PART_LABEL,
  RETURN_PCTS,
  returnReady,
  STOP_PAIN,
  type Injury,
  type InjuryAction,
} from "@/lib/injury";
import { haptic } from "@/lib/juice";
import { useApp } from "@/lib/store";
import { BODY_PARTS, type Gym } from "@/lib/types";
import { useNow } from "@/lib/useNow";

import { go } from "./router";
import { Button, Chip, Section, Sheet } from "./ui";

// Injury mode (Melvin, 2026-11-09). Wording is neutral and never diagnoses: we say what the app does,
// that it isn't medical advice, and that a professional can say what's safe.

/** The not-medical-advice line every injury screen shows. */
export const notAdvice = () => t("inj.notAdvice");

type Warn = { injuryId: string; exerciseId?: string; name: string; action: "light" | "ok" | "return"; pct: number };

const day = (ms: number) => date(ms, { month: "short", day: "numeric" });
const lower = (part: Injury["part"]) => inSentence(PART_LABEL[part], true);

export function Injuries() {
  const { events, gyms, profile, logInjury, setInjuryRule, healInjury, ratePain, startReturn, active: workout } = useApp();
  const [rating, setRating] = useState<string | null>(null);
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const all = injuries(events);
  const active = all.filter((i) => i.healedAt === undefined);
  const past = all.filter((i) => i.healedAt !== undefined);
  const [adding, setAdding] = useState(false);
  const [warn, setWarn] = useState<Warn | null>(null);
  const [healing, setHealing] = useState<Injury | null>(null);

  const choose = (inj: Injury, action: InjuryAction, exerciseId: string | undefined, name: string, pct: number) => {
    const current = exerciseId ? (inj.rules.get(exerciseId) ?? inj.all) : inj.all;
    // Going from skipping to training it always shows the risks first. Changing the share while
    // already training lighter doesn't.
    if (action !== "skip" && current.action === "skip") return setWarn({ injuryId: inj.id, exerciseId, name, action, pct });
    setInjuryRule(inj.id, { exerciseId, action, pct: action === "light" ? pct : undefined });
  };

  return (
    <div className="pb-24">
      <button type="button" onClick={() => go(workout ? "workout" : "today")} className="press -ml-2 pt-2 text-muted">
        {workout ? t("inj.backWorkout") : t("inj.backToday")}
      </button>
      <h1 className="text-2xl font-bold">{t("inj.title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("inj.intro")}</p>
      <p className="mt-2 rounded-xl border border-warn/30 bg-warn/10 p-3 text-sm">{notAdvice()}</p>

      <Button className="mt-4 w-full" onClick={() => setAdding(true)}>
        {t("inj.log")}
      </Button>

      {active.map(
        (inj) =>
          gym && (
            <InjuryCard
              key={inj.id}
              inj={inj}
              gym={gym}
              hurt={active}
              onChoose={choose}
              onHeal={() => setHealing(inj)}
              onReturn={() =>
                setWarn({ injuryId: inj.id, name: t("inj.returnName", { part: lower(inj.part) }), action: "return", pct: RETURN_PCTS[0] })
              }
            />
          ),
      )}
      {!active.length && <p className="card mt-6 p-5 text-muted">{t("inj.none")}</p>}

      {past.length > 0 && (
        <Section title={t("inj.healed")}>
          <ul className="card divide-y divide-line">
            {past.slice(0, 10).map((i) => (
              <li key={i.id} className="flex justify-between px-4 py-3 text-sm">
                <span>{PART_LABEL[i.part]}</span>
                <span className="num text-muted">{t("inj.range", { from: day(i.since), to: day(i.healedAt!) })}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Sheet open={adding} onClose={() => setAdding(false)} title={t("inj.whatHurts")}>
        <div className="grid grid-cols-2 gap-2">
          {BODY_PARTS.filter((p) => !active.some((i) => i.part === p)).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                haptic("tap");
                setRating(logInjury(p));
                setAdding(false);
              }}
              className="press min-h-12 rounded-xl border border-line bg-raised px-3 py-3 text-left font-medium"
            >
              {PART_LABEL[p]}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">{t("inj.addNote")}</p>
      </Sheet>

      <Sheet open={!!rating} onClose={() => setRating(null)} title={t("inj.rateTitle")}>
        <p className="mb-3 text-sm text-muted">{t("inj.rateBody")}</p>
        <div className="grid grid-cols-4 gap-2" role="group" aria-label={t("inj.rateGroup")}>
          {Array.from({ length: 11 }, (_, n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                haptic("tick");
                if (rating) ratePain(rating, n);
                setRating(null);
              }}
              className="press num min-h-12 rounded-xl border border-line bg-raised text-lg font-semibold"
            >
              {n}
            </button>
          ))}
        </div>
        <Button kind="quiet" className="mt-3 w-full" onClick={() => setRating(null)}>
          {t("inj.skipNow")}
        </Button>
      </Sheet>

      <RiskSheet
        warn={warn}
        onClose={() => setWarn(null)}
        onConfirm={(w) => {
          if (w.action === "return") {
            startReturn(w.injuryId);
            return setWarn(null);
          }
          setInjuryRule(w.injuryId, {
            exerciseId: w.exerciseId,
            action: w.action,
            pct: w.action === "light" ? w.pct : undefined,
            ack: true,
          });
          setWarn(null);
        }}
      />

      <Sheet open={!!healing} onClose={() => setHealing(null)} title={t("inj.healTitle", { part: healing ? lower(healing.part) : "" })}>
        <div className="space-y-3 text-sm">
          <p>{t("inj.healBody1")}</p>
          <p className="text-muted">{t("inj.healBody2", { tooHard: t("workout.tooHard") })}</p>
          <Button
            className="w-full"
            onClick={() => {
              if (healing) healInjury(healing.id);
              setHealing(null);
              haptic("success");
            }}
          >
            {t("inj.healYes")}
          </Button>
          <Button kind="quiet" className="w-full" onClick={() => setHealing(null)}>
            {t("inj.notYet")}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function InjuryCard({
  inj,
  gym,
  hurt,
  onChoose,
  onHeal,
  onReturn,
}: {
  inj: Injury;
  gym: Gym;
  hurt: Injury[];
  onChoose: (inj: Injury, a: InjuryAction, exerciseId: string | undefined, name: string, pct: number) => void;
  onHeal: () => void;
  onReturn: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const affected = available(gym.equipment).filter((e) => affects(inj.part, e));
  const shown = showAll ? affected : affected.slice(0, 6);
  const label = PART_LABEL[inj.part];
  const skipped = affected.filter((e) => (inj.rules.get(e.id) ?? inj.all).action === "skip").length;
  const lighter = affected.filter((e) => (inj.rules.get(e.id) ?? inj.all).action === "light").length;
  const fine = affected.length - skipped - lighter;

  return (
    <section className="card mt-6 p-4" aria-label={t("inj.cardLabel", { part: label })}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">{label}</h2>
        <span className="num text-sm text-muted">{t("inj.since", { date: day(inj.since) })}</span>
      </div>
      <p className="mt-1 text-sm text-muted">
        {t("inj.at", {
          gym: gym.name,
          counts: list([
            t("inj.nSkipped", { count: skipped }),
            ...(lighter ? [t("inj.nLighter", { count: lighter })] : []),
            ...(fine ? [t("inj.nFine", { count: fine })] : []),
          ]),
        })}
      </p>

      <PainBlock inj={inj} label={label} />
      <ReturnBlock inj={inj} label={label} onStart={onReturn} onHeal={onHeal} />

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t("inj.allGroup", { part: inSentence(label, true) })}>
        <Chip
          active={inj.all.action === "skip" && inj.rules.size === 0}
          onClick={() => onChoose(inj, "skip", undefined, t("inj.every", { part: inSentence(label, true) }), inj.all.pct)}
        >
          {t("inj.skipAll")}
        </Chip>
        <Chip
          active={inj.all.action === "light" && inj.rules.size === 0}
          onClick={() =>
            onChoose(
              inj,
              "light",
              undefined,
              t("inj.every", { part: inSentence(label, true) }),
              inj.all.action === "light" ? inj.all.pct : DEFAULT_PCT,
            )
          }
        >
          {t("inj.lightAll")}
        </Chip>
      </div>
      {inj.all.action === "light" && (
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t("inj.share")}>
          {LIGHT_PCTS.map((p) => (
            <Chip key={p} active={inj.all.pct === p} onClick={() => onChoose(inj, "light", undefined, "", p)}>
              {p}%
            </Chip>
          ))}
        </div>
      )}

      <ul className="mt-4 divide-y divide-line">
        {shown.map((e) => {
          const r = inj.rules.get(e.id) ?? inj.all;
          const swaps =
            r.action === "skip"
              ? alternatives(e.id, gym, [], hurt)
                  .filter((a) => !effectFor(a, hurt))
                  .slice(0, 2)
              : [];
          return (
            <li key={e.id} className="py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 font-medium">{e.name}</span>
                <span className="shrink-0 text-xs text-muted">
                  {r.action === "skip"
                    ? inj.returning && !inj.returning.stopped
                      ? t("inj.returnPct", { pct: inj.returning.pct })
                      : t("inj.skipped")
                    : r.action === "light"
                      ? t("inj.load", { pct: r.pct })
                      : t("inj.fine")}
                </span>
              </div>
              <div
                className="mt-2 grid grid-cols-3 gap-2"
                role="group"
                aria-label={t("inj.exGroup", { name: e.name, part: inSentence(label, true) })}
              >
                {(
                  [
                    ["skip", t("inj.act.skip")],
                    ["light", t("inj.act.light")],
                    ["ok", t("inj.act.ok")],
                  ] as const
                ).map(([a, l]) => (
                  <button
                    key={a}
                    type="button"
                    aria-pressed={r.action === a}
                    onClick={() => {
                      haptic("tick");
                      onChoose(inj, a, e.id, e.name, r.action === "light" ? r.pct : inj.all.pct || DEFAULT_PCT);
                    }}
                    className={`press min-h-11 rounded-xl border text-sm ${r.action === a ? "border-accent bg-accent/10 font-semibold" : "border-line bg-surface text-muted"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {swaps.length > 0 && (
                <p className="mt-2 text-sm text-muted">{t("inj.avoids", { names: swaps.map((s) => s.name).join(" · ") })}</p>
              )}
            </li>
          );
        })}
      </ul>
      {affected.length > shown.length && (
        <Button kind="quiet" className="w-full" onClick={() => setShowAll(true)}>
          {t("inj.showAll", { count: affected.length })}
        </Button>
      )}
      {!affected.length && <p className="mt-3 text-sm text-muted">{t("inj.nothingHere")}</p>}

      <Button kind="ghost" className="mt-3 w-full" onClick={onHeal}>
        {t("inj.fullyHealed")}
      </Button>
    </section>
  );
}

/** The risks, every time the lifter chooses to train something they said hurts. Needs a tick to go on. */
function RiskSheet({ warn, onClose, onConfirm }: { warn: Warn | null; onClose: () => void; onConfirm: (w: Warn) => void }) {
  const [ok, setOk] = useState(false);
  const [pct, setPct] = useState<number>(DEFAULT_PCT);
  const [key, setKey] = useState<Warn | null>(null);
  if (warn !== key) {
    setKey(warn);
    setOk(false);
    setPct(warn?.pct ?? DEFAULT_PCT);
  }
  if (!warn) return null;
  return (
    <Sheet open onClose={onClose} title={t("inj.risk.title")}>
      <div className="space-y-3 text-sm">
        {warn.action === "return" ? (
          <p>
            {t("inj.risk.return", {
              name: warn.name,
              a: RETURN_PCTS[0],
              b: RETURN_PCTS[1],
              c: RETURN_PCTS[2],
              low: LOW_PAIN,
              stop: STOP_PAIN,
            })}
          </p>
        ) : (
          <p>{t(warn.action === "light" ? "inj.risk.light" : "inj.risk.usual", { name: warn.name })}</p>
        )}
        <ul className="list-disc space-y-1.5 pl-5">
          <li>{t("inj.risk.1")}</li>
          <li>{t("inj.risk.2")}</li>
          <li>{t("inj.risk.3")}</li>
          <li>{t("inj.risk.4")}</li>
        </ul>
        <p className="text-muted">{notAdvice()}</p>
        {warn.action === "light" && (
          <div>
            <p className="mb-2 font-medium">{t("inj.share")}</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t("inj.share")}>
              {LIGHT_PCTS.map((p) => (
                <Chip key={p} active={pct === p} onClick={() => setPct(p)}>
                  {p}%
                </Chip>
              ))}
            </div>
          </div>
        )}
        <label className="flex items-center gap-3 rounded-xl bg-raised p-3">
          <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} className="h-5 w-5 accent-[var(--color-accent)]" />
          {t("inj.risk.ok")}
        </label>
        <Button className="w-full" disabled={!ok} onClick={() => onConfirm({ ...warn, pct })}>
          {warn.action === "return"
            ? t("inj.risk.startReturn")
            : warn.action === "light"
              ? t(warn.exerciseId ? "inj.risk.itAt" : "inj.risk.themAt", { pct })
              : t(warn.exerciseId ? "inj.risk.itUsual" : "inj.risk.themUsual")}
        </Button>
        <Button kind="quiet" className="w-full" onClick={onClose}>
          {warn.exerciseId ? t("inj.risk.keepIt") : warn.action === "return" ? t("inj.notYet") : t("inj.risk.keepThem")}
        </Button>
      </div>
    </Sheet>
  );
}

/** A 0–10 pain rating as one native picker (one control, big enough to tap, works with screen readers). */
export function PainSelect({ label, onRate, className = "" }: { label: string; onRate: (n: number) => void; className?: string }) {
  const [saved, setSaved] = useState<number | null>(null);
  return (
    <label className={`flex items-center justify-between gap-3 rounded-xl bg-raised px-3 py-2 text-sm ${className}`}>
      <span>{saved === null ? label : t("inj.pain.saved", { n: saved })}</span>
      <select
        aria-label={label}
        value={saved ?? ""}
        onChange={(e) => {
          const n = Number(e.target.value);
          haptic("tick");
          setSaved(n);
          onRate(n);
        }}
        className="num min-h-11 rounded-lg border border-line bg-surface px-2 text-ink"
      >
        <option value="" disabled>
          0–10
        </option>
        {Array.from({ length: 11 }, (_, n) => (
          <option key={n} value={n}>
            {n === 0 ? t("inj.pain.none", { n }) : n === 10 ? t("inj.pain.worst", { n }) : n}
          </option>
        ))}
      </select>
    </label>
  );
}

function PainBlock({ inj, label }: { inj: Injury; label: string }) {
  const { ratePain } = useApp();
  const trend = painTrend(inj);
  return (
    <div className="mt-3 space-y-2">
      {trend.points.length > 0 && (
        <div className="flex items-center gap-3">
          <Sparkline points={trend.points} label={t("inj.pain.spark", { part: label, points: trend.points.join(", ") })} />
          <div className="shrink-0 text-right text-sm">
            <div className="num font-semibold">{t("inj.pain.now", { n: trend.latest ?? 0 })}</div>
            {trend.change !== undefined && (
              <div className={`text-xs ${trend.change < 0 ? "text-good" : trend.change > 0 ? "text-warn" : "text-muted"}`}>
                {t("inj.pain.over", {
                  count: trend.points.length,
                  change:
                    trend.change < 0
                      ? t("inj.pain.down", { n: -trend.change })
                      : trend.change > 0
                        ? t("inj.pain.up", { n: trend.change })
                        : t("inj.pain.same"),
                })}
              </div>
            )}
          </div>
        </div>
      )}
      <PainSelect key={inj.pain.length} label={t("inj.pain.today")} onRate={(n) => ratePain(inj.id, n)} />
    </div>
  );
}

function Sparkline({ points, label }: { points: number[]; label: string }) {
  const w = 160;
  const h = 40;
  const x = (i: number) => (points.length === 1 ? w / 2 : (i / (points.length - 1)) * (w - 8) + 4);
  const y = (v: number) => h - 4 - (v / 10) * (h - 8);
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h}`} className="h-10 min-w-0 flex-1">
      <line x1="0" x2={w} y1={y(LOW_PAIN)} y2={y(LOW_PAIN)} stroke="var(--color-line)" strokeDasharray="3 3" />
      <polyline
        fill="none"
        stroke="var(--color-warn)"
        strokeWidth="2"
        strokeLinejoin="round"
        points={points.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
      />
      {points.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill="var(--color-warn)" />
      ))}
    </svg>
  );
}

function ReturnBlock({ inj, label, onStart, onHeal }: { inj: Injury; label: string; onStart: () => void; onHeal: () => void }) {
  const now = useNow();
  const r = inj.returning;
  if (r && !r.stopped) {
    return (
      <div className="mt-3 rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm">
        <p className="font-semibold">{t("inj.ret.step", { step: r.stage + 1, pct: r.pct })}</p>
        <p className="mt-1 text-muted">
          {r.readyToHeal
            ? t("inj.ret.ready", { pct: RETURN_PCTS[2], part: inSentence(label, true) })
            : t("inj.ret.rules", { low: LOW_PAIN, a: LOW_PAIN + 1, b: STOP_PAIN - 1, stop: STOP_PAIN })}
        </p>
        {r.readyToHeal && (
          <Button kind="ghost" className="mt-2 w-full" onClick={onHeal}>
            {t("inj.ret.markHealed")}
          </Button>
        )}
      </div>
    );
  }
  if (returnReady(inj, now)) {
    return (
      <div className="mt-3 rounded-xl border border-good/30 bg-good/10 p-3 text-sm">
        <p>{t(r?.stopped ? "inj.ret.lowSince" : "inj.ret.low", { low: LOW_PAIN })}</p>
        <Button kind="ghost" className="mt-2 w-full" onClick={onStart}>
          {t("inj.ret.start")}
        </Button>
      </div>
    );
  }
  if (r?.stopped)
    return (
      <p className="mt-3 rounded-xl border border-warn/30 bg-warn/10 p-3 text-sm">{t("inj.ret.stopped", { score: r.stopped.score })}</p>
    );
  return null;
}
