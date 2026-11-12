import { blockWeek, weekStart } from "./block";
import { can } from "./entitlements";
import { EXERCISE_BY_ID } from "./exercises";
import type { Streak } from "./game";
import { weeklySets } from "./generator";
import { date, inSentence, list, t } from "./i18n";
import { fromCm, lengthUnit, measuresOf } from "./measure";
import { foodDays, proteinShort, weekIntake } from "./nutrition";
import { activeFixes, findPlateaus, FIX_TEXT, fixResult, type FixKind, type Plateau } from "./plateau";
import { epley, gradedSet, sessionsOf, TIMED } from "./progression";
import { currentKg, currentTdee } from "./tdee";
import { MUSCLE_LABEL, type AppEvent, type BodyweightEvent, type Muscle, type Profile, type SetEvent } from "./types";
import { fmtNum, fromKg } from "./units";

// Coach's notes (Melvin, 2026-11-09): proactive, action-oriented insights instead of charts to
// interpret. Each one says what we noticed, the numbers behind it, and one thing to do, ideally a
// single tap (start a deload, make a muscle a priority, fit a short workout). Only shown when there
// is something worth acting on. Derived from events every time, never stored. The words live in the
// catalogues (src/locales, keys ins.*).

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
  /** Open a screen ("route" or "route/arg"). `pro` marks a button that opens the paywall at a Pro feature. */
  | { kind: "go"; route: string; label: string; pro?: boolean }
  /** Open the share sheet with a card of a lift going up (estimated one-rep max in kg, from and to). */
  | { kind: "share"; trend: Gain; label: string };

/** A lift going up over the last six weeks. */
export interface Gain {
  exerciseId: string;
  pct: number;
  weeks: number;
  from: number;
  to: number;
}

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
  /** Called once the note is on screen (the trial's notes record it for the admin Funnel tab). */
  onShow?: () => void;
}

export interface InsightInput {
  events: readonly AppEvent[];
  profile: Profile;
  now: number;
  /** The days-per-week streak (game.ts goalStreak), for the "streak at risk" note. */
  streak?: Pick<Streak, "needed" | "atRisk" | "weeks">;
}

const name = (id: string) => EXERCISE_BY_ID.get(id)?.name ?? id;
const weeksText = (n: number) => t("ins.weeks", { count: n });
/** Exercise names inside a sentence. */
const lowerName = (id: string) => inSentence(name(id), true);

