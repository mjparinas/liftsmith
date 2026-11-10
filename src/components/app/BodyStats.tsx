"use client";

// Your stats (Melvin, 2026-11-10: "There should be a main area that allows the user to add their stats and
// calculators and other pages that require it should grab it from there"). The one place to set sex, age and
// height, at the top of Settings › Body and units (#/settings/stats). TDEE, fitness age, DOTS and the strength
// score read the profile and, when something is missing, show StatsNeeded with one link here. Health Connect
// fills height; Apple Health fills height, sex and birth year. Height follows the units setting: centimetres,
// or feet and inches with pounds.
import { useEffect, useState } from "react";

import { connectHealth, healthAvailable, readBodyStats } from "@/lib/health";
import { inSentence, list, t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { currentKg } from "@/lib/tdee";
import type { Profile } from "@/lib/types";
import { cmToFtIn, fmtHeight, fmtNum, fromKg, ftInToCm } from "@/lib/units";

import { go } from "./router";
import { BumpField, Button, Chip, Section } from "./ui";

export type Stat = "sex" | "age" | "height";

/** Opens Your stats (Settings › Body and units, scrolled to it). */
export const openStats = () => go("settings", "stats");

/** Age from the birth year, the way every tool works it out. */
export const ageOf = (p: Pick<Profile, "birthYear">, now = Date.now()) =>
  p.birthYear ? new Date(now).getFullYear() - p.birthYear : undefined;

/** Which of `need` Your stats doesn't have yet. */
export function missingStats(p: Profile, need: readonly Stat[]): Stat[] {
  return need.filter((s) => (s === "sex" ? !p.sex : s === "age" ? !p.birthYear : !p.heightCm));
}

const ios = () => typeof navigator !== "undefined" && /iPhone|iPad/.test(navigator.userAgent);

/**
 * What a screen shows when it needs stats the lifter hasn't set: what's missing, and the one link to Your
 * stats. Renders nothing when everything is there.
 */
export function StatsNeeded({ need }: { need: readonly Stat[] }) {
  const { profile } = useApp();
  const gaps = missingStats(profile, need);
  if (!gaps.length) return null;
  return (
    <div className="card card-tint p-4" style={{ "--tint": "var(--color-accent)" } as React.CSSProperties} role="status">
      <p className="text-sm">{t("stats.needed", { items: list(gaps.map((g) => t(`stats.item.${g}`))) })}</p>
      <Button kind="ghost" className="mt-3 w-full" onClick={openStats}>
        {t("stats.add")} ›
      </Button>
    </div>
  );
}

/** The stats, read only, with one button to Your stats: for screens that use them (TDEE). */
export function StatsSummary({ need }: { need: readonly Stat[] }) {
  const { profile, events } = useApp();
  const gaps = missingStats(profile, need);
  if (gaps.length) return <StatsNeeded need={need} />;
  const age = ageOf(profile);
  const rows: [string, string | undefined][] = [
    [t("stats.sex"), profile.sex ? t(profile.sex === "female" ? "stats.female" : "stats.male") : undefined],
    [t("stats.age"), age !== undefined ? String(age) : undefined],
    [t("stats.height"), profile.heightCm ? fmtHeight(profile.heightCm, profile.unit) : undefined],
    [t("stats.weight"), `${fmtNum(Math.round(fromKg(currentKg(events, profile), profile.unit) * 10) / 10)} ${profile.unit}`],
  ];
  return (
    <div className="card p-4">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-muted">{k}</dt>
            <dd className={`num font-semibold ${v ? "" : "text-faint"}`}>{v ?? t("stats.notSet")}</dd>
          </div>
        ))}
      </dl>
      <Button kind="ghost" className="mt-3 w-full" onClick={openStats}>
        {t("stats.edit")} ›
      </Button>
    </div>
  );
}

