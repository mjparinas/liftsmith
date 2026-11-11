"use client";

import { useEffect, useState } from "react";

import { track } from "@/lib/analytics";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { t } from "@/lib/i18n";
import { roundLoad } from "@/lib/loads";
import { useApp } from "@/lib/store";
import { fmtNum, fromKg, toKg } from "@/lib/units";
import { WARMUP_REST, warmupFor } from "@/lib/warmup";

import { plateText } from "../format";
import { Icon } from "../icons";
import { go } from "../router";
import { BumpField, ScreenHeader } from "../ui";

// Tools › Warm-up calculator (Melvin, 2026-11-11: table stakes). The warm-up sets up to a barbell working
// weight, the same ramp the workout plans (warmup.ts: the empty bar, then about 50%, 70% and 85% for heavy
// work), each one a weight the active gym can load, with its plates. Works offline.

/** A barbell compound the ramp is worked out for; every barbell compound ramps the same way. */
const LIFT = "back-squat";

export function WarmupTool() {
  const { gyms, profile } = useApp();
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const unit = gym?.unit ?? profile.unit;
  const [want, setWant] = useState(unit === "lb" ? "225" : "100");
  useEffect(() => {
    track("feature", { name: "warmup_tool" });
  }, []);
  const ex = EXERCISE_BY_ID.get(LIFT);
  const n = Number(want);
  const workKg = gym && ex && Number.isFinite(n) && n > 0 ? roundLoad(toKg(n, unit), ex, gym).kg : 0;
  const sets = gym && ex && workKg > 0 ? warmupFor(ex, workKg, gym, new Set()) : [];
  const show = (kg: number) => fmtNum(Math.round(fromKg(kg, unit) * 100) / 100);
  return (
    <div className="pb-2">
      <ScreenHeader back={{ label: t("tools.backTools"), onClick: () => go("tools") }} title={t("tools.warm.title")} info="warmup" />
      <p className="mt-1 text-sm text-muted">{t("tools.warm.intro")}</p>
      <div className="card mt-4 p-4">
        <label htmlFor="warm-want" className="text-sm font-semibold">
          {t("tools.warm.target", { unit })}
        </label>
        <BumpField
          id="warm-want"
          className="mt-1"
          size="lg"
          label={t("tools.warm.target", { unit })}
          value={want}
          onChange={setWant}
          step={unit === "lb" ? 5 : 2.5}
          start={unit === "lb" ? 225 : 100}
          max={unit === "lb" ? 1500 : 700}
        />
      </div>
      {gym && ex && workKg > 0 && (
        <section className="card mt-4 p-4" aria-live="polite" data-testid="warmup-result">
          {sets.length ? (
            <ol className="divide-y divide-line">
              {sets.map((s, i) => (
                <li key={i} className="flex items-baseline gap-3 py-2">
                  <span className="num w-5 text-faint">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="num block font-semibold">{t("tools.warm.row", { weight: show(s.weight), unit, reps: s.reps })}</span>
                    <span className="num block text-sm text-muted">{plateText(ex, s.weight, gym)}</span>
                  </span>
                </li>
              ))}
              <li className="flex items-baseline gap-3 py-2">
                <span className="w-5 text-accent">
                  <Icon name="target" size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="num block font-semibold">{t("tools.warm.work", { weight: show(workKg), unit })}</span>
                  <span className="num block text-sm text-muted">{plateText(ex, workKg, gym)}</span>
                </span>
              </li>
            </ol>
          ) : (
            <p className="text-sm">{t("tools.warm.none")}</p>
          )}
          <p className="mt-3 text-xs text-faint">{t("tools.warm.note", { sec: WARMUP_REST })}</p>
        </section>
      )}
    </div>
  );
}
