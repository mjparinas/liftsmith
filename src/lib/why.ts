import { weekStart, type BlockWeek } from "./block";
import { EXERCISE_BY_ID } from "./exercises";
import { weeklySets, type Plan, type PlanItem } from "./generator";
import { currentTag, list, t } from "./i18n";
import type { Readiness, Signal } from "./readiness";
import { recovery } from "./recovery";
import { PRIORITY_VOLUME } from "./training";
import { MUSCLE_LABEL, type AppEvent, type Muscle, type Profile } from "./types";

// Every recommendation says why (Melvin, 2026-11-09: "action-oriented recommendations, not stats
// for the sake of stats"). Each exercise in a plan gets one short line covering why it was picked,
// why that many sets, and why that weight and those reps. The day's call gets a sentence that names
// the signals behind it. Everything is rebuilt from the same data the generator and progression used,
// so it never disagrees with the plan. The words live in the catalogues (src/locales, keys why.*).

export interface ItemWhy {
  /** Why this exercise today, e.g. "Chest 96% recovered, 4 of 12 sets this week". */
  pick?: string;
  /** Why this many sets, when it isn't the usual count. */
  sets?: string;
  /** Why this weight and these reps (progression's note). */
  load: string;
  /** All of the above in one line, for the plan list and the workout screen. */
  short: string;
}

export interface WhyContext {
  week: BlockWeek;
  call: Plan["call"];
  rec: Record<Muscle, number>;
  done: Record<Muscle, number>;
  profile: Pick<Profile, "training">;
  /** Set when a fixed program or a saved routine chose the exercises. */
  chosen?: boolean;
}

export function whyContext(plan: Plan, events: readonly AppEvent[], profile: Profile, now: number): WhyContext {
  return {
    week: plan.week,
    call: plan.call,
    rec: recovery(events, now),
    done: weeklySets(events, weekStart(profile, now)),
    profile,
    chosen: !!plan.routineId || !!plan.program?.fixed,
  };
}

/** Lower-cases the first letter to continue a sentence, but leaves acronyms (HRV, VFC) alone. */
const lower = (s: string) => (/^\p{Lu}{2}/u.test(s) ? s : s.charAt(0).toLocaleLowerCase(currentTag()) + s.slice(1));

export function itemWhy(item: PlanItem, ctx: WhyContext): ItemWhy {
  const ex = EXERCISE_BY_ID.get(item.exerciseId);
  const training = ctx.profile.training;
  const prio = new Set(training?.priorities ?? []);
  let pick: string | undefined;
  if (!ctx.chosen && ex) {
    const m = item.focus;
    const goal = Math.round(ctx.week.setsPerMuscle * (prio.has(m) ? PRIORITY_VOLUME : 1));
    const done = Math.round(ctx.done[m]);
    pick = t(prio.has(m) ? "why.pickPriority" : "why.pick", { muscle: MUSCLE_LABEL[m], pct: Math.round(ctx.rec[m]), done, goal });
    if (training?.favourites?.includes(ex.id)) pick = t("why.favourite", { pick });
  }

  let sets: string | undefined;
  const own = training?.exercises?.[item.exerciseId]?.sets ?? training?.sets;
  if (ctx.week.deload) sets = t("why.deloadSets");
  else if (ctx.call === "recover") sets = t("why.easySets");
  else if (own !== undefined && !ctx.chosen) sets = t("why.ownSets", { count: own });

  const load = item.target.note || "";

  const short = [pick, sets, load && lower(load)].filter(Boolean).join(" · ");
  return { pick, sets, load, short: short.charAt(0).toUpperCase() + short.slice(1) };
}

const joinAnd = (xs: string[]) => list(xs);

/**
 * One sentence on why today is a push, steady or easy day, naming the strongest signals that point
 * that way. When the lifter overrode the call, it says what we'd suggested and why.
 */
export function callWhy(r: Readiness, chosen: Plan["call"], deload: boolean): string {
  const up = r.signals.filter((s) => s.points > 0);
  const down = r.signals.filter((s) => s.points < 0);
  const names = (xs: Signal[]) => joinAnd(xs.slice(0, 2).map((s) => lower(s.text)));
  const score = t("why.score", { score: r.score });
  if (chosen !== r.call) {
    const what = t(`why.what.${r.call}`);
    const because = r.call === "recover" ? down : r.call === "push" ? up : [];
    return because.length
      ? t("why.call.overrideBecause", { what, reasons: names(because), score })
      : t("why.call.override", { what, score });
  }
  if (deload) return t("why.call.deload", { score });
  if (chosen === "push") return t("why.call.push", { reasons: up.length ? names(up) : t("why.call.fresh"), score });
  if (chosen === "recover") return t("why.call.easy", { reasons: down.length ? names(down) : t("why.call.needRecovery"), score });
  if (!r.signals.length || (up.length === 0 && down.length === 0)) return t("why.call.planned", { score });
  const mixed = up.length && down.length ? t("why.call.but", { up: names(up), down: names(down) }) : names(up.length ? up : down);
  return t("why.call.plannedBecause", { reasons: mixed, score });
}

/** The line under the target on the workout screen: why that weight and reps, and the set count when the day changed it. */
export function workoutWhy(item: PlanItem, plan: Pick<Plan, "week" | "call">): string {
  const sets = plan.week.deload ? t("why.deloadSets") : plan.call === "recover" ? t("why.easySets") : undefined;
  return [item.target.note, sets].filter(Boolean).join(" · ");
}
