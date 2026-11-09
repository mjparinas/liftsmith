"use client";
import { itemSeconds } from "@/lib/generator";
import { useNow } from "@/lib/useNow";
import { BodyMap } from "@/components/BodyMap";
import { exercise } from "@/lib/exercises";
import { haptic } from "@/lib/juice";
import { CALL_TEXT, type Call } from "@/lib/readiness";
import { recovery } from "@/lib/recovery";
import { useApp } from "@/lib/store";
import { MUSCLE_LABEL, type Muscle } from "@/lib/types";
import { busyTimes, fitLength, freeMinutes, type Busy } from "@/lib/calendar";
import { useEffect, useMemo, useState } from "react";
import { loadText, repsText } from "./format";
import { programName } from "./Programs";
import { go } from "./router";
import { Button, Section } from "./ui";
import { useGame } from "./Achievements";
import { TodayGame } from "./TodayGame";

export function Flame({ weeks, freezes = 0 }: { weeks: number; freezes?: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-sm font-semibold num" title={`${weeks}-week streak${freezes ? `, ${freezes} freeze${freezes > 1 ? "s" : ""}` : ""}`}>
      <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden>
        <path d="M7 0c1 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-8z" fill={weeks > 0 ? "#ff8a3d" : "#5b6777"} />
      </svg>
      {weeks}
      {freezes > 0 && <span aria-label={`${freezes} streak freeze${freezes > 1 ? "s" : ""}`}>{" 🧊"}{freezes > 1 ? freezes : ""}</span>}
    </span>
  );
}