/** The editor: Settings › Body and units › Your stats. */
export function BodyStats() {
  // Remounted after a health fill and when units change, so the boxes show what came in, in the right unit.
  const unit = useApp((s) => s.profile.unit);
  const [rev, setRev] = useState(0);
  const [canHealth, setCanHealth] = useState(false);
  const [note, setNote] = useState("");
  useEffect(() => void healthAvailable().then(setCanHealth), []);

  const fill = async () => {
    if (!(await connectHealth())) return setNote(t("stats.healthNone"));
    const before = useApp.getState().profile;
    const weighIns = await useApp.getState().importHealthBody();
    useApp.getState().applyHealthBody(await readBodyStats(true));
    const after = useApp.getState().profile;
    const got = [
      after.sex !== before.sex && t("stats.item.sex"),
      after.birthYear !== before.birthYear && t("stats.item.age"),
      after.heightCm !== before.heightCm && t("stats.item.height"),
      weighIns > 0 && t("stats.item.weighIns"),
    ].filter((x): x is string => !!x);
    setNote(got.length ? t("stats.healthDone", { items: list(got) }) : t("stats.healthNothing"));
    setRev((r) => r + 1);
  };

  return (
    <div id="stats">
      <Section title={t("stats.title")} icon="heart">
        <div className="card space-y-4 p-4">
          <p className="text-sm text-muted">{t("stats.note")}</p>
          <StatsFields key={`${rev}-${unit}`} />
          {canHealth && (
            <div>
              <Button kind="ghost" className="w-full" onClick={() => void fill()}>
                {t("stats.fromHealth", { source: ios() ? "Apple Health" : "Health Connect" })}
              </Button>
              {!ios() && <p className="mt-2 text-xs text-faint">{t("stats.androidNote")}</p>}
              {note && (
                <p className="mt-2 text-sm text-muted" role="status">
                  {note}
                </p>
              )}
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

function StatsFields() {
  const { profile, setProfile } = useApp();
  const imperial = profile.unit === "lb";
  const [age, setAge] = useState(() => (profile.birthYear ? String(ageOf(profile)) : ""));
  const [cm, setCm] = useState(() => (profile.heightCm ? String(Math.round(profile.heightCm)) : ""));
  const split = profile.heightCm ? cmToFtIn(profile.heightCm) : undefined;
  const [ft, setFt] = useState(split ? String(split.ft) : "");
  const [inch, setInch] = useState(split ? String(split.inch) : "");
  const female = profile.sex === "female";

  const onAge = (v: string) => {
    setAge(v);
    const n = Number(v);
    if (Number.isInteger(n) && n >= 13 && n <= 100) setProfile({ birthYear: new Date().getFullYear() - n });
  };
  const saveHeight = (heightCm: number) => {
    if (heightCm >= 100 && heightCm <= 250) setProfile({ heightCm, heightAt: Date.now() });
  };
  const onCm = (v: string) => {
    setCm(v);
    saveHeight(Math.round(Number(v) * 10) / 10);
  };
  // Inches carry into feet both ways, so holding + past 11 in goes to the next foot.
  const onFtIn = (fText: string, iText: string) => {
    let f = Number(fText);
    let i = Number(iText);
    if (iText.trim() !== "" && Number.isFinite(i) && fText.trim() !== "" && Number.isFinite(f)) {
      if (i >= 12) {
        f += Math.floor(i / 12);
        i %= 12;
      } else if (i < 0 && f > 0) {
        f -= 1;
        i += 12;
      }
      fText = String(f);
      iText = String(i);
    }
    setFt(fText);
    setInch(iText);
    if (fText.trim() === "" || !Number.isFinite(f) || !Number.isFinite(i)) return;
    saveHeight(ftInToCm(f, iText.trim() === "" ? 0 : i));
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold" id="stats-sex">
          {t("stats.sex")}
        </span>
        <div className="flex gap-2" role="group" aria-labelledby="stats-sex">
          <Chip active={profile.sex === "female"} onClick={() => setProfile({ sex: "female" })}>
            {t("stats.female")}
          </Chip>
          <Chip active={profile.sex === "male"} onClick={() => setProfile({ sex: "male" })}>
            {t("stats.male")}
          </Chip>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <label htmlFor="stats-age" className="shrink-0 font-semibold">
          {t("stats.age")}
        </label>
        <BumpField
          id="stats-age"
          className="w-48 max-w-full"
          label={inSentence(t("stats.age"), true)}
          value={age}
          onChange={onAge}
          step={1}
          start={30}
          min={13}
          max={100}
          placeholder={t("stats.agePlaceholder")}
        />
      </div>
      {imperial ? (
        <fieldset>
          <legend className="font-semibold">{t("stats.height")}</legend>
          <div className="mt-2 space-y-3">
            <div className="flex items-center justify-end gap-3">
              <BumpField
                className="w-48 max-w-full"
                label={inSentence(t("stats.feet"), true)}
                value={ft}
                onChange={(v) => onFtIn(v, inch === "" && v !== "" ? "0" : inch)}
                step={1}
                start={5}
                min={3}
                max={8}
              />
              <span className="w-5 text-sm text-muted" aria-hidden>
                {t("stats.ft")}
              </span>
            </div>
            <div className="flex items-center justify-end gap-3">
              <BumpField
                className="w-48 max-w-full"
                label={inSentence(t("stats.inches"), true)}
                value={inch}
                onChange={(v) => onFtIn(ft === "" && v !== "" ? "5" : ft, v)}
                step={1}
                start={female ? 4 : 10}
                min={-1}
                max={12}
              />
              <span className="w-5 text-sm text-muted" aria-hidden>
                {t("stats.in")}
              </span>
            </div>
          </div>
        </fieldset>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <label htmlFor="stats-cm" className="shrink-0 font-semibold">
            {t("stats.heightCm")}
          </label>
          <BumpField
            id="stats-cm"
            className="w-48 max-w-full"
            label={inSentence(t("stats.height"), true)}
            value={cm}
            onChange={onCm}
            step={1}
            start={female ? 163 : 177}
            min={100}
            max={250}
          />
        </div>
      )}
    </>
  );
}
