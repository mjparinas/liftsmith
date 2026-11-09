"use client";
import { useApp } from "@/lib/store";
import { backupJson, saveFile, setsCsv, stamp } from "@/lib/exportData";
import type { Term } from "@/lib/glossary";
import type { Experience, Goal, Variability } from "@/lib/types";
import { fmtNum, fromKg, toKg } from "@/lib/units";
import { BRAND } from "@/lib/brand";
import { useEffect, useState } from "react";
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
      <button type="button" onClick={() => go("today")} className="press -ml-2 pt-2 text-muted">‹ Today</button>
      <h1 className="text-[1.75rem] font-extrabold tracking-tight">Settings</h1>
      <Button kind="ghost" className="mt-4 w-full" onClick={() => go("setup")}>Run setup again</Button>
      <Button kind="ghost" className="mt-2 w-full" onClick={() => go("injuries")}>Injuries and sore spots</Button>
      <Button kind="ghost" className="mt-2 w-full" onClick={() => go("feedback")}>Send feedback or report a bug</Button>
      <a href="/me/" className="press mt-2 block w-full rounded-2xl border border-line bg-raised px-5 py-3 text-center text-ink">Open the big-screen dashboard</a>
      <Section title="Program">
        <button type="button" onClick={() => go("programs")} className="press card flex w-full items-center justify-between px-4 py-3 text-left">
          <span>{programName(profile.planSource?.kind === "program" ? profile.planSource.id : undefined) ?? "Adaptive"}</span>
          <span className="text-accent">Change ›</span>
        </button>
      </Section>
      <Section title="Your name">
        <input value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} className="card w-full px-4 py-3" placeholder="Optional" aria-label="Your name" />
      </Section>
      <Row<Goal> label="Goal" value={profile.goal} onPick={(goal) => setProfile({ goal })} options={[["muscle", "Build muscle"], ["strength", "Get stronger"], ["general", "Stay fit"]]} />
      <Row<Experience> label="Experience" value={profile.experience} onPick={(experience) => setProfile({ experience })} options={[["new", "New"], ["intermediate", "Some"], ["advanced", "Experienced"]]} />
      <Row<number> label="Days a week" value={profile.daysPerWeek} onPick={(daysPerWeek) => setProfile({ daysPerWeek })} options={[1, 2, 3, 4, 5, 6].map((d) => [d, String(d)])} />
      <Row<Variability> info="variety" label="Exercise variety" value={profile.variability} onPick={(variability) => setProfile({ variability })} options={[["consistent", "More consistent"], ["balanced", "Balanced"], ["variable", "More variety"]]} />
      <Row<number> info="deloadWeeks" label="Build weeks before a deload" value={profile.blockWeeks} onPick={(blockWeeks) => setProfile({ blockWeeks })} options={[3, 4, 5, 6].map((d) => [d, `${d} weeks`])} />
      <Row<"dark" | "light" | "system"> label="Appearance" value={profile.theme ?? "dark"} onPick={(theme) => setProfile({ theme })} options={[["dark", "Dark"], ["light", "Light"], ["system", "Match system"]]} />
      <AccessibilitySettings />
      <Row<"kg" | "lb"> label="Units" value={profile.unit} onPick={(unit) => setProfile({ unit })} options={[["kg", "Kilograms"], ["lb", "Pounds"]]} />
      <Section title={`Body weight (${profile.unit})`}>
        <BumpField label="Body weight" value={fmtNum(fromKg(profile.bodyweight, profile.unit))} onChange={(v) => setProfile({ bodyweight: toKg(Number(v) || 0, profile.unit) })} step={profile.unit === "lb" ? 1 : 0.5} start={fromKg(profile.bodyweight, profile.unit)} min={1} />
      </Section>
      <Row<string> label="Sounds" value={profile.restSounds ? "on" : "off"} onPick={(v) => setProfile({ restSounds: v === "on" })} options={[["on", "On"], ["off", "Off"]]} />
      <Row<string> label="Vibration" value={profile.haptics === false ? "off" : "on"} onPick={(v) => setProfile({ haptics: v === "on" })} options={[["on", "On"], ["off", "Off"]]} />
      <Row<string> label="Daily quote on Today" value={profile.quotes === false ? "off" : "on"} onPick={(v) => setProfile({ quotes: v === "on" })} options={[["on", "On"], ["off", "Off"]]} />
      <Section title="Celebrations">
        <div className="flex flex-wrap gap-2">
          <Chip active={!profile.lean} onClick={() => setProfile({ lean: false })}>Full: confetti, sounds, crates</Chip>
          <Chip active={!!profile.lean} onClick={() => setProfile({ lean: true })}>Lean mode</Chip>
        </div>
        <p className="mt-2 text-xs text-faint">Lean mode turns off confetti, celebration sounds and animations. Rest timer sounds and haptics stay on. XP, streaks and badges keep counting either way.</p>
        <Button kind="ghost" className="mt-3 w-full" onClick={() => go("achievements")}>Achievements and locker</Button>
      </Section>
      <DelightSettings />
      <CalendarSettings />
      <MessageSettings />
      <CycleSettings />
      <Section title="Usage stats">
        <div className="flex flex-wrap gap-2">
          <Chip active={stats} onClick={() => { setAnalytics(true); setStats(true); }}>Share anonymous stats</Chip>
          <Chip active={!stats} onClick={() => { setAnalytics(false); setStats(false); }}>Off</Chip>
        </div>
        <p className="mt-2 text-xs text-faint">Screens and features used, device model, app version and how you found us, under a random install id. Never your weights, workout details or health data. <a className="underline" href={`${SITE_URL}/privacy/`} target="_blank" rel="noreferrer">Privacy</a>{stats ? ` · Install id ${installId().slice(0, 8)}` : ""}</p>
      </Section>
      <Section title="Training block" info="blockWeek">
        <Button kind="ghost" className="w-full" onClick={() => setProfile({ blockStart: Date.now() })}>Start a new block today</Button>
      </Section>
      <Section title="Data">
        <div className="mb-3 grid grid-cols-2 gap-2">
          <Button kind="ghost" onClick={() => void saveFile(`liftsmith-sets-${stamp()}.csv`, "text/csv", setsCsv(events, profile.unit))}>Export sets (CSV)</Button>
          <Button kind="ghost" onClick={() => void saveFile(`liftsmith-backup-${stamp()}.json`, "application/json", backupJson(profile, gyms, events))}>Full backup (JSON)</Button>
        </div>
        <p className="mb-3 text-xs text-faint">The CSV has every working set for spreadsheets. The backup has everything: profile, gyms, workouts, body weight and heart rate.</p>
        <div className="mb-4"><ImportWorkouts /></div>
        {confirm ? (
          <div className="space-y-2">
            <p className="text-sm text-muted">This erases every workout on this device, and your reminder email address from our server. It can&apos;t be undone.</p>
            <Button kind="danger" className="w-full" onClick={() => void deleteEmail().finally(() => { void erasePhotos(); void reset(); })}>Erase everything</Button>
            <Button kind="quiet" className="w-full" onClick={() => setConfirm(false)}>Cancel</Button>
          </div>
        ) : (
          <Button kind="danger" className="w-full" onClick={() => setConfirm(true)}>Erase this device</Button>
        )}
      </Section>
      <p className="mt-8 text-center text-xs text-faint">{BRAND.name} · everything is stored on this device</p>
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
      <Row<Hand> label="One-handed controls" value={a.hand} onPick={(hand) => set({ hand })} options={[["off", "Off"], ["right", "Right hand"], ["left", "Left hand"]]} />
      <p className="mt-2 px-1 text-xs text-faint">During a workout, the weight and rep buttons move down next to Log set, with Log set under the thumb of the hand holding the phone. Hold a + or − button to keep changing.</p>
      <Row<TextSize> label="Text size" value={a.text} onPick={(text) => set({ text })} options={TEXT_SIZES} />
      <p className="mt-2 px-1 text-xs text-faint">Match my phone follows the text size in your phone&apos;s settings. Every screen reflows to fit larger text.</p>
      <Row<Colours> label="Colours" value={a.colours} onPick={(colours) => set({ colours })} options={[["standard", "Standard"], ["cvd", "Colour-blind safe"]]} />
      <p className="mt-2 px-1 text-xs text-faint">Colour-blind safe uses blue, orange and pink instead of green, amber and red for recovery and status, so they stay apart with red-green or blue-yellow colour blindness. The recovery map also marks recovering muscles with dots and fatigued ones with stripes.</p>
      <Row<Contrast> label="Contrast" value={a.contrast} onPick={(contrast) => set({ contrast })} options={[["system", "Match my phone"], ["standard", "Standard"], ["more", "More"]]} />
      <p className="mt-2 px-1 text-xs text-faint">More makes secondary text and outlines stronger and removes background glows. For less motion, use Lean mode below or your phone&apos;s reduce motion setting.</p>
    </div>
  );
}
