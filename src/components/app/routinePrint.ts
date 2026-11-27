// A lifter's own routine as a printable one-page sheet (Print routine in the routine editor;
// docs/decisions/printable-plans.md): each exercise with its sets and reps, the weight the app plans for it next at
// the lifter's gym (the same `target` the workout uses, so paper and phone agree), the rest, four sessions to write in
// and a QR code with the routine's share link, so whoever scans it can add the same routine. Nothing personal goes
// into the code: the link carries only the exercises and sets, plus the lifter's invite where they have one.
import { exercise } from "@/lib/exercises";
import { restFor } from "@/lib/generator";
import { t } from "@/lib/i18n";
import type { PrintSheet, PrintWords } from "@/lib/printSheet";
import { target, TIMED } from "@/lib/progression";
import { cleanRange } from "@/lib/routines";
import type { AppEvent, Gym, Profile, Routine } from "@/lib/types";

import { clock, loadText } from "./format";

/** The sheet's words in the app's language. */
export function appPrintWords(): PrintWords {
  return {
    kicker: t("prt.kicker"),
    exercise: t("prt.exercise"),
    setsReps: t("prt.setsReps"),
    rest: t("prt.rest"),
    next: t("prt.next"),
    session: t("prt.session"),
    date: t("prt.date"),
    superset: t("prt.superset"),
    howTitle: t("prt.howTitle"),
    scanTitle: t("prt.scanRoutine"),
    scanBody: t("prt.scanRoutineBody"),
    free: t("prt.free"),
    qrLabel: t("prt.qrLabel"),
    writeIn: t("prt.writeIn"),
    notes: t("prt.notes"),
  };
}

export interface RoutinePrintInput {
  routine: Routine;
  events: readonly AppEvent[];
  profile: Profile;
  gym: Gym | undefined;
  now: number;
  /** The routine's share link (routineUrl, with the invite when there is one). */
  link: string;
  /** How the link is printed under the code: the lifter's invite address, or the site. */
  shown: string;
  lang: string;
}

/** "3 × 8", "3 × 8–10" (a coach's range) or "3 × 30 s" (a hold). */
function schemeOf(sets: number, reps: string): string {
  return `${sets} × ${reps}`;
}

export function routinePrintSheet({ routine, events, profile, gym, now, link, shown, lang }: RoutinePrintInput): PrintSheet {
  const items = routine.items.flatMap((i) => {
    try {
      return [{ item: i, ex: exercise(i.exerciseId) }];
    } catch {
      return [];
    }
  });
  const sets = items.reduce((k, x) => k + x.item.sets, 0);
  const rows = items.map(({ item, ex }, i) => {
    const goal = gym ? target(ex, events, profile, gym, now) : null;
    const range = routine.rehab || ex.cardio || TIMED.has(ex.id) ? undefined : cleanRange(item.reps, item.repsTo);
    const reps = routine.rehab && item.reps ? item.reps : (goal?.reps ?? item.reps);
    const repWords = ex.cardio
      ? ""
      : range
        ? range[0] === range[1]
          ? String(range[0])
          : `${range[0]}–${range[1]}`
        : reps
          ? TIMED.has(ex.id)
            ? t("fmt.seconds", { n: reps })
            : String(reps)
          : "";
    const next =
      !goal || ex.cardio || TIMED.has(ex.id)
        ? ""
        : ex.load === "bodyweight" && goal.weight <= 0
          ? ""
          : loadText(ex, goal.weight, gym!.unit);
    const linked = !!item.group && item.group === routine.items[i + 1]?.group;
    return {
      name: ex.name,
      scheme: repWords ? schemeOf(item.sets, repWords) : String(item.sets),
      rest: clock(restFor(ex, profile.goal, profile.training)),
      ...(next ? { next } : {}),
      ...(linked ? { superset: true } : {}),
    };
  });
  return {
    lang,
    title: routine.name,
    facts: [
      { label: t("prt.fact.exercises"), value: String(items.length) },
      { label: t("prt.fact.sets"), value: String(sets) },
      ...(gym ? [{ label: t("prt.fact.gym"), value: gym.name }] : []),
    ],
    days: [{ name: "", rows }],
    qr: { url: link, shown },
    words: appPrintWords(),
  };
}
