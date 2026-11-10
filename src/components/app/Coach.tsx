"use client";

import { useState } from "react";

import { can } from "@/lib/entitlements";
import { exercise, EXERCISE_BY_ID } from "@/lib/exercises";
import { forecast, testDay, type LiftGoal } from "@/lib/goals";
import { date as fmtDate, t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { fmtNum, fromKg, toKg } from "@/lib/units";
import { useNow } from "@/lib/useNow";
import type { MessageKey } from "@/locales/en";

import { go } from "./router";
import { Button, ProTag, Section, Sheet } from "./ui";

// Coaching cards on the Progress screen: lift goals with an honest forecast. The plateau detective's
// stalls and fixes show as coach's notes (insights.ts).

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

const CLS: Record<string, string> = {
  done: "text-good",
  likely: "text-good",
  onTrack: "text-good",
  stretch: "text-warn",
  unlikely: "text-bad",
  noData: "text-muted",
};
const STATUS = (s: string) => ({ label: t(`gl.st.${s}` as MessageKey), cls: CLS[s] });

export function GoalsCard() {
  const { profile, events, gyms, setProfile } = useApp();
  const [adding, setAdding] = useState(false);
  const now = useNow();
  const unit = profile.unit;
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const goals = (profile.goals ?? []).filter((g) => !g.doneAt);
  // Without Pro the section still shows, marked Pro, and its one button opens the paywall at the planner.
  if (!can("goalPlanner"))
    return (
      <Section title={t("gl.title")}>
        <button
          type="button"
          onClick={() => go("pro", "goals")}
          aria-label={t("pro.locked", { what: t("pro.ft.goalPlanner") })}
          className="press card w-full p-4 text-left"
        >
          <span className="flex items-center justify-between gap-2">
            <span className="font-semibold">{t("pro.ft.goalPlanner")}</span>
            <ProTag />
          </span>
          <span className="mt-1 block text-sm text-muted">{t("gl.empty")}</span>
        </button>
      </Section>
    );
  const w = (kg: number) => `${fmtNum(Math.round(fromKg(kg, unit) * 2) / 2)} ${unit}`;
  const remove = (id: string) => setProfile({ goals: (profile.goals ?? []).filter((g) => g.id !== id) });
  return (
    <Section
      title={t("gl.title")}
      right={
        <button type="button" className="press min-h-11 px-1 text-sm text-accent" onClick={() => setAdding(true)}>
          {t("gl.add")}
        </button>
      }
    >
      {!goals.length && <p className="card p-4 text-sm text-muted">{t("gl.empty")}</p>}
      <ul className="space-y-3">
        {goals.map((g) => {
          const f = forecast(g, events, profile, now);
          const st = STATUS(f.status);
          const td = gym ? testDay(g, f, gym, now) : null;
          const pct = f.now && g.kg ? Math.min(100, (f.now / g.kg) * 100) : 0;
          return (
            <li key={g.id} className="card p-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">
                  {exercise(g.exerciseId).name}: {w(g.kg)}
                </span>
                <span className={`text-sm font-semibold ${st.cls}`}>{st.label}</span>
              </div>
              <p className="text-xs text-faint">
                {t("gl.by", { date: fmtDate(g.by, { day: "numeric", month: "short", year: "numeric" }) })}
                {f.now ? t("gl.nowAbout", { kg: w(f.now) }) : ""}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-raised" role="img" aria-label={t("gl.pct", { n: Math.round(pct) })}>
                <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-sm text-muted">{f.text}</p>
              {f.status !== "noData" && f.status !== "done" && (
                <p className="num mt-1 text-xs text-faint">{t("gl.range", { low: w(f.low), high: w(f.high), mid: w(f.mid) })}</p>
              )}
              {td && (
                <div className="mt-3 rounded-xl bg-raised p-3 text-sm">
                  <p className="font-semibold">{t("gl.testIn", { count: td.days })}</p>
                  <p className="mt-1 text-muted">{td.advice}</p>
                  <p className="num mt-1">{t("gl.attempts", { list: td.attempts.map(w).join(" → ") })}</p>
                </div>
              )}
              <div className="mt-2 flex gap-4">
                {f.status === "done" && (
                  <button
                    type="button"
                    className="press min-h-11 text-sm text-accent"
                    onClick={() => setProfile({ goals: (profile.goals ?? []).map((x) => (x.id === g.id ? { ...x, doneAt: now } : x)) })}
                  >
                    {t("gl.lifted")}
                  </button>
                )}
                <button type="button" className="press min-h-11 text-sm text-faint" onClick={() => remove(g.id)}>
                  {t("gl.remove")}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <AddGoal open={adding} onClose={() => setAdding(false)} onAdd={(g) => setProfile({ goals: [...(profile.goals ?? []), g] })} />
    </Section>
  );
}

function AddGoal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (g: LiftGoal) => void }) {
  const { stats, profile, events } = useApp();
  const now = useNow();
  const unit = profile.unit;
  const lifts = [...stats.e1rmSeries.keys()].filter((id) => EXERCISE_BY_ID.get(id)?.load !== "bodyweight");
  const [id, setId] = useState("");
  const [value, setValue] = useState("");
  const [date, setDate] = useState(() => new Date(now + 90 * 86400_000).toISOString().slice(0, 10));
  const pick = id || lifts[0] || "";
  const kg = toKg(Number(value), unit);
  const by = new Date(`${date}T12:00:00`).getTime();
  const preview = pick && kg > 0 && by > now ? forecast({ exerciseId: pick, kg, by }, events, profile, now) : null;
  return (
    <Sheet open={open} onClose={onClose} title={t("gl.new")}>
      {!lifts.length ? (
        <p className="text-muted">{t("gl.needLifts")}</p>
      ) : (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-muted">{t("gl.lift")}</span>
            <select
              value={pick}
              onChange={(e) => setId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-raised px-3 py-3"
            >
              {lifts.map((l) => (
                <option key={l} value={l}>
                  {exercise(l).name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-muted">{t("gl.target", { unit })}</span>
            <input
              type="number"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-raised px-3 py-3"
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted">{t("gl.byLabel")}</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-raised px-3 py-3"
            />
          </label>
          {preview && (
            <p className={`text-sm ${STATUS(preview.status).cls}`}>
              {STATUS(preview.status).label}. <span className="text-muted">{preview.text}</span>
            </p>
          )}
          <Button
            className="w-full"
            disabled={!preview}
            onClick={() => {
              onAdd({ id: uid(), exerciseId: pick, kg, by, createdAt: now });
              setValue("");
              onClose();
            }}
          >
            {t("gl.set")}
          </Button>
        </div>
      )}
    </Sheet>
  );
}
