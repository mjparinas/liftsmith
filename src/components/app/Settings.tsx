"use client";
import { useApp } from "@/lib/store";
import type { Experience, Goal, Variability } from "@/lib/types";
import { fmtNum, fromKg, toKg } from "@/lib/units";
import { BRAND } from "@/lib/brand";
import { useState } from "react";
import { CalendarSettings } from "./CalendarSettings";
import { CycleSettings } from "./CycleSettings";
import { MessageSettings } from "./MessageSettings";
import { deleteEmail } from "@/lib/reminders";
import { SITE_URL } from "@/lib/site";
import { analyticsOn, installId, setAnalytics } from "@/lib/analytics";
import { go } from "./router";
import { Button, Chip, Section } from "./ui";

function Row<T extends string | number>({ label, value, options, onPick }: { label: string; value: T; options: [T, string][]; onPick: (v: T) => void }) {
  return (
    <Section title={label}>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, l]) => <Chip key={String(v)} active={v === value} onClick={() => onPick(v)}>{l}</Chip>)}
      </div>
    </Section>
  );
}

export function Settings() {
  const { profile, setProfile, reset } = useApp();
  const [confirm, setConfirm] = useState(false);
  const [stats, setStats] = useState(analyticsOn());
  return (
    <div className="pb-24">
      <button type="button" onClick={() => go("today")} className="press -ml-2 pt-2 text-muted">‹ Today</button>
      <h1 className="text-2xl font-bold">Settings</h1>
      <Button kind="ghost" className="mt-4 w-full" onClick={() => go("setup")}>Run setup again</Button>
      <Button kind="ghost" className="mt-2 w-full" onClick={() => go("injuries")}>Injuries and sore spots</Button>
      <Button kind="ghost" className="mt-2 w-full" onClick={() => go("feedback")}>Send feedback or report a bug</Button>
      <a href="/me/" className="press mt-2 block w-full rounded-2xl border border-line bg-raised px-5 py-3 text-center text-ink">Open the big-screen dashboard</a>
      <Section title="Your name">
        <input value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} className="card w-full px-4 py-3" placeholder="Optional" aria-label="Your name" />
      </Section>
      <Row<Goal> label="Goal" value={profile.goal} onPick={(goal) => setProfile({ goal })} options={[["muscle", "Build muscle"], ["strength", "Get stronger"], ["general", "Stay fit"]]} />
      <Row<Experience> label="Experience" value={profile.experience} onPick={(experience) => setProfile({ experience })} options={[["new", "New"], ["intermediate", "Some"], ["advanced", "Experienced"]]} />
      <Row<number> label="Days a week" value={profile.daysPerWeek} onPick={(daysPerWeek) => setProfile({ daysPerWeek })} options={[1, 2, 3, 4, 5, 6].map((d) => [d, String(d)])} />
      <Row<Variability> label="Exercise variety" value={profile.variability} onPick={(variability) => setProfile({ variability })} options={[["consistent", "More consistent"], ["balanced", "Balanced"], ["variable", "More variety"]]} />
      <Row<number> label="Build weeks before a deload" value={profile.blockWeeks} onPick={(blockWeeks) => setProfile({ blockWeeks })} options={[3, 4, 5, 6].map((d) => [d, `${d} weeks`])} />
      <Row<"kg" | "lb"> label="Units" value={profile.unit} onPick={(unit) => setProfile({ unit })} options={[["kg", "Kilograms"], ["lb", "Pounds"]]} />
      <Section title={`Body weight (${profile.unit})`}>
        <input inputMode="decimal" value={fmtNum(fromKg(profile.bodyweight, profile.unit))} onChange={(e) => setProfile({ bodyweight: toKg(Number(e.target.value) || 0, profile.unit) })} className="card num w-full px-4 py-3" aria-label="Body weight" />
      </Section>
      <Row<string> label="Rest timer sounds" value={profile.restSounds ? "on" : "off"} onPick={(v) => setProfile({ restSounds: v === "on" })} options={[["on", "On"], ["off", "Off"]]} />
      <Section title="Celebrations">
        <div className="flex flex-wrap gap-2">
          <Chip active={!profile.lean} onClick={() => setProfile({ lean: false })}>Full: confetti, sounds, crates</Chip>
          <Chip active={!!profile.lean} onClick={() => setProfile({ lean: true })}>Lean mode</Chip>
        </div>
        <p className="mt-2 text-xs text-faint">Lean mode turns off confetti, celebration sounds and animations. Rest timer sounds and haptics stay on. XP, streaks and badges keep counting either way.</p>
        <Button kind="ghost" className="mt-3 w-full" onClick={() => go("achievements")}>Achievements and locker</Button>
      </Section>
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
      <Section title="Training block">
        <Button kind="ghost" className="w-full" onClick={() => setProfile({ blockStart: Date.now() })}>Start a new block today</Button>
      </Section>
      <Section title="Data">
        {confirm ? (
          <div className="space-y-2">
            <p className="text-sm text-muted">This erases every workout on this device, and your reminder email address from our server. It can&apos;t be undone.</p>
            <Button kind="danger" className="w-full" onClick={() => void deleteEmail().finally(() => void reset())}>Erase everything</Button>
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
