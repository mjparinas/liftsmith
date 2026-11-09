"use client";
import { Info } from "@/components/Info";
import { itemSeconds } from "@/lib/generator";
import { useNow } from "@/lib/useNow";
import { BodyMap } from "@/components/BodyMap";
import { exercise } from "@/lib/exercises";
import { haptic, sound } from "@/lib/juice";
import { quoteOfDay } from "@/lib/quotes";
import { CALL_TEXT, type Call } from "@/lib/readiness";
import { recovery } from "@/lib/recovery";
import { useApp } from "@/lib/store";
import { MUSCLE_LABEL, type Muscle } from "@/lib/types";
import { activeInjuries, PART_LABEL } from "@/lib/injury";
import { busyTimes, fitLength, freeMinutes, type Busy } from "@/lib/calendar";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { loadText, repsText } from "./format";
import { programName } from "./Programs";
import { go } from "./router";
import { Icon } from "./icons";
import { CALL_STYLE, muscleHue } from "./theme";
import { Button, EmptyState, LinkToggle, Ring, Section } from "./ui";
import { linkedToNext, supersetLabel } from "@/lib/superset";
import { PlanExtras, TodayMoments } from "./Extras";
import { useGame } from "./Achievements";
import { TodayGame } from "./TodayGame";

export function Flame({ weeks, freezes = 0 }: { weeks: number; freezes?: number }) {
  const lit = weeks > 0;
  return (
    <span
      className={`num inline-flex h-9 items-center gap-1 rounded-full border px-2.5 text-sm font-bold ${lit ? "border-ember/40 bg-ember/12 text-ember" : "border-line bg-surface text-faint"}`}
      title={`${weeks}-week streak${freezes ? `, ${freezes} freeze${freezes > 1 ? "s" : ""}` : ""}`}
    >
      <Icon name="flame" size={16} filled={lit} strokeWidth={1.6} className={lit ? "drop-shadow-[0_0_6px_rgb(255_138_61/0.7)]" : ""} />
      {weeks}
      {freezes > 0 && <span aria-label={`${freezes} streak freeze${freezes > 1 ? "s" : ""}`}>{" 🧊"}{freezes > 1 ? freezes : ""}</span>}
    </span>
  );
}

/** The greeting, by local time of day, with the lifter's first name when they've given one. */
export function greeting(hour: number, name: string): string {
  const part = hour < 5 ? "Good evening" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const first = name.trim().split(/\s+/)[0];
  return first ? `${part}, ${first}` : part;
}

