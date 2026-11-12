// The trial's coach's notes and the sentences shared by every trial moment (trialRecap.ts has the numbers;
// docs/decisions/money.md "The first two weeks"). Like every coach's note: what we saw, the numbers, one thing
// to do. Built from whole catalogue lines (trl.*) with placeholders.
import { EXERCISE_BY_ID } from "./exercises";
import { date, inSentence, list, t } from "./i18n";
import type { Insight } from "./insights";
import { adjusted, daysLeft, type ProImpact, type TrialStage, type TrialWindow } from "./trialRecap";
import type { Profile } from "./types";
import { fmtWeight } from "./units";

const name = (id: string) => EXERCISE_BY_ID.get(id)?.name ?? id;

/** "So far Pro has planned 6 adaptive workouts for you, raised 8 weights and adjusted 2 days…" */
export function impactLine(i: ProImpact, over: boolean): string {
  const vars = {
    workouts: t("trl.workouts", { count: i.workouts }),
    weights: t("trl.weights", { count: i.raised }),
    days: t("trl.days", { count: adjusted(i) }),
  };
  if (adjusted(i)) return t(over ? "trl.didDays" : "trl.soFarDays", vars);
  return t(over ? "trl.did" : "trl.soFar", vars);
}

/** "Biggest jump: Back squat, from 80 kg to 90 kg." */
export function topLine(i: ProImpact, unit: Profile["unit"]): string | null {
  if (!i.top) return null;
  return t("trl.top", { name: name(i.top.exerciseId), from: fmtWeight(i.top.from, unit), to: fmtWeight(i.top.to, unit) });
}

/** The end-of-workout line: what Pro changed in this one workout, or null when it changed nothing. */
export function doneLines(i: ProImpact): string[] {
  const out: string[] = [];
  if (i.lifts.length) out.push(t("trl.done.raised", { lifts: list(i.lifts.slice(0, 3).map((id) => inSentence(name(id), true))) }));
  if (i.eased) out.push(t("trl.done.eased"));
  else if (i.pushed) out.push(t("trl.done.pushed"));
  return out;
}

export interface TrialNoteInput {
  stage: TrialStage;
  win: TrialWindow;
  impact: ProImpact;
  /** The store will turn the trial into a subscription at its end (not cancelled). */
  renews: boolean;
  unit: Profile["unit"];
  now: number;
}

/** The analytics stage of a note (trial_recap), so the admin Funnel tab can tell who saw what Pro did. */
export type NoteStage = "halfway" | "ending" | "ended";

/** The trial's coach's note for now: halfway, the last two days, or the two weeks after it lapsed. */
export function trialNote(x: TrialNoteInput): (Insight & { stage: NoteStage }) | null {
  const { stage, win, impact, renews, unit, now } = x;
  if (stage === "running") return null;
  const endDay = Math.floor(win.end / 86_400_000);
  const over = stage === "ended";
  const top = topLine(impact, unit);
  const why = impact.workouts ? [impactLine(impact, over), top].filter(Boolean).join(" ") : t("trl.none");
  const on = date(win.end, { weekday: "long", day: "numeric", month: "long" });
  if (stage === "halfway")
    return {
      id: `trial-halfway-${endDay}`,
      stage,
      tone: "good",
      title: t("trl.halfway.title"),
      why,
      advice: impact.workouts ? t("trl.halfway.advice") : t("trl.none.advice"),
      action: { kind: "go", route: "pro/trial", label: t("trl.seeAll") },
    };
  if (stage === "ending")
    return {
      id: `trial-ending-${endDay}-${renews ? "renews" : "stops"}`,
      stage,
      tone: "info",
      title: t("trl.ending.title", { count: daysLeft(win, now) }),
      why,
      advice: renews ? t("trl.ending.renews", { date: on }) : t("trl.ending.stops", { date: on }),
      // A trial that renews needs nothing; one that was cancelled can be kept from the store's own page.
      action: renews ? undefined : { kind: "go", route: "pro/trialEnd", label: t("trl.keep") },
    };
  return {
    id: `trial-ended-${endDay}`,
    stage,
    tone: "info",
    title: t("trl.ended.title"),
    why,
    advice: t("trl.ended.advice"),
    action: { kind: "go", route: "pro/trialEnded", label: t("trl.back"), pro: true },
  };
}