export function Today() {
  const { profile, gyms, preview, events, setProfile, start, active, readiness, callOverride, setCall, pickedByLocation } = useApp();
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const now = useNow();
  const rec = useMemo(() => recovery(events, now), [events, now]);
  const g = useGame();
  const streak = g.streak;
  const lvl = g.level;
  const focus = [...new Set(preview?.items.map((i) => i.focus) ?? [])] as Muscle[];
  const hour = new Date().getHours();
  const fixed = !!preview?.program?.fixed;
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="pb-40">
      <header className="flex items-center justify-between pt-2">
        <div>
          <p className="text-sm text-muted">{hello}{profile.name ? `, ${profile.name}` : ""}</p>
          <h1 className="text-2xl font-bold">Today&apos;s workout</h1>
        </div>
        <div className="flex items-center gap-2">
          <Flame weeks={streak.weeks} freezes={streak.freezes} />
          <button type="button" onClick={() => go("achievements")} className="press min-h-9 rounded-full bg-accent/15 px-2.5 py-1 text-sm font-semibold text-accent" title={`${lvl.title}: ${lvl.into} of ${lvl.span} XP to ${lvl.next ?? "max"}`}>Lv {lvl.level}</button>
          <button type="button" aria-label="Settings" onClick={() => go("settings")} className="press grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
          </button>
        </div>
      </header>

      {active && (
        <button type="button" onClick={() => go("workout")} className="press animate-glow mt-4 flex w-full items-center justify-between rounded-2xl bg-accent px-4 py-3 text-left font-semibold text-accent-ink">
          Workout in progress <span>Resume →</span>
        </button>
      )}

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <button type="button" onClick={() => go("gym")} className="press rounded-full border border-line bg-surface px-3 py-1.5">
          📍 {gym?.name ?? "Add a gym"}{gym && pickedByLocation === gym.id ? " · you're here" : ""}
        </button>
        {preview?.program && (
          <button type="button" onClick={() => go("programs")} className="press rounded-full border border-line bg-surface px-3 py-1.5">
            📋 {programName(preview.program.id)} · {preview.program.dayName}
          </button>
        )}
        {preview && fixed && <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-muted">{preview.program!.note}</span>}
        {preview && !fixed && (
          <span className={`rounded-full px-3 py-1.5 ${preview.week.deload ? "bg-warn/15 text-warn" : "bg-surface text-muted border border-line"}`}>
            {preview.week.label} · RIR {preview.week.rir}
          </span>
        )}
        {streak.needed > 0 && <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-muted">{streak.needed} more this week for your goal</span>}
      </div>

      {readiness && preview && !active && !fixed && (
        <section className="card mt-4 p-4" aria-labelledby="call-title">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="call-title" className="text-lg font-semibold">{CALL_TEXT[preview.call].label}</h2>
            <span className="num text-sm text-muted">Readiness {readiness.score}</span>
          </div>
          <p className="mt-1 text-sm text-muted">{preview.challenge ? "Challenge day: your first lift ends with an as-many-reps-as-you-can set." : CALL_TEXT[preview.call].blurb}</p>
          {readiness.signals.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-sm">
              {readiness.signals.slice(0, 3).map((g) => (
                <li key={g.text} className={g.points > 0 ? "text-accent" : g.points < 0 ? "text-warn" : "text-muted"}>{g.points > 0 ? "▲" : g.points < 0 ? "▼" : "•"} {g.text}</li>
              ))}
            </ul>
          )}
          <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="Today's call">
            {(["recover", "normal", "push"] as Call[]).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={preview.call === c}
                onClick={() => { haptic("tick"); setCall(c === readiness.call ? null : c); }}
                className={`press min-h-11 rounded-xl border text-sm font-semibold ${preview.call === c ? "border-accent bg-accent/10" : "border-line bg-surface text-muted"}`}
              >
                {c === "recover" ? "Go easy" : c === "normal" ? "As planned" : "Push"}
              </button>
            ))}
          </div>
          {callOverride && <p className="mt-2 text-xs text-faint">Your call today. We suggested {CALL_TEXT[readiness.call].label.toLowerCase()}.</p>}
        </section>
      )}

      {!active && <TodayGame />}

      {!fixed && <div className="card mt-4 p-4">
        <div className="flex items-baseline justify-between">
          <label htmlFor="len" className="text-sm font-medium text-muted">Workout length</label>
          <span className="num text-2xl font-bold">{profile.minutes}<span className="ml-1 text-base font-medium text-muted">min</span></span>
        </div>
        <input
          id="len"
          type="range"
          min={15}
          max={90}
          step={5}
          value={profile.minutes}
          onChange={(e) => {
            haptic("tick");
            setProfile({ minutes: Number(e.target.value) });
          }}
          className="slider mt-3 w-full"
        />
        <div className="mt-1 flex justify-between text-xs text-faint num"><span>15</span><span>45</span><span>90</span></div>
        <FitAroundCalendar />
      </div>}

      {preview && preview.items.length > 0 ? (
        <>
          <Section title={`${preview.items.length} exercises · about ${preview.estMinutes} min`}>
            <ol className="card divide-y divide-line">
              {preview.items.map((it, i) => {
                const ex = exercise(it.exerciseId);
                return (
                  <li key={it.exerciseId} className="animate-rise flex items-center gap-3 px-4 py-3" style={{ animationDelay: `${i * 30}ms` }}>
                    <span className="num grid h-8 w-8 shrink-0 place-items-center rounded-full bg-raised text-sm text-muted">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{ex.name}</div>
                      <div className="text-sm text-muted num">
                        {it.label ? `${it.label} · ` : ""}{it.scheme ?? `${it.sets} × ${repsText(ex, it.target.reps)}`} · {(it.setTargets ?? []).some((t) => t.weight > it.target.weight) ? "up to " : ""}{loadText(ex, Math.max(it.target.weight, ...(it.setTargets ?? []).map((t) => t.weight)), profile.unit)}
                        {" · "}{it.warmup ? `${it.warmup.length} warm-up${it.warmup.length > 1 ? "s" : ""} · ` : ""}{Math.max(1, Math.round(itemSeconds(it) / 60))} min
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-raised px-2 py-0.5 text-xs text-muted">{MUSCLE_LABEL[it.focus]}</span>
                  </li>
                );
              })}
            </ol>
          </Section>
          <Section title="Why these muscles">
            <div className="card p-4">
              <BodyMap rec={rec} focus={focus} compact />
              {preview.program ? (
                <p className="mt-3 text-sm text-muted">{preview.program.dayName} of {programName(preview.program.id)}{fixed ? "" : `: recovered muscles from today's group, furthest from this week's ${preview.week.setsPerMuscle}-set goal`}. {preview.program.note}.</p>
              ) : <p className="mt-3 text-sm text-muted">Today targets {focus.slice(0, 4).map((m) => MUSCLE_LABEL[m].toLowerCase()).join(", ")}: recovered, and furthest from this week&apos;s {preview.week.setsPerMuscle}-set goal.</p>}
            </div>
          </Section>
        </>
      ) : (
        <p className="card mt-6 p-5 text-muted">Everything is still recovering. Take a rest day, or shorten the session for some light work.</p>
      )}

      {!active && preview && preview.items.length > 0 && (
        <div className="safe-bottom fixed inset-x-0 bottom-16 z-30 bg-gradient-to-t from-bg via-bg/95 to-transparent px-5 pt-6">
          <div className="mx-auto max-w-lg">
            <Button className="w-full py-4 text-lg shadow-lg shadow-accent/20" onClick={() => { haptic("tap"); start(); go("workout"); }}>
              Start workout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Calendar (MVP+2): when the lifter allowed reading busy times and something starts before the planned
 * workout could finish, offer a length that fits. Only start and end times are read, on the phone.
 */
function FitAroundCalendar() {
  const { profile, setProfile, active } = useApp();
  const on = !!profile.calendar?.read && !active;
  const now = useNow(60_000);
  const bucket = Math.floor(now / 300_000); // look again every 5 minutes
  const [busy, setBusy] = useState<Busy[] | null>(null);
  useEffect(() => {
    if (!on) return;
    let live = true;
    void busyTimes(Date.now()).then((b) => live && setBusy(b));
    return () => {
      live = false;
    };
  }, [on, bucket]);
  if (!on || !busy) return null;
  const free = freeMinutes(busy, now);
  const fit = fitLength(free.minutes, profile.minutes);
  if (!fit || !free.until) return null;
  const at = new Date(free.until).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <button
      type="button"
      onClick={() => {
        haptic("tick");
        setProfile({ minutes: fit });
      }}
      className="press mt-3 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-left text-sm"
    >
      📅 Busy at {at} · <span className="font-semibold text-accent">Fit a {fit}-minute workout</span>
    </button>
  );
}
