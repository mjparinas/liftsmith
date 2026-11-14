"use client";

// Delightful extras on Today, Done and Progress: moments (anniversaries, comebacks, tonnage), seasonal
// challenges, newly earned themes, "same as last time", the general warm-up, Check in with a coach, the
// the strength score and the recap and photos entry. Kept here so the screens they sit on only
// gain one line each.
import { useMemo, useState } from "react";

import { useAccount } from "@/lib/auth";
import { canCheckIn, checkinText } from "@/lib/buddy";
import { lastWorkout, repeatPlan } from "@/lib/ghost";
import { date, list, t as tr } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { doneMoments, todayMoments, type Moment } from "@/lib/moments";
import { suggestedPeriod } from "@/lib/recap";
import { nextSeasonal, seasonalChallenges } from "@/lib/seasonal";
import { useApp } from "@/lib/store";
import { scoreBand, strength, twins } from "@/lib/strength";
import { isTeen } from "@/lib/teen";
import { newlyUnlocked, unlockContext } from "@/lib/themes";
import { sendMessage, trainerError, useCoachNotes } from "@/lib/trainer";
import { MUSCLE_LABEL, type Muscle } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";
import { useNow } from "@/lib/useNow";
import type { MessageKey } from "@/locales/en";

import { SECTION_LABEL } from "../titles";
import { openStats } from "./BodyStats";
import { Icon } from "./icons";
import { go } from "./router";
import { RoutinesSheet } from "./Routines";
import { Badge, Button, InlineSwitch, Section, Sheet } from "./ui";

/** Lean mode (Settings › Celebrations): no extra pop-ups. */
export function lean(p: { lean?: boolean }): boolean {
  return !!p.lean;
}

