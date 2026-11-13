"use client";

// Daily nutrition targets from a coach (2026-11-13; Melvin: "nutrition targets for clients"). The coach sets calories
// and grams of protein for a client on their report; the client sees them under Coaching, and their coach's notes judge
// their food week against them (insights.ts). Liftsmith logs no food: when the client shares body data, the coach
// also sees the calories and protein their food app wrote to Health Connect or Apple Health
// (docs/decisions/trainer-mode.md).
import { useState } from "react";

import { track } from "@/lib/analytics";
import { parseNum, t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { foodWeek, saveTargets, trainerError, type BodyShare, type Targets } from "@/lib/trainer";
import { fmtNum } from "@/lib/units";

import { BumpField, Button, Section } from "./ui";

const KCAL = { start: 2200, step: 50, min: 800, max: 6000 };
const PROTEIN = { start: 140, step: 5, min: 30, max: 400 };

const num = (s: string, lo: number, hi: number) => {
  const n = parseNum(s);
  return Number.isFinite(n) && n >= lo && n <= hi ? Math.round(n) : null;
};

/** The coach's side, on a client's report. */
export function ClientTargets({
  clientId,
  saved,
  body,
  now,
  onChange,
}: {
  clientId: string;
  saved: Targets | null;
  body: BodyShare | null;
  now: number;
  onChange: () => void;
}) {
  const [kcal, setKcal] = useState(saved?.kcal ? String(saved.kcal) : "");
  const [protein, setProtein] = useState(saved?.protein ? String(saved.protein) : "");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const k = num(kcal, KCAL.min, KCAL.max);
  const p = num(protein, PROTEIN.min, PROTEIN.max);
  const changed = k !== (saved?.kcal ?? null) || p !== (saved?.protein ?? null);
  const week = body ? foodWeek({ body }, now) : null;

  const save = async (clear: boolean) => {
    setBusy(true);
    try {
      const r = await saveTargets(clientId, clear ? null : k, clear ? null : p);
      if (!r) {
        setKcal("");
        setProtein("");
      }
      haptic("success");
      track("feature", { name: "trainer", detail: r ? "targets" : "untargets" });
      setNote(r ? t("trn.targetsSaved") : t("trn.targetsCleared"));
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title={t("trn.targets")} icon="leaf">
      <div className="card p-4">
        <p className="text-sm text-muted">{t("trn.targetsHint")}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="trn-kcal" className="block text-sm font-medium">
              {t("trn.targetsKcal")}
            </label>
            <BumpField id="trn-kcal" label={t("trn.targetsKcal")} value={kcal} onChange={setKcal} {...KCAL} />
          </div>
          <div>
            <label htmlFor="trn-protein" className="block text-sm font-medium">
              {t("trn.targetsProtein")}
            </label>
            <BumpField id="trn-protein" label={t("trn.targetsProtein")} value={protein} onChange={setProtein} {...PROTEIN} />
          </div>
        </div>
        {week ? (
          <p className="mt-3 text-sm">
            {t("trn.targetsWeek", { count: week.days, kcal: fmtNum(week.kcal) })}
            {week.protein !== null && ` ${t("trn.targetsWeekProtein", { protein: week.protein })}`}
          </p>
        ) : (
          <p className="mt-3 text-xs text-muted">{body ? t("trn.targetsNoFood") : t("trn.targetsAskShare")}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button className="flex-1" disabled={busy || !changed || (k === null && p === null)} onClick={() => void save(false)}>
            {t("trn.targetsSave")}
          </Button>
          {saved && (
            <Button kind="ghost" disabled={busy} onClick={() => void save(true)}>
              {t("trn.targetsClear")}
            </Button>
          )}
        </div>
        {note && (
          <p className="mt-2 text-sm text-muted" role="status">
            {note}
          </p>
        )}
      </div>
    </Section>
  );
}

/** The client's side, under Your coach: what their coach asked them to eat each day. */
export function TargetsCard({ targets, coach }: { targets: Targets; coach: string }) {
  const parts = [
    targets.kcal ? t("trn.targetsKcalValue", { kcal: fmtNum(targets.kcal) }) : null,
    targets.protein ? t("trn.targetsProteinValue", { protein: targets.protein }) : null,
  ].filter(Boolean);
  return (
    <div className="card mt-3 p-4">
      <p className="text-xs text-muted">{t("trn.targetsFrom", { name: coach || t("trn.noName") })}</p>
      <p className="num mt-1 text-lg font-semibold">{parts.join(" · ")}</p>
      <p className="mt-1 text-sm text-muted">{t("trn.targetsClientHint")}</p>
    </div>
  );
}
