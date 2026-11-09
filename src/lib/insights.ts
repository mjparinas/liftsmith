import { blockWeek, weekStart } from "./block";
import { EXERCISE_BY_ID } from "./exercises";
import { weeklySets } from "./generator";
import { epley, sessionsOf, TIMED } from "./progression";
import type { Streak } from "./game";
import { can } from "./entitlements";
import { activeFixes, findPlateaus, fixResult, FIX_TEXT, type FixKind, type Plateau } from "./plateau";
import { MUSCLE_LABEL, type AppEvent, type BodyweightEvent, type Muscle, type Profile, type SetEvent } from "./types";
import { fmtNum, fromKg } from "./units";

// Coach's notes (Melvin, 2026-11-09): proactive, action-oriented insights instead of charts to
// interpret. Each one says what we noticed, the numbers behind it, and one thing to do, ideally a
// single tap (start a deload, make a muscle a priority, fit a short workout). Only shown when there
// is something worth acting on. Derived from events every time, never stored. All the words live
// here, in one place, for translation later.

const DAY = 86_400_000;
const WEEK = 7 * DAY;
/** A lift counts as stalled after this long without a new best while still being trained. */
export const STALL_WEEKS = 3;
const BIG: Muscle[] = ["chest", "lats", "upperBack", "quads", "hamstrings", "glutes"];

export type InsightAction =
  /** Make this week the deload week (store.startDeload). */
  | { kind: "deload"; label: string }
  /** Add the muscle to the lifter's priorities (Settings › Workout preferences). */
  | { kind: "priority"; muscle: Muscle; label: string }
  /** Set today's workout length. */
  | { kind: "minutes"; minutes: number; label: string }
  /** Start the plateau detective's three-week fix for a lift (store.fixPlateau). */
  | { kind: "plateau"; plateau: Plateau; fix: FixKind; label: string }
  /** Open a screen. */
  | { kind: "go"; route: string; label: string };

export interface Insight {
  /** Stable for the same finding, so a dismissal sticks until something changes. */
  id: string;
  tone: "warn" | "info" | "good";
  title: string;
  /** What we saw, with the numbers. */
  why: string;
  /** What to do about it. */
  advice: string;
  action?: InsightAction;
}

export interface InsightInput {
  events: readonly AppEvent[];
  profile: Profile;
  now: number;
  /** The days-per-week streak (game.ts goalStreak), for the "streak at risk" note. */
  streak?: Pick<Streak, "needed" | "atRisk" | "weeks">;
}

const name = (id: string) => EXERCISE_BY_ID.get(id)?.name ?? id;
const weeksText = (n: number) => `${n} week${n === 1 ? "" : "s"}`;

/** Best estimated one-rep max per session for a loaded lift, oldest first. */
function e1Series(events: readonly AppEvent[], exerciseId: string): { at: number; e1: number }[] {
  return sessionsOf(events, exerciseId)
    .map((sets) => ({ at: sets[0].at, e1: Math.max(0, ...sets.filter((s) => !s.challenge && s.weight > 0).map((s) => epley(s.weight, s.reps))) }))
    .filter((s) => s.e1 > 0)
    .reverse();
}

export interface Stall {
  exerciseId: string;
  weeks: number;
  sessions: number;
  best: number;
}

/** Lifts trained 3+ times in the last few weeks with no new best estimated one-rep max in that time. */
export function stalls(events: readonly AppEvent[], now: number): Stall[] {
  const ids = new Set(events.filter((e): e is SetEvent => e.type === "set").map((e) => e.exerciseId));
  const out: Stall[] = [];
  for (const id of ids) {
    const ex = EXERCISE_BY_ID.get(id);
    if (!ex || ex.load === "bodyweight" || TIMED.has(id)) continue;
    const s = e1Series(events, id);
    if (s.length < 4) continue;
    const last = s.at(-1)!;
    if (now - last.at > 2 * WEEK) continue; // not training it any more
    // Find when the best was set; a stall is 3+ weeks and 3+ sessions since then.
    let bestI = 0;
    for (let i = 1; i < s.length; i++) if (s[i].e1 > s[bestI].e1 * 1.005) bestI = i;
    const since = s.length - 1 - bestI;
    const weeks = Math.floor((now - s[bestI].at) / WEEK);
    if (since >= 3 && weeks >= STALL_WEEKS) out.push({ exerciseId: id, weeks, sessions: since, best: s[bestI].e1 });
  }
  return out.sort((a, b) => b.weeks - a.weeks);
}

