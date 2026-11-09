"use client";
import { useApp } from "@/lib/store";
import { backupJson, saveFile, setsCsv, stamp } from "@/lib/exportData";
import type { Term } from "@/lib/glossary";
import type { Experience, Goal, Variability } from "@/lib/types";
import { fromKg, plainNum, toKg } from "@/lib/units";
import { BRAND } from "@/lib/brand";
import { useEffect, useState } from "react";
import { LANG_NAME, LANGS, num, t, type LangPref } from "@/lib/i18n";
import { cleanA11y, TEXT_SIZES, type Colours, type Contrast, type Hand, type TextSize } from "@/lib/a11y";
import { CalendarSettings } from "./CalendarSettings";
import { CycleSettings } from "./CycleSettings";
import { DelightSettings } from "./DelightSettings";
import { erasePhotos } from "@/lib/photos";
import { MessageSettings } from "./MessageSettings";
import { ImportWorkouts } from "./ImportCsv";
import { deleteEmail } from "@/lib/reminders";
import { SITE_URL } from "@/lib/site";
import { analyticsOn, installId, setAnalytics } from "@/lib/analytics";
import { programName } from "./Programs";
import { go, useRoute } from "./router";
import { BumpField, Button, Chip, Section } from "./ui";

function Row<T extends string | number>({ label, value, options, onPick, info }: { label: string; value: T; options: [T, string][]; onPick: (v: T) => void; info?: Term }) {
  return (
    <Section title={label} info={info}>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map(([v, l]) => <Chip key={String(v)} active={v === value} onClick={() => onPick(v)}>{l}</Chip>)}
      </div>
    </Section>
  );
}

