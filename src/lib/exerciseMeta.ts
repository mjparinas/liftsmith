// Titles and descriptions for the exercise pages and their alternatives pages, written for what people search:
// "<lift>", "how to do a <lift>", "<lift> muscles worked", "<lift> alternatives" (2026-11-17, docs/decisions/seo.md).
// Each is built from a list of candidates, longest first, and the first one that fits search-result length wins.
import { ARTICLES, type Article } from "@/content/articles";
import { EXERCISE_GUIDES } from "@/content/exerciseGuides";

import { alternativesTo, EQUIPMENT_NAME, MUSCLE_NAME } from "./seo";
import { hasStartTable } from "./startTable";
import type { Exercise } from "./types";

/** Search results show about 60 characters of a title and 155 to 160 of a description. */
export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MAX = 158;

const list = (words: string[]) => (words.length < 2 ? (words[0] ?? "") : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`);
const muscles = (e: Exercise) => list(e.primary.map((m) => MUSCLE_NAME[m].toLowerCase()));
const lower = (e: Exercise) => e.name.toLowerCase();

/** The first candidate that fits, or the shortest one. */
export function fit(candidates: string[], max: number): string {
  return candidates.find((c) => c.length <= max) ?? candidates.reduce((a, b) => (b.length < a.length ? b : a));
}

/** Title and description of /exercises/<id>/. */
export function exerciseMeta(e: Exercise): { title: string; description: string } {
  const guide = EXERCISE_GUIDES[e.id];
  const alts = alternativesTo(e.id).length;
  const altWords = alts ? `${alts} alternatives` : "";
  const what = `The ${lower(e)} works the ${muscles(e)}`;
  const kit = e.needs.length ? "" : " No equipment needed.";
  if (!guide) {
    return {
      title: fit(
        [
          ...(alts
            ? [
                `${e.name}: how to do it, muscles worked, ${altWords}`,
                `${e.name}: how to do it, muscles, ${altWords}`,
                `${e.name}: how to, muscles, ${altWords}`,
              ]
            : []),
          `${e.name}: how to do it, muscles worked, alternatives`,
          `${e.name}: how to do it and muscles worked`,
          `${e.name}: how to do it`,
          e.name,
        ],
        SEO_TITLE_MAX,
      ),
      description: fit(
        [
          `${what}. Step-by-step setup and cues, a 3D demo, common mistakes and ${altWords || "the muscles it trains"}.${kit}`,
          `${what}. Step-by-step setup and cues, a 3D demo and common mistakes.${kit}`,
          `${what}. Step-by-step setup and cues and a 3D demo.`,
        ],
        SEO_DESCRIPTION_MAX,
      ),
    };
  }
  const start = hasStartTable(e) ? ", starting weights" : "";
  return {
    title: fit(
      [
        `${e.name}: how to do it, muscles worked, sets and reps`,
        `${e.name}: how to do it, muscles, sets and reps`,
        `${e.name}: how to, muscles, sets and reps`,
        `${e.name}: how to do it and muscles worked`,
        `${e.name}: how to do it`,
        e.name,
      ],
      SEO_TITLE_MAX,
    ),
    description: fit(
      [
        `${what}. Step-by-step form, a 3D demo, ${guide.mistakes.length} common mistakes, sets and reps${start} and ${altWords || "variations"}.${kit}`,
        `${what}. Step-by-step form, a 3D demo, common mistakes, sets and reps${start} and alternatives.`,
        `${what}. Step-by-step form, a 3D demo, common mistakes, sets and reps.`,
      ],
      SEO_DESCRIPTION_MAX,
    ),
  };
}

/** Title and description of /exercises/<id>/alternatives/: the count and the best three by name, which is what
 * someone searching "<lift> alternative" wants to see before they click. */
export function alternativesMeta(e: Exercise): { title: string; description: string } {
  const alts = alternativesTo(e.id);
  const n = alts.length;
  const top = alts.slice(0, 3).map((a) => a.name.toLowerCase());
  const noKit = alts.some((a) => !a.needs.length);
  return {
    title: fit(
      [
        `${n} best ${lower(e)} alternatives (home and gym)`,
        `${n} best ${lower(e)} alternatives`,
        `${n} ${lower(e)} alternatives`,
        `${e.name} alternatives`,
      ],
      SEO_TITLE_MAX,
    ),
    description: fit(
      [
        `Can't do the ${lower(e)}? Try the ${list(top)}. ${n} swaps for the ${muscles(e)}, best match first${noKit ? ", including no-equipment options" : ""}.`,
        `Can't do the ${lower(e)}? Try the ${list(top)}. ${n} swaps for the ${muscles(e)}, best match first.`,
        `${n} ${lower(e)} alternatives for the ${muscles(e)}, best match first: the ${list(top.slice(0, 2))} and more.`,
        `${n} ${lower(e)} alternatives that train the ${muscles(e)}, best match first.`,
      ],
      SEO_DESCRIPTION_MAX,
    ),
  };
}

/**
 * Questions for an exercise page without a written guide, answered from the exercise's own data, so the ~950 pages
 * answer what people search ("what muscles does … work", "… without equipment", "… alternative") and carry FAQ data.
 */
export function exerciseFaq(e: Exercise): [string, string][] {
  const l = lower(e);
  const faq: [string, string][] = [
    [
      `What muscles does the ${l} work?`,
      `Mainly the ${muscles(e)}${e.secondary.length ? `, with help from the ${list(e.secondary.map((m) => MUSCLE_NAME[m].toLowerCase()))}` : ""}. It's ${e.compound ? "a compound exercise: several joints move, so it trains more than one muscle at once" : "an isolation exercise: one joint moves, so it targets one muscle group"}.`,
    ],
    [
      `What equipment do you need for the ${l}?`,
      e.needs.length
        ? `${list(e.needs.map((n) => EQUIPMENT_NAME[n].toLowerCase())).replace(/^./, (c) => c.toUpperCase())}. If you don't have ${e.needs.length > 1 ? "them" : "it"}, the alternatives below train the same muscles with other kit.`
        : "None: you can do it anywhere with your own body weight.",
    ],
  ];
  const alts = alternativesTo(e.id, 3);
  if (alts.length)
    faq.push([
      `What can I do instead of the ${l}?`,
      `The ${list(alts.map((a) => a.name.toLowerCase()))} train the same main muscles. The alternatives page lists every swap, best match first.`,
    ]);
  return faq;
}

/** Articles that link to this exercise's page, newest first: the reading that goes with it. */
export function articlesLinking(path: string, max = 3): Article[] {
  return ARTICLES.filter((a) => JSON.stringify(a.body).includes(`(${path})`))
    .sort((x, y) => (y.updated ?? y.date).localeCompare(x.updated ?? x.date))
    .slice(0, max);
}