/** The lift that has gone up the most in the last six weeks (5% or more). */
function bestGain(events: readonly AppEvent[], now: number): { exerciseId: string; pct: number; weeks: number } | null {
  const ids = new Set(events.filter((e): e is SetEvent => e.type === "set" && now - e.at < 6 * WEEK).map((e) => e.exerciseId));
  let top: { exerciseId: string; pct: number; weeks: number } | null = null;
  for (const id of ids) {
    const ex = EXERCISE_BY_ID.get(id);
    if (!ex || ex.load === "bodyweight" || TIMED.has(id)) continue;
    const s = e1Series(events, id).filter((x) => now - x.at < 6 * WEEK);
    if (s.length < 3) continue;
    const pct = (Math.max(...s.slice(-2).map((x) => x.e1)) / s[0].e1 - 1) * 100;
    const weeks = Math.max(1, Math.round((s.at(-1)!.at - s[0].at) / WEEK));
    if (pct >= 5 && (!top || pct > top.pct)) top = { exerciseId: id, pct, weeks };
  }
  return top;
}

/** Weigh-ins in the window, oldest first. */
function weighIns(events: readonly AppEvent[], now: number, days: number): BodyweightEvent[] {
  return events.filter((e): e is BodyweightEvent => e.type === "bodyweight" && now - e.at <= days * DAY && e.at <= now).sort((a, b) => a.at - b.at);
}

/** Change per week by least squares, so one odd weigh-in doesn't swing it. */
function slopePerWeek(points: { at: number; v: number }[]): number {
  const n = points.length;
  const mx = points.reduce((s, p) => s + p.at, 0) / n;
  const my = points.reduce((s, p) => s + p.v, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.at - mx) * (p.v - my);
    den += (p.at - mx) ** 2;
  }
  return den ? (num / den) * WEEK : 0;
}