export function Settings() {
  const { profile, setProfile, reset, events, gyms } = useApp();
  const [confirm, setConfirm] = useState(false);
  const [stats, setStats] = useState(analyticsOn());
  const { arg } = useRoute();
  useEffect(() => {
    if (arg) document.getElementById(arg)?.scrollIntoView({ block: "start" });
  }, [arg]);
  return (
    <div className="pb-24">
      <button type="button" onClick={() => go("today")} className="press -ml-2 pt-2 text-muted">‹ {t("nav.back.today")}</button>
      <h1 className="text-[1.75rem] font-extrabold tracking-tight">{t("settings.title")}</h1>
      <Button kind="ghost" className="mt-4 w-full" onClick={() => go("setup")}>{t("settings.rerun")}</Button>
      <Button kind="ghost" className="mt-2 w-full" onClick={() => go("injuries")}>{t("settings.injuries")}</Button>
      <Button kind="ghost" className="mt-2 w-full" onClick={() => go("feedback")}>{t("settings.feedback")}</Button>
      <a href="/me/" className="press mt-2 block w-full rounded-2xl border border-line bg-raised px-5 py-3 text-center text-ink">{t("settings.dashboard")}</a>
      <Button kind="ghost" className="mt-2 w-full" onClick={() => go("training")}>{t("settings.training")}</Button>
      <Section title={t("settings.program")}>
        <button type="button" onClick={() => go("programs")} className="press card flex w-full items-center justify-between px-4 py-3 text-left">
          <span>{programName(profile.planSource?.kind === "program" ? profile.planSource.id : undefined) ?? t("settings.adaptive")}</span>
          <span className="text-accent">{t("settings.change")}</span>
        </button>
      </Section>
      <Section title={t("settings.name")}>
        <input value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} className="card w-full px-4 py-3" placeholder={t("settings.optional")} aria-label={t("settings.name")} />
      </Section>
      <Row<Goal> label={t("settings.goal")} value={profile.goal} onPick={(goal) => setProfile({ goal })} options={[["muscle", t("goal.muscle")], ["strength", t("goal.strength")], ["general", t("goal.general")]]} />
      <Row<Experience> label={t("settings.experience")} value={profile.experience} onPick={(experience) => setProfile({ experience })} options={[["new", t("exp.new")], ["intermediate", t("exp.intermediate")], ["advanced", t("exp.advanced")]]} />
      <Row<number> label={t("settings.days")} value={profile.daysPerWeek} onPick={(daysPerWeek) => setProfile({ daysPerWeek })} options={[1, 2, 3, 4, 5, 6].map((d) => [d, num(d)])} />
      <Row<Variability> info="variety" label={t("settings.variety")} value={profile.variability} onPick={(variability) => setProfile({ variability })} options={[["consistent", t("variety.consistent")], ["balanced", t("variety.balanced")], ["variable", t("variety.variable")]]} />
      <Row<number> info="deloadWeeks" label={t("settings.block")} value={profile.blockWeeks} onPick={(blockWeeks) => setProfile({ blockWeeks })} options={[3, 4, 5, 6].map((d) => [d, t("settings.weeks", { count: d })])} />
      <Row<"dark" | "light" | "system"> label={t("settings.appearance")} value={profile.theme ?? "dark"} onPick={(theme) => setProfile({ theme })} options={[["dark", t("appearance.dark")], ["light", t("appearance.light")], ["system", t("appearance.system")]]} />
      <Row<LangPref> label={t("settings.language")} value={profile.language ?? "system"} onPick={(language) => setProfile({ language })} options={[["system", t("settings.language.system")], ...LANGS.map((l) => [l, LANG_NAME[l]] as [LangPref, string])]} />
      <p className="mt-2 px-1 text-xs text-faint">{t("settings.language.note")}</p>
      <AccessibilitySettings />
      <Section title={t("settings.units")}>
        <div className="flex flex-wrap gap-2">
          {([["kg", t("units.kg")], ["lb", t("units.lb")]] as const).map(([u, l]) => <Chip key={u} active={profile.unit === u} onClick={() => setProfile({ unit: u })}>{l}</Chip>)}
        </div>
        <p className="mt-2 text-xs text-faint">{t("settings.units.note")}</p>
      </Section>
      <Section title={t("settings.bodyweight", { unit: profile.unit })}>
        <BumpField label={t("settings.bodyweight.label")} value={plainNum(fromKg(profile.bodyweight, profile.unit))} onChange={(v) => setProfile({ bodyweight: toKg(Number(v) || 0, profile.unit) })} step={profile.unit === "lb" ? 1 : 0.5} start={fromKg(profile.bodyweight, profile.unit)} min={1} />
      </Section>
      <Row<string> label={t("settings.sounds")} value={profile.restSounds ? "on" : "off"} onPick={(v) => setProfile({ restSounds: v === "on" })} options={[["on", t("settings.on")], ["off", t("settings.off")]]} />
      <Row<string> label={t("settings.vibration")} value={profile.haptics === false ? "off" : "on"} onPick={(v) => setProfile({ haptics: v === "on" })} options={[["on", t("settings.on")], ["off", t("settings.off")]]} />
      <Row<string> label={t("settings.quote")} value={profile.quotes === false ? "off" : "on"} onPick={(v) => setProfile({ quotes: v === "on" })} options={[["on", t("settings.on")], ["off", t("settings.off")]]} />
      <Section title={t("settings.celebrations")}>
        <div className="flex flex-wrap gap-2">
          <Chip active={!profile.lean} onClick={() => setProfile({ lean: false })}>{t("settings.full")}</Chip>
          <Chip active={!!profile.lean} onClick={() => setProfile({ lean: true })}>{t("settings.lean")}</Chip>
        </div>
        <p className="mt-2 text-xs text-faint">{t("settings.lean.note")}</p>
        <Button kind="ghost" className="mt-3 w-full" onClick={() => go("achievements")}>{t("settings.achievements")}</Button>
      </Section>
      <DelightSettings />
      <CalendarSettings />
      <MessageSettings />
      <CycleSettings />
      <Section title={t("settings.stats")}>
        <div className="flex flex-wrap gap-2">
          <Chip active={stats} onClick={() => { setAnalytics(true); setStats(true); }}>{t("settings.stats.on")}</Chip>
          <Chip active={!stats} onClick={() => { setAnalytics(false); setStats(false); }}>{t("settings.off")}</Chip>
        </div>
        <p className="mt-2 text-xs text-faint">{t("settings.stats.note")} <a className="underline" href={`${SITE_URL}/privacy/`} target="_blank" rel="noreferrer">{t("settings.privacy")}</a>{stats ? ` · ${t("settings.installId", { id: installId().slice(0, 8) })}` : ""}</p>
      </Section>
      <Section title={t("settings.trainingBlock")} info="blockWeek">
        <Button kind="ghost" className="w-full" onClick={() => setProfile({ blockStart: Date.now() })}>{t("settings.newBlock")}</Button>
      </Section>
      <Section title={t("settings.data")}>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <Button kind="ghost" onClick={() => void saveFile(`liftsmith-sets-${stamp()}.csv`, "text/csv", setsCsv(events, profile.unit))}>{t("settings.exportCsv")}</Button>
          <Button kind="ghost" onClick={() => void saveFile(`liftsmith-backup-${stamp()}.json`, "application/json", backupJson(profile, gyms, events))}>{t("settings.backup")}</Button>
        </div>
        <p className="mb-3 text-xs text-faint">{t("settings.data.note")}</p>
        <div className="mb-4"><ImportWorkouts /></div>
        {confirm ? (
          <div className="space-y-2">
            <p className="text-sm text-muted">{t("settings.erase.warn")}</p>
            <Button kind="danger" className="w-full" onClick={() => void deleteEmail().finally(() => { void erasePhotos(); void reset(); })}>{t("settings.erase.confirm")}</Button>
            <Button kind="quiet" className="w-full" onClick={() => setConfirm(false)}>{t("settings.cancel")}</Button>
          </div>
        ) : (
          <Button kind="danger" className="w-full" onClick={() => setConfirm(true)}>{t("settings.erase")}</Button>
        )}
      </Section>
      <p className="mt-8 text-center text-xs text-faint">{t("settings.footer", { brand: BRAND.name })}</p>
    </div>
  );
}