export function Today() {
  const { profile, gyms, preview, events, setProfile, start, active, readiness, callOverride, setCall, pickedByLocation, toggleSuperset } = useApp();
  const [lenKey, setLenKey] = useState(0);
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const now = useNow();
  const rec = useMemo(() => recovery(events, now), [events, now]);
  const g = useGame();
  const streak = g.streak;
  const lvl = g.level;
  const focus = [...new Set(preview?.items.map((i) => i.focus) ?? [])] as Muscle[];
  const hurt = useMemo(() => activeInjuries(events), [events]);
  const hello = greeting(new Date(now).getHours(), profile.name);
  const call = preview ? CALL_STYLE[preview.call] : null;
  const fill = `${((profile.minutes - 15) / 75) * 100}%`;
  const fixed = !!preview?.program?.fixed;

  return (
    <div className="pb-44">
      <header className="pt-3">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-medium text-muted">{hello}</p>
          <div className="flex shrink-0 items-center gap-2">
          <Flame weeks={streak.weeks} freezes={streak.freezes} />
          <button
            type="button"
            onClick={() => go("achievements")}
            className="press num inline-flex h-9 items-center rounded-full border border-violet/40 bg-violet/12 px-2.5 text-sm font-bold text-violet"
            title={`${lvl.title}: ${lvl.into} of ${lvl.span} XP to ${lvl.next ?? "max"}`}
          >
            Lv {lvl.level}
          </button>
          <button type="button" aria-label="Settings" onClick={() => go("settings")} className="press grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted hover:text-ink">
            <Icon name="settings" size={18} />
          </button>
          </div>
        </div>
        <h1 className="mt-1 text-[30px] font-extrabold leading-tight tracking-tight">Today&apos;s workout</h1>
      </header>

      {active && (
        <button type="button" onClick={() => go("workout")} className="press btn-primary animate-glow mt-4 flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left font-semibold">
          <span className="flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-accent-ink" />Workout in progress</span>
          <span className="flex items-center gap-1">Resume <Icon name="chevronRight" size={18} strokeWidth={2.6} /></span>
        </button>
      )}

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <button type="button" onClick={() => go("gym")} className="press inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5">
          <Icon name="pin" size={15} className="text-accent" />
          {gym?.name ?? "Add a gym"}{gym && pickedByLocation === gym.id ? " · you're here" : ""}
        </button>
        {preview?.program && (
          <button type="button" onClick={() => go("programs")} className="press inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5">
            <Icon name="layers" size={15} className="text-accent" />
            {programName(preview.program.id)} · {preview.program.dayName}
          </button>
        )}
        {preview && fixed && <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-muted">{preview.program!.note}</span>}
        {preview && !fixed && (
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${preview.week.deload ? "border-warn/40 bg-warn/12 text-warn" : "border-line bg-surface text-muted"}`}>
            <Icon name="layers" size={15} className={preview.week.deload ? "" : "text-violet"} />
            {preview.week.label} · RIR {preview.week.rir}
            <Info term={preview.week.deload ? "deload" : "rir"} className="-mr-3" />
          </span>
        )}
        {streak.needed > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-muted">
            <Icon name="target" size={15} className="text-ember" />
            {streak.needed} more this week for your goal
          </span>
        )}
        <button type="button" onClick={() => go("injuries")} className={`press rounded-full border px-3 py-1.5 ${hurt.length ? "border-warn/40 bg-warn/15 text-warn" : "border-line bg-surface text-muted"}`}>
          {hurt.length ? `Training around: ${hurt.map((i) => PART_LABEL[i.part].toLowerCase()).join(", ")}` : "Something hurts?"}
        </button>
      </div>

      {profile.quotes !== false && <DailyQuote now={now} />}

      <TodayMoments />

      {readiness && preview && call && !active && !fixed && (
        <section className="card-tint mt-4 p-4" style={{ "--tint": call.hue } as CSSProperties} aria-labelledby="call-title">
          <div className="flex items-center gap-4">
            <Ring value={readiness.score / 100} size={64} stroke={6} from={call.hue} to={call.hue} track="color-mix(in srgb, var(--color-ink) 8%, transparent)">
              <span className="display text-xl" aria-label={`Readiness ${readiness.score}`}>{readiness.score}</span>
            </Ring>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: call.hue }}>
                <Icon name={call.icon} size={14} strokeWidth={2.4} />
                <span>Readiness</span>
                <Info term="readiness" />
              </div>
              <h2 id="call-title" className="mt-0.5 text-xl font-bold">{CALL_TEXT[preview.call].label}<Info term="call" /></h2>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted">{preview.challenge ? "Challenge day: your first lift ends with an as-many-reps-as-you-can set." : CALL_TEXT[preview.call].blurb}</p>
          {readiness.signals.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm">
              {readiness.signals.slice(0, 3).map((g) => (
                <li key={g.text} className={`flex items-center gap-2 ${g.points > 0 ? "text-mint" : g.points < 0 ? "text-warn" : "text-muted"}`}>
                  <span aria-hidden className="grid h-4 w-4 place-items-center text-[10px]">{g.points > 0 ? "▲" : g.points < 0 ? "▼" : "•"}</span>
                  <span className="text-ink/90">{g.text}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl border border-line bg-bg/60 p-1" role="group" aria-label="Today's call">
            {(["recover", "normal", "push"] as Call[]).map((c) => {
              const on = preview.call === c;
              const hue = CALL_STYLE[c].hue;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    haptic("select");
                    sound.tick();
                    setCall(c === readiness.call ? null : c);
                  }}
                  className={`press inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold ${on ? "text-ink" : "text-muted"}`}
                  style={on ? { background: `color-mix(in srgb, ${hue} 22%, var(--color-surface))`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${hue} 55%, transparent)` } : undefined}
                >
                  <Icon name={CALL_STYLE[c].icon} size={15} strokeWidth={2.4} className={on ? "" : "opacity-70"} />
                  {c === "recover" ? "Go easy" : c === "normal" ? "As planned" : "Push"}
                </button>
              );
            })}
          </div>
          {callOverride && <p className="mt-2 text-xs text-faint">Your call today. We suggested {CALL_TEXT[readiness.call].label.toLowerCase()}.</p>}
        </section>
      )}

      {!active && <TodayGame />}

      {!fixed && <div className="card mt-4 p-4">
        <div className="flex items-baseline justify-between">
          <label htmlFor="len" className="flex items-center gap-1.5 text-sm font-medium text-muted"><Icon name="clock" size={16} className="text-cyan" />Workout length</label>
          <span className="display text-[30px]"><span key={lenKey} className={`inline-block ${lenKey ? "animate-nudge" : ""}`}>{profile.minutes}</span><span className="ml-1 text-base font-semibold tracking-normal text-muted">min</span></span>
        </div>
        <input
          id="len"
          type="range"
          min={15}
          max={90}
          step={5}
          value={profile.minutes}
          onChange={(e) => {
            haptic("select");
            sound.tick();
            setLenKey((k) => k + 1);
            setProfile({ minutes: Number(e.target.value) });
          }}
          className="slider mt-4 w-full"
          style={{ "--fill": fill } as CSSProperties}
        />
        <div className="mt-1.5 flex justify-between text-xs text-faint num"><span>15</span><span>45</span><span>90</span></div>
        <FitAroundCalendar />
      </div>}
      {!fixed && <PlanExtras />}

      {preview && preview.items.length > 0 ? (
        <>
          <Section title={`${preview.items.length} exercises · about ${preview.estMinutes} min`} icon="dumbbell">
            <ol className="stagger card divide-y divide-line/70 overflow-hidden">
              {preview.items.map((it, i) => {
                const ex = exercise(it.exerciseId);
                const hue = muscleHue(it.focus);
                const ss = supersetLabel(preview.items, i);
                return (
                  <li key={it.exerciseId} className={`animate-rise relative flex items-center gap-3 px-4 py-3.5 ${ss ? "bg-accent/5" : ""}`} style={{ animationDelay: `${i * 40}ms` }}>
                    <span className="absolute inset-y-3 left-0 w-[3px] rounded-r-full" style={{ background: hue }} aria-hidden />
                    <span className="num grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold" style={{ background: `color-mix(in srgb, ${hue} 16%, transparent)`, color: hue }}>{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{ex.name}</div>
                      {ss && <div className="truncate text-xs font-semibold uppercase tracking-[0.08em] text-accent">{ss}</div>}
                      <div className="text-sm text-muted num">
                        {it.label ? `${it.label} · ` : ""}{it.scheme ?? `${it.sets} × ${repsText(ex, it.target.reps)}`} · {(it.setTargets ?? []).some((t) => t.weight > it.target.weight) ? "up to " : ""}{loadText(ex, Math.max(it.target.weight, ...(it.setTargets ?? []).map((t) => t.weight)), profile.unit)}
                        {" · "}{it.warmup ? `${it.warmup.length} warm-up${it.warmup.length > 1 ? "s" : ""} · ` : ""}{Math.max(1, Math.round(itemSeconds(it) / 60))} min
                      </div>
                    </div>
                    {it.injuryPct ? <span className="shrink-0 rounded-full bg-warn/15 px-2.5 py-0.5 text-xs font-medium text-warn">Injury {it.injuryPct}%</span> : <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${preview.items.length > 1 ? "hidden min-[390px]:inline" : ""}`} style={{ borderColor: `color-mix(in srgb, ${hue} 35%, transparent)`, color: hue }}>{MUSCLE_LABEL[it.focus]}</span>}
                    {i > 0 && <LinkToggle on={linkedToNext(preview.items, i - 1)} first={exercise(preview.items[i - 1].exerciseId).name} second={ex.name} onToggle={() => toggleSuperset(i - 1)} />}
                  </li>
                );
              })}
            </ol>
            {preview.items.length > 1 && (
              <p className="mt-2 flex items-center gap-1.5 px-1 text-sm text-muted"><Icon name="link" size={14} />Link two exercises to do them as a superset<Info term="superset" /></p>
            )}
          </Section>
          <Section title="Why these muscles" icon="recovery">
            <div className="card p-4">
              <BodyMap rec={rec} focus={focus} compact />
              {preview.program && !preview.routineId ? (
                <p className="mt-3 text-sm text-muted">{preview.program.dayName} of {programName(preview.program.id)}{fixed ? "" : `: recovered muscles from today's group, furthest from this week's ${preview.week.setsPerMuscle}-set goal`}. {preview.program.note}.</p>
              ) : (
                <p className="mt-3 text-sm text-muted">{preview.routineId ? <>Your routine works {focus.slice(0, 4).map((m) => MUSCLE_LABEL[m].toLowerCase()).join(", ")}. The map shows how recovered each muscle is.</> : <>Today targets {focus.slice(0, 4).map((m) => MUSCLE_LABEL[m].toLowerCase()).join(", ")}: recovered, and furthest from this week&apos;s {preview.week.setsPerMuscle}-set goal.</>}</p>
              )}
            </div>
          </Section>
        </>
      ) : (
        <div className="card mt-6">
          <EmptyState icon="moon" mascot="sleepy" tint="var(--color-cyan)" title="Rest day" body="Everything is still recovering. Take the day, or shorten the session for some light work." />
        </div>
      )}

      {!active && preview && preview.items.length > 0 && (
        <div className="safe-bottom pointer-events-none fixed inset-x-0 bottom-16 z-30 bg-gradient-to-t from-bg via-bg/90 to-transparent px-5 pt-8">
          <div className="pointer-events-auto mx-auto max-w-lg">
            <Button
              icon="play"
              className="w-full py-4 text-lg"
              onClick={() => {
                haptic("tap");
                sound.start();
                start();
                go("workout");
              }}
            >
              Start workout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** One quote a day from quotes.ts, with its author. Turned off in Settings › Daily quote. */
function DailyQuote({ now }: { now: number }) {
  const q = quoteOfDay(now);
  return (
    <figure className="card-tint relative mt-4 overflow-hidden p-4 pl-12" style={{ "--tint": "var(--color-violet)" } as CSSProperties} aria-label="Quote of the day">
      <span className="absolute left-4 top-4 text-violet" aria-hidden><Icon name="quote" size={20} strokeWidth={2.4} /></span>
      <blockquote className="text-[15px] font-medium leading-snug text-ink">{q.text}</blockquote>
      <figcaption className="mt-2 text-xs text-muted">
        <span className="font-semibold text-ink/80">{q.by}</span>
        {q.source && <span>, {q.source}</span>}
      </figcaption>
    </figure>
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
      className="press mt-3 flex w-full items-center gap-2 rounded-xl border border-cyan/30 bg-cyan/8 px-3 py-2.5 text-left text-sm"
    >
      <Icon name="calendar" size={16} className="text-cyan" />
      <span>Busy at {at} · <span className="font-semibold text-cyan">Fit a {fit}-minute workout</span></span>
    </button>
  );
}