export function insights({ events, profile, now, streak }: InsightInput): Insight[] {
  const out: Insight[] = [];
  const week = blockWeek(profile, now);
  const unit = profile.unit;
  const w = (kg: number) => `${fmtNum(Math.round(fromKg(kg, unit) * 10) / 10)} ${unit}`;
  const sessions = new Map<string, SetEvent[]>();
  for (const e of events) if (e.type === "set") sessions.set(e.sessionId, [...(sessions.get(e.sessionId) ?? []), e]);
  const recent = [...sessions.values()].map((sets) => ({ at: sets.at(-1)!.at, sets })).sort((a, b) => b.at - a.at);
  const canDeload = !week.deload && week.week >= 1;

  // 1. Missed reps three workouts running: fatigue is piling up.
  const lastThree = recent.slice(0, 3);
  if (lastThree.length === 3 && now - lastThree[2].at < 3 * WEEK) {
    const rates = lastThree.map((s) => {
      const real = s.sets.filter((x) => !x.challenge);
      return real.length ? real.filter((x) => x.reps >= x.targetReps).length / real.length : 1;
    });
    if (rates.every((r) => r < 0.7)) {
      const pct = Math.round((rates.reduce((a, b) => a + b, 0) / 3) * 100);
      out.push({
        id: `missed-${recent[0].at}`,
        tone: "warn",
        title: "Fatigue is building up",
        why: `You hit only ${pct}% of your target reps over your last 3 workouts.`,
        advice: canDeload ? "A deload now (lighter, half the sets) usually brings the reps back within a week." : "Today's plan is already lighter. Sleep and food matter most this week.",
        action: canDeload ? { kind: "deload", label: "Start a deload week" } : undefined,
      });
    }
  }

  // 2. Stalled lifts. Several at once is a fatigue problem (deload); one on its own goes to the
  // plateau detective (plateau.ts, Pro), which finds the likely cause and offers a three-week fix.
  const fixes = profile.plateauFixes ?? [];
  const fixing = new Set(activeFixes(fixes, now).map((f) => f.exerciseId));
  const stalled = stalls(events, now).filter((s) => !fixing.has(s.exerciseId));
  const fatigue = out.find((x) => x.id.startsWith("missed-"));
  if (stalled.length >= 2 && fatigue) {
    // Same cause, same fix: one note, not two deload buttons.
    const names = stalled.slice(0, 3).map((s) => name(s.exerciseId).toLowerCase());
    fatigue.why += ` ${names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)} have` : `${names[0]} has`} had no new best in ${weeksText(stalled[0].weeks)} or more, too.`;
  } else if (stalled.length >= 2) {
    const names = stalled.slice(0, 3).map((s) => name(s.exerciseId).toLowerCase());
    out.push({
      id: `stall-many-${stalled.map((s) => s.exerciseId).join(",")}`,
      tone: "warn",
      title: `${stalled.length} lifts have stalled`,
      why: `No new best on ${names.slice(0, -1).join(", ")} and ${names.at(-1)} in ${weeksText(stalled[0].weeks)} or more.`,
      advice: canDeload ? "When several lifts stall at once it's usually fatigue, not strength. Deload for a week, then build again." : "This week's deload should clear it. Next block, they start a little lighter and build again.",
      action: canDeload ? { kind: "deload", label: "Start a deload week" } : undefined,
    });
  } else if (can("plateauDetective")) {
    for (const p of findPlateaus(events, profile, now, fixes).slice(0, 2)) {
      const fix = FIX_TEXT[p.fix];
      out.push({
        id: `plateau-${p.exerciseId}-${p.weeks}-${p.fix}`,
        tone: "warn",
        title: `${name(p.exerciseId)} has stalled`,
        why: `No new best in ${weeksText(p.weeks)} (best estimated one-rep max ${w(p.best)}). ${p.causes[0].text}`,
        advice: `Three-week fix: ${fix.what}`,
        action: { kind: "plateau", plateau: p, fix: p.fix, label: `Start: ${fix.title.toLowerCase()}` },
      });
    }
  } else if (stalled.length === 1) {
    const s = stalled[0];
    out.push({
      id: `stall-${s.exerciseId}-${s.sessions}`,
      tone: "warn",
      title: `${name(s.exerciseId)} has stalled`,
      why: `No new best in ${weeksText(s.weeks)} over ${s.sessions} sessions. Your best estimated one-rep max is ${w(s.best)}.`,
      advice: "Next time it drops one step and builds back up. Swapping it for a close variation for a few weeks also works: tap Swap during the workout.",
      action: { kind: "go", route: "stats", label: "See your lifts" },
    });
  }

  // Plateau fixes: running ones say they're in the plan, finished ones say whether they worked.
  for (const f of activeFixes(fixes, now)) {
    out.push({
      id: `fix-live-${f.exerciseId}-${f.startedAt}`,
      tone: "info",
      title: `${name(f.exerciseId)}: ${FIX_TEXT[f.kind].title.toLowerCase()}`,
      why: `A plateau fix is running until ${new Date(f.until).toLocaleDateString("en", { day: "numeric", month: "short" })}.`,
      advice: "Your plan already includes it. Train as planned.",
    });
  }
  for (const f of fixes.filter((x) => x.until <= now && now - x.until < 21 * DAY)) {
    const r = fixResult(f, events);
    out.push({
      id: `fix-done-${f.exerciseId}-${f.startedAt}`,
      tone: r?.worked ? "good" : "info",
      title: `${name(f.exerciseId)}: fix finished`,
      why: !r ? "No sessions during the fix, so there's nothing to compare yet." : r.worked ? `It worked: your estimated one-rep max is up ${Math.round(r.gain * 1000) / 10}%.` : "No new best yet.",
      advice: r?.worked ? "Back to the normal plan. Keep building from here." : "If it's still stuck in a week or two, you'll get a different fix here.",
    });
  }

  // 3. A big muscle well short of its weekly sets for the last two full weeks.
  if (recent.length >= 4) {
    const thisWeek = weekStart(profile, now);
    const priorities = new Set(profile.training?.priorities ?? []);
    const firstSet = Math.min(...recent.map((s) => s.sets[0].at));
    if (firstSet <= thisWeek - 2 * WEEK) {
      const a = weeklySets(events.filter((e) => e.at < thisWeek), thisWeek - WEEK);
      const b = weeklySets(events.filter((e) => e.at < thisWeek - WEEK), thisWeek - 2 * WEEK);
      const lagging = BIG.filter((m) => !priorities.has(m))
        .map((m) => ({ m, avg: (a[m] + b[m]) / 2 }))
        .filter((x) => x.avg < week.setsPerMuscle * 0.5)
        .sort((x, y) => x.avg - y.avg);
      if (lagging.length && lagging.length < BIG.length) {
        const { m, avg } = lagging[0];
        out.push({
          id: `volume-${m}-${thisWeek}`,
          tone: "info",
          title: `${MUSCLE_LABEL[m]} is getting too little work`,
          why: `About ${Math.round(avg)} sets a week for the last 2 weeks, against a goal of ${week.setsPerMuscle}.`,
          advice: `Make it a priority and plans put ${MUSCLE_LABEL[m].toLowerCase()} first with a third more sets.`,
          action: { kind: "priority", muscle: m, label: `Prioritise ${MUSCLE_LABEL[m].toLowerCase()}` },
        });
      }
    }
  }

  // 4. Body composition: body fat rising, or weight dropping fast.
  const ins = weighIns(events, now, 56);
  const fat = ins.filter((e) => e.bodyFat !== undefined).map((e) => ({ at: e.at, v: e.bodyFat! }));
  if (fat.length >= 3 && fat.at(-1)!.at - fat[0].at >= 3 * WEEK) {
    const perWeek = slopePerWeek(fat);
    const span = Math.max(1, Math.round((fat.at(-1)!.at - fat[0].at) / WEEK));
    const change = perWeek * span;
    if (change >= 1) {
      out.push({
        id: `fat-up-${fat.at(-1)!.at}`,
        tone: "warn",
        title: "Body fat is creeping up",
        why: `Up about ${fmtNum(Math.round(change * 10) / 10)} points in ${weeksText(span)} (now ${fmtNum(Math.round(fat.at(-1)!.v * 10) / 10)}%).`,
        advice:
          profile.goal === "muscle"
            ? "Gaining a little fat while building muscle is normal, but this is fast. About 200 to 300 fewer calories a day keeps more of the gain as muscle."
            : "Your training is on track, so look at food first: about 300 fewer calories a day, keeping protein high, usually turns it around within a month.",
      });
    } else if (change <= -1 && !stalled.length) {
      out.push({
        id: `fat-down-${fat.at(-1)!.at}`,
        tone: "good",
        title: "Losing fat, keeping strength",
        why: `Body fat is down about ${fmtNum(Math.round(-change * 10) / 10)} points in ${weeksText(span)} and none of your lifts have stalled.`,
        advice: "Keep doing exactly this. Heavy sets tell your body to hold on to muscle while you lose fat.",
      });
    }
  }
  if (ins.length >= 3 && ins.at(-1)!.at - ins[0].at >= 3 * WEEK) {
    const perWeek = slopePerWeek(ins.map((e) => ({ at: e.at, v: e.kg })));
    const pct = (perWeek / ins.at(-1)!.kg) * 100;
    if (pct <= -1) {
      out.push({
        id: `weight-down-${ins.at(-1)!.at}`,
        tone: "warn",
        title: "Weight is dropping fast",
        why: `Down about ${w(-perWeek)} a week, ${fmtNum(Math.round(-pct * 10) / 10)}% of your body weight.`,
        advice: stalled.length ? "That's likely why lifts have stalled. Aim for under 1% a week: a little more food on training days helps you keep your strength." : "Faster than 1% a week tends to cost muscle. A little more food on training days helps you keep your strength.",
      });
    } else if (pct >= 0.5 && profile.goal !== "muscle") {
      out.push({
        id: `weight-up-${ins.at(-1)!.at}`,
        tone: "info",
        title: "Weight is going up",
        why: `Up about ${w(perWeek)} a week over ${weeksText(Math.round((ins.at(-1)!.at - ins[0].at) / WEEK))}.`,
        advice: "If that's not what you want, about 250 fewer calories a day evens it out. Log body fat too and we'll tell muscle from fat.",
        action: { kind: "go", route: "stats", label: "See your weigh-ins" },
      });
    }
  }

  // 5. The weekly goal is at risk: a short workout still counts.
  if (streak?.atRisk && streak.needed > 0) {
    out.push({
      id: `streak-${Math.floor(now / DAY)}`,
      tone: "info",
      title: streak.weeks > 0 ? `Your ${streak.weeks}-week streak needs ${streak.needed} more` : `${streak.needed} more for this week's goal`,
      why: `You need ${streak.needed} more workout${streak.needed > 1 ? "s" : ""} this week for your ${profile.daysPerWeek}-day goal, and the days are running out.`,
      advice: "Short on time? A 30-minute workout still counts.",
      action: profile.minutes > 30 ? { kind: "minutes", minutes: 30, label: "Make today 30 minutes" } : undefined,
    });
  }

  // 6. The last hard week of the block.
  if (!week.deload && week.week === week.length - 2 && recent.length) {
    out.push({
      id: `last-hard-${weekStart(profile, now)}`,
      tone: "info",
      title: "Last hard week of the block",
      why: `${week.label}: the deload starts next week.`,
      advice: "This is the week to go for it. You'll recover next week.",
    });
  }

  // 7. Something going well, so the lifter knows what's working.
  const gain = bestGain(events, now);
  if (gain && !stalled.some((s) => s.exerciseId === gain.exerciseId)) {
    out.push({
      id: `gain-${gain.exerciseId}-${Math.round(gain.pct)}`,
      tone: "good",
      title: `${name(gain.exerciseId)} is moving`,
      why: `Your estimated one-rep max is up ${Math.round(gain.pct)}% in ${weeksText(gain.weeks)}.`,
      advice: "Keep the same exercise and rep range while it keeps climbing.",
    });
  }

  const rank = { warn: 0, info: 1, good: 2 } as const;
  return out.sort((a, b) => rank[a.tone] - rank[b.tone]);
}