/** Settings › Accessibility: text size, colour-blind safe colours and contrast (a11y.ts). */
function AccessibilitySettings() {
  const { profile, setProfile } = useApp();
  const a = cleanA11y(profile.a11y);
  const set = (p: Partial<typeof a>) => setProfile({ a11y: { ...a, ...p } });
  return (
    <div id="accessibility">
      <Row<Hand> label={t("a11y.hand")} value={a.hand} onPick={(hand) => set({ hand })} options={[["off", t("settings.off")], ["right", t("a11y.hand.right")], ["left", t("a11y.hand.left")]]} />
      <p className="mt-2 px-1 text-xs text-faint">{t("a11y.hand.note")}</p>
      <Row<TextSize> label={t("a11y.text")} value={a.text} onPick={(text) => set({ text })} options={TEXT_SIZES.map(([v]) => [v, t(`a11y.text.${v}`)])} />
      <p className="mt-2 px-1 text-xs text-faint">{t("a11y.text.note")}</p>
      <Row<Colours> label={t("a11y.colours")} value={a.colours} onPick={(colours) => set({ colours })} options={[["standard", t("a11y.colours.standard")], ["cvd", t("a11y.colours.cvd")]]} />
      <p className="mt-2 px-1 text-xs text-faint">{t("a11y.colours.note")}</p>
      <Row<Contrast> label={t("a11y.contrast")} value={a.contrast} onPick={(contrast) => set({ contrast })} options={[["system", t("a11y.text.system")], ["standard", t("a11y.colours.standard")], ["more", t("a11y.contrast.more")]]} />
      <p className="mt-2 px-1 text-xs text-faint">{t("a11y.contrast.note")}</p>
    </div>
  );
}
