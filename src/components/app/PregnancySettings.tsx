"use client";

import { useState } from "react";

import { startOfDay } from "@/lib/cycle";
import { t } from "@/lib/i18n";
import { birthFromWeeks, bodyMode, dueFromWeeks, type Avoid, type BodyMode } from "@/lib/pregnancy";
import { useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";

import { BumpField, Button, Chip, InlineSwitch, Section, Sheet } from "./ui";

type Stage = "pregnant" | "postpartum";

/** What the plan does in this phase, one plain line each: the load, the effort, and what's left out. */
export function modeLines(mode: BodyMode): string[] {
  const lines = [mode.pct < 100 ? t("preg.does.load", { pct: mode.pct }) : t("preg.does.same"), t("preg.does.rir", { rir: mode.minRir })];
  lines.push(t("preg.does.sets", { sets: mode.maxSets }));
  for (const a of mode.avoid as readonly Avoid[]) lines.push(t(`preg.avoid.${a}`));
  lines.push(t("preg.does.noPush"));
  return lines;
}

/**
 * Settings › Body and units › Pregnancy and postpartum (pregnancy.ts, docs/decisions/pregnancy.md): its own consent,
 * weeks along or since birth on a stepper (no dates to type), what the plan does now and why, and turning it off.
 */
export function PregnancySettings() {
  const { profile, setProfile } = useApp();
  const now = useNow(60_000);
  const today = startOfDay(now);
  const [setup, setSetup] = useState(false);
  const [stage, setStage] = useState<Stage>("pregnant");
  const [weeks, setWeeks] = useState("12");
  const [csection, setCsection] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const p = profile.pregnancy;
  const mode = bodyMode(profile, now);

  const save = (s: Stage, w: number, cs: boolean, consentAt = p?.consentAt ?? Date.now()) =>
    setProfile({
      pregnancy:
        s === "pregnant"
          ? { consentAt, due: dueFromWeeks(w, today) }
          : { consentAt, ...(p?.due !== undefined ? { due: p.due } : {}), birth: birthFromWeeks(w, today), csection: cs },
    });

  if (!p || !mode) {
    // Offered to everyone but lifters whose stats say male (Your stats); it stays reachable once it's on.
    if (profile.sex === "male") return null;
    return (
      <Section title={t("preg.title")}>
        <p className="text-sm text-muted">{t("preg.intro")}</p>
        <Button kind="ghost" className="mt-3 w-full" onClick={() => setSetup(true)}>
          {t("preg.setUp")}
        </Button>
        <Sheet open={setup} onClose={() => setSetup(false)} title={t("preg.title")}>
          <div className="space-y-3 text-sm">
            <p>{t("preg.consent1")}</p>
            <p>
              <strong>{t("preg.consent2a")}</strong> {t("preg.consent2b")}
            </p>
            <p>{t("preg.consent3")}</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t("preg.stage")}>
              <Chip active={stage === "pregnant"} onClick={() => setStage("pregnant")}>
                {t("preg.stage.pregnant")}
              </Chip>
              <Chip active={stage === "postpartum"} onClick={() => setStage("postpartum")}>
                {t("preg.stage.postpartum")}
              </Chip>
            </div>
            <BumpField
              label={t(stage === "pregnant" ? "preg.weeksAlong" : "preg.weeksSince")}
              value={weeks}
              onChange={setWeeks}
              step={1}
              start={stage === "pregnant" ? 12 : 6}
              min={stage === "pregnant" ? 1 : 0}
              max={stage === "pregnant" ? 42 : 104}
            />
            {stage === "postpartum" && (
              <InlineSwitch label={t("preg.csection")} hint={t("preg.csectionHint")} on={csection} onChange={setCsection} />
            )}
            <Button
              className="w-full"
              onClick={() => {
                save(stage, Number(weeks) || 0, csection, Date.now());
                setSetup(false);
              }}
            >
              {t("preg.agree")}
            </Button>
            <Button kind="quiet" className="w-full" onClick={() => setSetup(false)}>
              {t("preg.notNow")}
            </Button>
          </div>
        </Sheet>
      </Section>
    );
  }

  const pregnant = mode.kind === "pregnant";
  const settled = mode.phase === "settle";
  return (
    <Section title={t("preg.title")}>
      <div className="card space-y-3 p-4">
        <p className="font-semibold">{t(`preg.status.${mode.phase}`, { week: mode.week })}</p>
        <div>
          <p className="text-sm text-muted">{t("preg.now")}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {modeLines(mode).map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          {mode.nextAt !== undefined && <p className="mt-2 text-sm text-muted">{t(`preg.next.${mode.kind}`, { week: mode.nextAt })}</p>}
          {settled && <p className="mt-2 text-sm text-muted">{t("preg.settled")}</p>}
        </div>
        <BumpField
          label={t(pregnant ? "preg.weeksAlong" : "preg.weeksSince")}
          value={String(mode.week)}
          onChange={(v) => {
            const w = Number(v);
            if (!Number.isFinite(w)) return;
            if (pregnant) save("pregnant", Math.min(42, Math.max(1, w)), false);
            else save("postpartum", Math.min(104, Math.max(0, w)), !!p.csection);
          }}
          step={1}
          start={mode.week}
          min={pregnant ? 1 : 0}
          max={pregnant ? 42 : 104}
        />
        {pregnant ? (
          <Button kind="ghost" className="w-full" onClick={() => save("postpartum", 0, false)}>
            {t("preg.born")}
          </Button>
        ) : (
          <InlineSwitch
            label={t("preg.csection")}
            hint={t("preg.csectionHint")}
            on={!!p.csection}
            onChange={(cs) => setProfile({ pregnancy: { ...p, birth: p.birth ?? p.due, csection: cs } })}
          />
        )}
        <div className="rounded-xl bg-raised p-3 text-sm">
          <p>{t(pregnant ? "preg.stop.pregnant" : "preg.stop.postpartum")}</p>
        </div>
        <p className="text-xs text-faint">{t("preg.notAdvice")}</p>
        {confirmOff ? (
          <div className="space-y-2">
            <p className="text-sm text-muted">{t("preg.offNote")}</p>
            <Button
              kind="danger"
              className="w-full"
              onClick={() => {
                setProfile({ pregnancy: undefined });
                setConfirmOff(false);
              }}
            >
              {t("preg.offConfirm")}
            </Button>
            <Button kind="quiet" className="w-full" onClick={() => setConfirmOff(false)}>
              {t("preg.cancel")}
            </Button>
          </div>
        ) : (
          <Button kind={settled ? "ghost" : "quiet"} className="w-full" onClick={() => setConfirmOff(true)}>
            {t(settled ? "preg.backToUsual" : "preg.off")}
          </Button>
        )}
      </div>
    </Section>
  );
}