/** Best estimated one-rep max per session for a loaded lift, oldest first. */
function e1Series(events: readonly AppEvent[], exerciseId: string): { at: number; e1: number }[] {
  return sessionsOf(events, exerciseId)
    .map((sets) => ({
      at: sets[0].at,
      e1: Math.max(0, ...sets.filter((s) => !s.challenge && s.weight > 0).map((s) => epley(s.weight, s.reps))),
    }))
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
function bestGain(events: readonly AppEvent[], now: number): Gain | null {
  const ids = new Set(events.filter((e): e is SetEvent => e.type === "set" && now - e.at < 6 * WEEK).map((e) => e.exerciseId));
  let top: Gain | null = null;
  for (const id of ids) {
    const ex = EXERCISE_BY_ID.get(id);
    if (!ex || ex.load === "bodyweight" || TIMED.has(id)) continue;
    const s = e1Series(events, id).filter((x) => now - x.at < 6 * WEEK);
    if (s.length < 3) continue;
    const to = Math.max(...s.slice(-2).map((x) => x.e1));
    const pct = (to / s[0].e1 - 1) * 100;
    const weeks = Math.max(1, Math.round((s.at(-1)!.at - s[0].at) / WEEK));
    if (pct >= 5 && (!top || pct > top.pct)) top = { exerciseId: id, pct, weeks, from: s[0].e1, to };
  }
  return top;
}

/** Weigh-ins in the window, oldest first. */
function weighIns(events: readonly AppEvent[], now: number, days: number): BodyweightEvent[] {
  return events
    .filter((e): e is BodyweightEvent => e.type === "bodyweight" && now - e.at <= days * DAY && e.at <= now)
    .sort((a, b) => a.at - b.at);
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
      const real = s.sets.filter(gradedSet);
      return real.length ? real.filter((x) => x.reps >= x.targetReps).length / real.length : 1;
    });
    if (rates.every((r) => r < 0.7)) {
      const pct = Math.round((rates.reduce((a, b) => a + b, 0) / 3) * 100);
      out.push({
        id: `missed-${recent[0].at}`,
        tone: "warn",
        title: t("ins.fatigue.title"),
        why: t("ins.fatigue.why", { pct }),
        advice: canDeload ? t("ins.fatigue.advice") : t("ins.fatigue.adviceLight"),
        action: canDeload ? { kind: "deload", label: t("ins.deload") } : undefined,
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
    const names = stalled.slice(0, 3).map((s) => lowerName(s.exerciseId));
    fatigue.why += ` ${t("ins.fatigue.stalledToo", { count: names.length, names: list(names), weeks: weeksText(stalled[0].weeks) })}`;
  } else if (stalled.length >= 2) {
    const names = stalled.slice(0, 3).map((s) => lowerName(s.exerciseId));
    out.push({
      id: `stall-many-${stalled.map((s) => s.exerciseId).join(",")}`,
      tone: "warn",
      title: t("ins.stallMany.title", { count: stalled.length }),
      why: t("ins.stallMany.why", { names: list(names), weeks: weeksText(stalled[0].weeks) }),
      advice: canDeload ? t("ins.stallMany.advice") : t("ins.stallMany.adviceDeload"),
      action: canDeload ? { kind: "deload", label: t("ins.deload") } : undefined,
    });
  } else if (can("plateauDetective")) {
    for (const p of findPlateaus(events, profile, now, fixes).slice(0, 2)) {
      const fix = FIX_TEXT[p.fix];
      out.push({
        id: `plateau-${p.exerciseId}-${p.weeks}-${p.fix}`,
        tone: "warn",
        title: t("ins.stalled.title", { name: name(p.exerciseId) }),
        why: t("ins.plateau.why", { weeks: weeksText(p.weeks), best: w(p.best), cause: p.causes[0].text }),
        advice: t("ins.plateau.advice", { what: fix.what }),
        action: {
          kind: "plateau",
          plateau: p,
          fix: p.fix,
          label: t("ins.plateau.action", { fix: inSentence(fix.title, true) }),
        },
      });
    }
  } else if (stalled.length === 1) {
    const s = stalled[0];
    out.push({
      id: `stall-${s.exerciseId}-${s.sessions}`,
      tone: "warn",
      title: t("ins.stalled.title", { name: name(s.exerciseId) }),
      why: t("ins.stall.why", { weeks: weeksText(s.weeks), sessions: s.sessions, best: w(s.best) }),
      advice: t("ins.stall.advice"),
      // Without Pro: the plateau detective would find the cause; its button opens the paywall there.
      action: { kind: "go", route: "pro/plateau", label: t("ins.stall.action"), pro: true },
    });
  }

  // Plateau fixes: running ones say they're in the plan, finished ones say whether they worked.
  for (const f of activeFixes(fixes, now)) {
    out.push({
      id: `fix-live-${f.exerciseId}-${f.startedAt}`,
      tone: "info",
      title: t("ins.fixLive.title", { name: name(f.exerciseId), fix: inSentence(FIX_TEXT[f.kind].title, true) }),
      why: t("ins.fixLive.why", { date: date(f.until, { day: "numeric", month: "short" }) }),
      advice: t("ins.fixLive.advice"),
    });
  }
  for (const f of fixes.filter((x) => x.until <= now && now - x.until < 21 * DAY)) {
    const r = fixResult(f, events);
    out.push({
      id: `fix-done-${f.exerciseId}-${f.startedAt}`,
      tone: r?.worked ? "good" : "info",
      title: t("ins.fixDone.title", { name: name(f.exerciseId) }),
      why: !r
        ? t("ins.fixDone.noData")
        : r.worked
          ? t("ins.fixDone.worked", { pct: Math.round(r.gain * 1000) / 10 })
          : t("ins.fixDone.notYet"),
      advice: r?.worked ? t("ins.fixDone.adviceWorked") : t("ins.fixDone.adviceStuck"),
    });
  }

  // 3. A big muscle well short of its weekly sets for the last two full weeks.
  if (recent.length >= 4) {
    const thisWeek = weekStart(profile, now);
    const priorities = new Set(profile.training?.priorities ?? []);
    const firstSet = Math.min(...recent.map((s) => s.sets[0].at));
    if (firstSet <= thisWeek - 2 * WEEK) {
      const a = weeklySets(
        events.filter((e) => e.at < thisWeek),
        thisWeek - WEEK,
      );
      const b = weeklySets(
        events.filter((e) => e.at < thisWeek - WEEK),
        thisWeek - 2 * WEEK,
      );
      const lagging = BIG.filter((m) => !priorities.has(m))
        .map((m) => ({ m, avg: (a[m] + b[m]) / 2 }))
        .filter((x) => x.avg < week.setsPerMuscle * 0.5)
        .sort((x, y) => x.avg - y.avg);
      if (lagging.length && lagging.length < BIG.length) {
        const { m, avg } = lagging[0];
        out.push({
          id: `volume-${m}-${thisWeek}`,
          tone: "info",
          title: t("ins.volume.title", { muscle: MUSCLE_LABEL[m] }),
          why: t("ins.volume.why", { sets: Math.round(avg), goal: week.setsPerMuscle }),
          advice: t("ins.volume.advice", { muscle: inSentence(MUSCLE_LABEL[m], true) }),
          action: {
            kind: "priority",
            muscle: m,
            label: t("ins.volume.action", { muscle: inSentence(MUSCLE_LABEL[m], true) }),
          },
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
        title: t("ins.fatUp.title"),
        why: t("ins.fatUp.why", {
          change: fmtNum(Math.round(change * 10) / 10),
          weeks: weeksText(span),
          now: fmtNum(Math.round(fat.at(-1)!.v * 10) / 10),
        }),
        advice: profile.goal === "muscle" ? t("ins.fatUp.adviceMuscle") : t("ins.fatUp.advice"),
      });
    } else if (change <= -1 && !stalled.length) {
      out.push({
        id: `fat-down-${fat.at(-1)!.at}`,
        tone: "good",
        title: t("ins.fatDown.title"),
        why: t("ins.fatDown.why", { change: fmtNum(Math.round(-change * 10) / 10), weeks: weeksText(span) }),
        advice: t("ins.fatDown.advice"),
      });
    }
  }
  // Without body fat readings, a growing or shrinking waist tells the same story (body measurements).
  const waist = measuresOf(events, "waist").filter((e) => now - e.at <= 56 * DAY && e.at <= now);
  if (fat.length < 3 && waist.length >= 3 && waist.at(-1)!.at - waist[0]!.at >= 3 * WEEK) {
    const span = Math.max(1, Math.round((waist.at(-1)!.at - waist[0]!.at) / WEEK));
    const change = slopePerWeek(waist.map((e) => ({ at: e.at, v: e.cm }))) * span;
    const len = (cm: number) => `${fmtNum(Math.round(fromCm(Math.abs(cm), profile.unit) * 10) / 10)} ${lengthUnit(profile.unit)}`;
    if (change >= 2) {
      out.push({
        id: `waist-up-${waist.at(-1)!.at}`,
        tone: "warn",
        title: t("ins.waistUp.title"),
        why: t("ins.waistUp.why", { change: len(change), weeks: weeksText(span) }),
        advice: profile.goal === "muscle" ? t("ins.fatUp.adviceMuscle") : t("ins.fatUp.advice"),
      });
    } else if (change <= -2 && !stalled.length) {
      out.push({
        id: `waist-down-${waist.at(-1)!.at}`,
        tone: "good",
        title: t("ins.waistDown.title"),
        why: t("ins.waistDown.why", { change: len(change), weeks: weeksText(span) }),
        advice: t("ins.fatDown.advice"),
      });
    }
  }
  let weightPct: number | undefined;
  if (ins.length >= 3 && ins.at(-1)!.at - ins[0].at >= 3 * WEEK) {
    const perWeek = slopePerWeek(ins.map((e) => ({ at: e.at, v: e.kg })));
    const pct = (perWeek / ins.at(-1)!.kg) * 100;
    weightPct = pct;
    if (pct <= -1) {
      out.push({
        id: `weight-down-${ins.at(-1)!.at}`,
        tone: "warn",
        title: t("ins.weightDown.title"),
        why: t("ins.weightDown.why", { weight: w(-perWeek), pct: fmtNum(Math.round(-pct * 10) / 10) }),
        advice: stalled.length ? t("ins.weightDown.adviceStalled") : t("ins.weightDown.advice"),
      });
    } else if (pct >= 0.5 && profile.goal !== "muscle") {
      out.push({
        id: `weight-up-${ins.at(-1)!.at}`,
        tone: "info",
        title: t("ins.weightUp.title"),
        why: t("ins.weightUp.why", { weight: w(perWeek), weeks: weeksText(Math.round((ins.at(-1)!.at - ins[0].at) / WEEK)) }),
        advice: t("ins.weightUp.advice"),
        action: { kind: "go", route: "stats", label: t("ins.weightUp.action") },
      });
    }
  }

  // 4b. Food, from a food app through Health Connect or Apple Health (nutrition.ts). Protein short several logged
  // days running gets its own note; calories are judged against TDEE and the goal, and when a body note already
  // tells the story (weight dropping fast, body fat or waist rising) the food numbers join it instead of a second note.
  const food = foodDays(events, now);
  if (food.length) {
    const short = proteinShort(food, currentKg(events as AppEvent[], profile), now);
    if (short) {
      out.push({
        id: `protein-short-${short.last}-${short.days}`,
        tone: "warn",
        title: t("ins.proteinShort.title", { count: short.days }),
        why: t("ins.proteinShort.why", { avg: short.avg, target: short.target }),
        advice: t("ins.proteinShort.advice", { gap: Math.max(10, Math.round((short.target - short.avg) / 5) * 5) }),
        action: { kind: "go", route: "tools/tdee", label: t("ins.food.action") },
      });
    }
    const intake = weekIntake(food, now);
    const tdee =
      intake &&
      currentTdee(
        events as AppEvent[],
        [...sessions.values()].map((x) => ({ start: x[0]!.at })),
        profile,
        now,
      ).result;
    if (intake && tdee) {
      const kcal = (n: number) => `${fmtNum(Math.round(n / 10) * 10)} kcal`;
      const gap = intake.avg - tdee.tdee;
      const nums = { days: intake.days, avg: kcal(intake.avg), gap: kcal(Math.abs(gap)), tdee: kcal(tdee.tdee) };
      const body = out.find((x) => /^(weight-down|fat-up|waist-up)-/.test(x.id));
      if (body?.id.startsWith("weight-down-") && gap <= -300) {
        body.why += ` ${t("ins.food.why", nums)}`;
      } else if (body && !body.id.startsWith("weight-down-") && gap >= 150) {
        body.why += ` ${t("ins.food.overToo", nums)}`;
      } else if (profile.goal === "muscle" && gap <= -300 && !(weightPct !== undefined && weightPct >= 0.25)) {
        out.push({
          id: `eat-low-muscle-${intake.last}`,
          tone: "warn",
          title: t("ins.eatLowMuscle.title"),
          why: t("ins.food.why", nums),
          advice: t("ins.eatLowMuscle.advice", { bulk: kcal(tdee.bulk) }),
          action: { kind: "go", route: "tools/tdee", label: t("ins.food.action") },
        });
      } else if (profile.goal !== "muscle" && intake.avg < tdee.cut - 250 && !body) {
        out.push({
          id: `eat-low-${intake.last}`,
          tone: "warn",
          title: t("ins.eatLow.title"),
          why: t("ins.food.why", nums),
          advice: t("ins.eatLow.advice", { cut: kcal(tdee.cut), tdee: kcal(tdee.tdee) }),
          action: { kind: "go", route: "tools/tdee", label: t("ins.food.action") },
        });
      }
    }
  }

  // 5. The weekly goal is at risk: a short workout still counts.
  if (streak?.atRisk && streak.needed > 0) {
    out.push({
      id: `streak-${Math.floor(now / DAY)}`,
      tone: "info",
      title:
        streak.weeks > 0
          ? t("ins.streak.title", { weeks: streak.weeks, needed: streak.needed })
          : t("ins.streak.titleGoal", { needed: streak.needed }),
      why: t("ins.streak.why", { count: streak.needed, days: profile.daysPerWeek }),
      advice: t("ins.streak.advice"),
      action: profile.minutes > 30 ? { kind: "minutes", minutes: 30, label: t("ins.streak.action") } : undefined,
    });
  }

  // 6. The last hard week of the block.
  if (!week.deload && week.week === week.length - 2 && recent.length) {
    out.push({
      id: `last-hard-${weekStart(profile, now)}`,
      tone: "info",
      title: t("ins.lastHard.title"),
      why: t("ins.lastHard.why", { week: week.label }),
      advice: t("ins.lastHard.advice"),
    });
  }

  // 7. Something going well, so the lifter knows what's working.
  const gain = bestGain(events, now);
  if (gain && !stalled.some((s) => s.exerciseId === gain.exerciseId)) {
    out.push({
      id: `gain-${gain.exerciseId}-${Math.round(gain.pct)}`,
      tone: "good",
      title: t("ins.gain.title", { name: name(gain.exerciseId) }),
      why: t("ins.gain.why", { pct: Math.round(gain.pct), weeks: weeksText(gain.weeks) }),
      advice: t("ins.gain.advice"),
      action: { kind: "share", trend: gain, label: t("card.shareIt") },
    });
  }

  const rank = { warn: 0, info: 1, good: 2 } as const;
  return out.sort((a, b) => rank[a.tone] - rank[b.tone]);
}