function MomentCard({ m, onClose }: { m: Moment; onClose?: () => void }) {
  return (
    <div className="card animate-rise flex items-start gap-3 p-4" role="status">
      <span className="text-3xl" aria-hidden>
        {m.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{m.title}</p>
        <p className="mt-0.5 text-sm text-muted">{m.detail}</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={tr("x.dismiss")}
          className="press -mr-1 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-faint"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// --- Today ------------------------------------------------------------------------------------

/** Anniversary, welcome back, new theme and seasonal challenge cards. */
export function TodayMoments() {
  const { stats, events, profile, setProfile, active } = useApp();
  const now = useNow(60_000);
  const seen = profile.delight?.seenMoments ?? [];
  const day = new Date(now).toDateString();
  const moments = todayMoments(stats, now).filter((m) => !seen.includes(`${m.id}:${day}`));
  const fresh = newlyUnlocked(profile.delight?.seenThemes ?? [], unlockContext(events, stats, profile, now));
  const seasonal = seasonalChallenges(events, now);
  const teaser = seasonal.length ? null : nextSeasonal(now);
  if (active) return null;
  const dismiss = (id: string) => setProfile({ delight: { ...profile.delight, seenMoments: [...seen.slice(-40), `${id}:${day}`] } });
  return (
    <div className="mt-4 space-y-3 empty:hidden">
      {moments.map((m) => (
        <MomentCard key={m.id} m={m} onClose={() => dismiss(m.id)} />
      ))}
      {fresh.length > 0 && (
        <button
          type="button"
          onClick={() => {
            haptic("tick");
            setProfile({
              delight: { ...profile.delight, seenThemes: [...(profile.delight?.seenThemes ?? []), ...fresh.map((t) => t.id)] },
            });
            go("settings", "themes");
          }}
          className="press card flex w-full items-center gap-3 p-4 text-left"
        >
          <span
            className="h-10 w-10 shrink-0 rounded-full border-4"
            style={{ background: fresh[0].palette.bg, borderColor: fresh[0].palette.accent }}
            aria-hidden
          />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{tr("x.newTheme", { name: fresh[0].name })}</span>
            <span className="block text-sm text-muted">{tr("x.tryTheme", { how: fresh[0].how })}</span>
          </span>
        </button>
      )}
      {seasonal.map((c) => (
        <div key={c.id} className="card p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden>
              {c.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {c.name}
                {c.done ? tr("x.done") : ""}
              </p>
              <p className="text-sm text-muted">{c.detail}</p>
            </div>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-raised"
            role="progressbar"
            aria-label={tr("x.progress", { name: c.name })}
            aria-valuemin={0}
            aria-valuemax={c.goal}
            aria-valuenow={c.progress}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-good"
              style={{ width: `${(c.progress / c.goal) * 100}%` }}
            />
          </div>
          <p className="num mt-1.5 text-xs text-faint">
            {c.measure === "kg"
              ? tr("x.ofKg", {
                  n: fmtNum(Math.round(fromKg(c.progress, profile.unit))),
                  goal: fmtNum(Math.round(fromKg(c.goal, profile.unit))),
                  unit: profile.unit,
                })
              : tr(`x.of.${c.measure}` as MessageKey, { n: c.progress, goal: c.goal })}
            {!c.done && c.daysLeft > 0 ? tr("x.daysLeft", { count: c.daysLeft }) : ""}
          </p>
        </div>
      ))}
      {teaser && teaser.start - now < 7 * 86400_000 && (
        <p className="px-1 text-sm text-faint">
          {teaser.def.emoji} {tr("x.starts", { name: teaser.def.name, day: date(teaser.start, { weekday: "long" }) })}
        </p>
      )}
    </div>
  );
}

/** "Same as last time" and the routines chip, above the plan. */
export function PlanExtras() {
  const { events, preview, profile, gyms, setPlan, replan, active, routineId } = useApp();
  const [routinesOpen, setRoutinesOpen] = useState(false);
  const routine = profile.routines?.find((r) => r.id === routineId);
  const now = useNow(60_000);
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const last = useMemo(() => lastWorkout(events), [events]);
  const [repeating, setRepeating] = useState(false);
  if (active || !preview || !gym) return null;
  const toggleRepeat = () => {
    haptic("tick");
    if (repeating) {
      setRepeating(false);
      replan();
      return;
    }
    const p = repeatPlan(preview, events, profile, gym, now);
    if (p) {
      setPlan(p);
      setRepeating(true);
    }
  };
  return (
    <div className="mt-3 flex flex-wrap gap-2 text-sm">
      {last && (
        <button
          type="button"
          aria-pressed={repeating}
          onClick={toggleRepeat}
          className={`press inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 ${repeating ? "border-accent bg-accent/15" : "border-line bg-surface text-muted"}`}
        >
          <Icon name={repeating ? "check" : "repeat"} size={15} />
          {repeating ? tr("x.sameOn") : tr("x.sameOff")}
        </button>
      )}
      <button
        type="button"
        aria-pressed={!!routine}
        onClick={() => {
          haptic("tick");
          setRoutinesOpen(true);
        }}
        className={`press inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full border px-3.5 ${routine ? "border-accent bg-accent/15" : "border-line bg-surface text-muted"}`}
      >
        <Icon name="layers" size={15} />
        <span className="truncate">{routine ? routine.name : tr("x.routines")}</span>
      </button>
      <RoutinesSheet open={routinesOpen} onClose={() => setRoutinesOpen(false)} />
    </div>
  );
}

/**
 * Check in, in the top row of Today's chips (Melvin, 2026-11-14): sends "I'm at the gym" to the lifter's coach as a
 * Liftsmith message. Only for adults who train with a coach (canCheckIn); nothing for anyone else.
 */
export function CheckInChip() {
  const { profile, preview, gyms } = useApp();
  const coaches = useCoachNotes((s) => s.who.coaches);
  const signedIn = useAccount((s) => !!s.account);
  const [open, setOpen] = useState(false);
  if (!canCheckIn({ signedIn, teen: isTeen(profile), coaches: coaches.length })) return null;
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const focus = preview ? ([...new Set(preview.items.map((i) => i.focus))] as Muscle[]) : [];
  return (
    <>
      <button
        type="button"
        onClick={() => {
          haptic("tick");
          setOpen(true);
        }}
        className="press inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-muted"
      >
        <Icon name="chat" size={15} className="text-accent" />
        {tr("x.checkIn")}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={tr("x.checkInTitle")}>
        <CoachCheckIn coaches={coaches} focus={focus} gymName={gym?.name ?? ""} onDone={() => setOpen(false)} />
      </Sheet>
    </>
  );
}

function CoachCheckIn({
  coaches,
  focus,
  gymName,
  onDone,
}: {
  coaches: readonly { id: string; name: string }[];
  focus: Muscle[];
  gymName: string;
  onDone: () => void;
}) {
  const { checkin } = useApp();
  const [picked, setPicked] = useState<string[]>(coaches.map((c) => c.id));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const focusLabels = focus.slice(0, 3).map((m) => MUSCLE_LABEL[m]);
  const preview = checkinText({ to: coaches.length === 1 ? coaches[0]?.name : "", gym: gymName, focus: focusLabels });
  const to = coaches.filter((c) => picked.includes(c.id));
  const send = async () => {
    if (!to.length || busy) return;
    setBusy(true);
    setNote(null);
    const sent: string[] = [];
    try {
      for (const c of to) {
        await sendMessage(c.id, checkinText({ to: c.name, gym: gymName, focus: focusLabels }));
        sent.push(c.name || tr("trn.noName"));
      }
      checkin(sent);
      haptic("success");
      onDone();
    } catch (e) {
      oops();
      setNote(sent.length ? `${tr("x.checkInSent", { names: list(sent) })} ${trainerError(e)}` : trainerError(e));
      if (sent.length) checkin(sent);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <p className="text-sm text-muted">{tr("x.checkInIntro")}</p>
      {coaches.length > 1 && (
        <>
          <p className={`mb-2 mt-4 px-1 ${SECTION_LABEL}`}>{tr("x.checkInTo")}</p>
          <ul className="flex flex-wrap gap-2">
            {coaches.map((c) => {
              const on = picked.includes(c.id);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      haptic("select");
                      setPicked(on ? picked.filter((x) => x !== c.id) : [...picked, c.id]);
                    }}
                    className={`press inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm ${on ? "border-accent bg-accent/15" : "border-line bg-surface text-muted"}`}
                  >
                    {on && <Icon name="check" size={15} />}
                    {c.name || tr("trn.noName")}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <p className="mt-4 whitespace-pre-line rounded-2xl bg-raised p-3 text-sm">{preview}</p>
      {note && (
        <p className="mt-2 text-sm text-bad" role="status">
          {note}
        </p>
      )}
      <Button className="mt-4 w-full" onClick={() => void send()} disabled={!to.length || busy}>
        {tr("x.send")}
      </Button>
    </div>
  );
}

// --- Done -------------------------------------------------------------------------------------

/** Count, tonnage, comeback and anniversary moments after a workout. */
export function DoneMoments() {
  const { stats } = useApp();
  const ms = doneMoments(stats);
  if (!ms.length) return null;
  return (
    <div className="mt-4 space-y-3 text-left">
      {ms.map((m) => (
        <MomentCard key={m.id} m={m} />
      ))}
    </div>
  );
}

// --- Progress ---------------------------------------------------------------------------------

/** The month or year recap and the private body photos, side by side (Progress). */
export function RecapAndPhotos() {
  const now = useNow(3600_000);
  const p = suggestedPeriod(now);
  return (
    <div className="desk-span mt-3 grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => go("recap", p.kind === "year" ? `y${new Date(p.start).getFullYear()}` : `m${p.start}`)}
        className="press card p-4 text-left"
      >
        <Badge icon={p.kind === "year" ? "trophy" : "calendar"} tint="var(--color-violet)" />
        <span className="mt-2 block font-semibold">{p.kind === "year" ? tr("x.year") : tr("x.month")}</span>
        <span className="block text-xs text-muted">{tr("x.highlights")}</span>
      </button>
      <button type="button" onClick={() => go("photos")} className="press card p-4 text-left">
        <Badge icon="camera" tint="var(--color-cyan)" />
        <span className="mt-2 block font-semibold">{tr("x.photos")}</span>
        <span className="block text-xs text-muted">{tr("x.private")}</span>
      </button>
    </div>
  );
}

/** Strength score by muscle, adjustable for age, plus strength twins on the big lifts. */
export function StrengthCard() {
  const { events, profile, setProfile } = useApp();
  const now = useNow(3600_000);
  const p = profile;
  const adjustAge = profile.delight?.ageAdjust !== false;
  const r = useMemo(() => strength(events, p, now, { adjustAge }), [events, p, now, adjustAge]);
  if (r.overall === null) return null;
  const ms = (Object.entries(r.muscles) as [Muscle, number][]).sort((a, b) => b[1] - a[1]);
  const tw = twins(r);
  return (
    <Section title={tr("x.score")}>
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-4 border-accent">
            <span className="num text-3xl font-bold">{r.overall}</span>
          </div>
          <div>
            <p className="font-semibold">{scoreBand(r.overall)}</p>
            <p className="text-sm text-muted">{tr(r.adjusted.age ? "x.scoreBodyAge" : "x.scoreBody")}</p>
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {ms.slice(0, 8).map(([m, v]) => (
            <li key={m} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 text-muted">{MUSCLE_LABEL[m]}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-raised">
                <span className="block h-full rounded-full bg-accent" style={{ width: `${v}%` }} />
              </span>
              <span className="num w-8 text-right">{v}</span>
            </li>
          ))}
        </ul>
        {p.birthYear ? (
          <InlineSwitch
            className="mt-3 text-sm"
            label={tr("x.adjustAge")}
            on={adjustAge}
            onChange={(v) => setProfile({ delight: { ...profile.delight, ageAdjust: v } })}
          />
        ) : (
          <button type="button" onClick={openStats} className="press mt-3 min-h-11 text-left text-sm font-semibold text-accent">
            {tr("x.addBirth")} ›
          </button>
        )}
      </div>
      {tw.length > 0 && (
        <div className="card mt-3 p-4">
          <p className="font-semibold">{tr("x.twins")}</p>
          <p className="text-sm text-muted">
            {tr(p.birthYear && p.sex ? "x.twinsAgeSex" : p.birthYear ? "x.twinsAge" : p.sex ? "x.twinsSex" : "x.twinsBody")}
          </p>
          <ul className="mt-3 divide-y divide-line">
            {tw.map((l) => (
              <li key={l.exerciseId} className="flex items-center justify-between py-2.5">
                <span>
                  <span className="block font-medium">{l.name}</span>
                  <span className="num text-xs text-muted">
                    {tr("x.estMax", { kg: `${fmtNum(Math.round(fromKg(l.e1rm, profile.unit)))} ${profile.unit}` })}
                  </span>
                </span>
                <span className="num text-right text-sm">
                  {tr("x.stronger")}
                  <br />
                  <span className="text-lg font-bold text-accent">{l.percentile}%</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-faint">{tr("x.twinsNote")}</p>
        </div>
      )}
    </Section>
  );
}
