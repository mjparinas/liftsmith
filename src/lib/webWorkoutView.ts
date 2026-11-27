// The generated workout as the website shows it (server only: the API route and the page's example at build time).
// Names, muscles and reasons in the page's language; no catalogue reaches the browser (docs/decisions/workout-generator.md).
import { LOCAL_GUIDES } from "@/content/exerciseGuides/i18n";
import { exerciseNames, genWords, muscleLabels } from "@/locales/site/fromApp";
import type { GenUi } from "@/locales/site/tools/types";

import { EXERCISE_BY_ID } from "./exercises";
import { repRange } from "./progression";
import { encodeRoutine, routineUrl } from "./routineShare";
import { fill, localPath, type SiteLang } from "./siteLang";
import { groupRange } from "./superset";
import { encodeGen, generateWeb, genRoutine, isTimed, type GenOptions } from "./webWorkout";

export interface GenItemView {
  id: string;
  name: string;
  /** The exercise's page on the website, in the page's language when it has one. */
  href: string;
  /** "4 × 8" or "3 × 30 s". */
  scheme: string;
  rest: string;
  /** Reps in the tank, or how to end a hold. */
  effort: string;
  /** "Warm-up sets first: 2", when there are any. */
  warmups?: string;
  /** "Superset A" on both exercises of a pair. */
  superset?: string;
  /** The short reason, from the same data the engine used. */
  why: string;
}

export interface GenView {
  /** The choices, put back to what the engine used (minutes rounded, unknown equipment dropped). */
  options: GenOptions;
  code: string;
  title: string;
  /** "About 44 min" */
  about: string;
  /** Said when the workout came out much shorter than the time asked for. */
  short?: string;
  items: GenItemView[];
  /** "Start this in the app": the workout as a routine link (routineShare.ts), which opens the app. */
  appUrl: string;
}

const restText = (sec: number) => (sec < 60 ? `${sec} s` : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`);

export function genView(o: GenOptions, lang: SiteLang, ui: GenUi): GenView {
  const { plan, profile } = generateWeb(o);
  const ids = plan.items.map((i) => i.exerciseId);
  const names = lang === "en" ? {} : exerciseNames(lang, ids);
  const nameOf = (id: string) => names[id] ?? EXERCISE_BY_ID.get(id)?.name ?? id;
  const muscles = muscleLabels(lang);
  const letters = new Map<string, string>();
  for (const i of plan.items) if (i.group && !letters.has(i.group)) letters.set(i.group, String.fromCharCode(65 + letters.size));

  const items = plan.items.map((item, k): GenItemView => {
    const ex = EXERCISE_BY_ID.get(item.exerciseId)!;
    const timed = isTimed(item);
    const muscle = muscles[item.focus];
    const pick = timed
      ? ui.whyHold
      : ex.load === "bodyweight" && ex.compound
        ? ui.whyBodyweight
        : ex.compound
          ? k === 0
            ? ui.whyFirst
            : ui.whyCompound
          : ui.whyIsolation;
    const [lo, hi] = repRange(ex, profile.goal, profile.training);
    const reps = timed
      ? ui.repsHold
      : ex.load === "bodyweight"
        ? ui.repsBodyweight
        : profile.goal === "strength"
          ? ui.repsStrength
          : profile.goal === "general"
            ? ui.repsGeneral
            : ui.repsMuscle;
    const sets = item.sets >= 4 ? (ex.compound ? ui.mainSets : ui.moreSets) : undefined;
    let pair: string | undefined;
    if (item.group) {
      const [s, e] = groupRange(plan.items, k);
      const other = plan.items.slice(s, e + 1).find((x) => x !== item);
      if (k === s && other) pair = fill(ui.pair, { other: nameOf(other.exerciseId) });
    }
    const vars = { muscle, lo, hi, reps: item.target.reps, sets: item.sets };
    const why = [pick, reps, sets]
      .filter((x): x is string => !!x)
      .map((x) => fill(x, vars))
      .concat(pair ? [pair] : [])
      .join(" · ");
    const guide = lang !== "en" && LOCAL_GUIDES[lang][ex.id];
    return {
      id: ex.id,
      name: nameOf(ex.id),
      href: guide ? localPath(lang, `/exercises/${ex.id}/`) : `/exercises/${ex.id}/`,
      scheme: fill(timed ? ui.setsSecs : ui.setsReps, { sets: item.sets, reps: item.target.reps, secs: item.target.reps }),
      rest: fill(ui.rest, { time: restText(item.restSec) }),
      effort: timed ? ui.holdForm : fill(ui.tank, { n: item.target.rir }),
      ...(item.warmup?.length ? { warmups: fill(ui.warmups, { n: item.warmup.length }) } : {}),
      ...(item.group ? { superset: fill(ui.superset, { letter: letters.get(item.group)! }) } : {}),
      why,
    };
  });

  const words = genWords(lang);
  const title = fill(words.title, { focus: words.focuses[o.focus], minutes: o.minutes });
  return {
    options: o,
    code: encodeGen(o),
    title,
    about: fill(ui.about, { n: plan.estMinutes }),
    ...(items.length && plan.estMinutes < o.minutes - 10 ? { short: fill(ui.short, { n: plan.estMinutes }) } : {}),
    items,
    appUrl: routineUrl(encodeRoutine(genRoutine(plan, title))),
  };
}
