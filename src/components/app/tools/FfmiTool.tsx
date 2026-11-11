"use client";

// Tools › FFMI: fat-free mass index from the latest weigh-in, body fat and height (calculators.ts ffmi), its
// band, and how much lean mass reaches the next one. Without a body fat reading it sends the lifter to the body
// fat tool, the quickest way to get one.
import { useEffect } from "react";

import { track } from "@/lib/analytics";
import { ffmi, FFMI_BANDS, ffmiBand, leanToNextBand } from "@/lib/calculators";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { currentBodyFat, currentKg } from "@/lib/tdee";
import { fmtNum, fromKg } from "@/lib/units";

import { StatsNeeded } from "../BodyStats";
import { go } from "../router";
import { HUE } from "../theme";
import { Button, EmptyState, Section } from "../ui";
import { Advice, Figure, ToolScreen } from "./shared";

export function FfmiTool() {
  const { events, profile } = useApp();
  const unit = profile.unit;
  const sex = profile.sex;
  const kg = currentKg(events, profile);
  const fat = currentBodyFat(events, profile);
  const f = profile.heightCm && fat !== undefined ? ffmi(kg, profile.heightCm, fat) : null;
  useEffect(() => track("feature", { name: "tool_ffmi" }), []);
  const w = (x: number) => `${fmtNum(Math.round(fromKg(x, unit) * 10) / 10)} ${unit}`;
  const band = f && sex ? ffmiBand(f.normalized, sex) : null;
  const next = f && sex && profile.heightCm ? leanToNextBand(f, profile.heightCm, sex) : null;

  return (
    <ToolScreen title={t("calc.ffmi.title")} blurb={t("calc.ffmi.blurb")}>
      <StatsNeeded need={["sex", "height"]} />
      {fat === undefined ? (
        <div className="mt-7">
          <EmptyState
            icon="target"
            tint={HUE.violet}
            title={t("calc.ffmi.noFat")}
            body={t("calc.ffmi.noFatBody")}
            action={
              <Button kind="ghost" onClick={() => go("tools", "bodyfat")}>
                {t("calc.bf.title")} ›
              </Button>
            }
          />
        </div>
      ) : (
        f &&
        band && (
          <Section title={t("calc.ffmi.result")} info="ffmi">
            <div className="card p-4" aria-live="polite">
              <div className="grid grid-cols-3 gap-3">
                <Figure value={fmtNum(Math.round(f.normalized * 10) / 10)} label={t("calc.ffmi.normalized")} testId="ffmi-value" />
                <Figure value={fmtNum(Math.round(f.ffmi * 10) / 10)} label={t("calc.ffmi.raw")} />
                <Figure value={w(f.leanKg)} label={t("calc.ffmi.lean")} />
              </div>
              <p className="mt-3 font-semibold">{t(`calc.ffmi.band.${band}`)}</p>
              <p className="text-sm text-muted">{t("calc.ffmi.from", { weight: w(kg), pct: fmtNum(fat) })}</p>
              <ol className="mt-3 flex gap-1" aria-label={t("calc.ffmi.bands")}>
                {FFMI_BANDS.map((b) => (
                  <li
                    key={b}
                    className={`h-2 flex-1 rounded-full ${b === band ? "bg-accent" : "bg-raised"}`}
                    aria-current={b === band ? "true" : undefined}
                  >
                    <span className="sr-only">{t(`calc.ffmi.band.${b}`)}</span>
                  </li>
                ))}
              </ol>
            </div>
            <Advice>
              {next ? t("calc.ffmi.next", { weight: w(next.kg), band: t(`calc.ffmi.band.${next.band}`) }) : t("calc.ffmi.top")}
            </Advice>
          </Section>
        )
      )}
    </ToolScreen>
  );
}
