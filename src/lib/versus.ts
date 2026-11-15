// Exercise comparison pages ("back squat vs front squat", /exercises/vs/<a>-vs-<b>/; docs/decisions/public-pages-and-seo.md
// "Exercise comparisons"). A pair only gets a page when one of its lifts has a full guide (EXERCISE_GUIDES) that names
// the other as a variation, with a line on when to pick it, so every page has written advice of its own as well as the
// facts below. Everything else on the page is read from the exercise library the app plans with: the muscles each
// works, the equipment, the movement, where each ranks among the other's swaps, and starting weights.
import { EXERCISE_GUIDES } from "@/content/exerciseGuides";

import { EXERCISE_BY_ID } from "./exercises";
import { alternatives } from "./generator";
import type { Exercise, Muscle } from "./types";

export interface VsPair {
  /** The two exercise ids, in the order the page names them (alphabetical, so a pair has one address). */
  a: string;
  b: string;
  slug: string;
  /** When to pick each lift, by id, from the other lift's guide (English). Missing when only one guide names the other. */
  pick: Partial<Record<string, string>>;
}

export const vsSlug = (a: string, b: string) => `${a}-vs-${b}`;
export const vsPath = (p: Pick<VsPair, "slug">) => `/exercises/vs/${p.slug}/`;

let cache: VsPair[] | null = null;

/** Every comparison page, each pair once. */
export function vsPairs(): VsPair[] {
  if (cache) return cache;
  const byKey = new Map<string, VsPair>();
  for (const [id, guide] of Object.entries(EXERCISE_GUIDES)) {
    const from = EXERCISE_BY_ID.get(id);
    if (!from || from.cardio) continue;
    for (const [other, note] of guide.variations) {
      const to = EXERCISE_BY_ID.get(other);
      if (!to || to.cardio || other === id) continue;
      const [a, b] = [id, other].sort() as [string, string];
      const slug = vsSlug(a, b);
      const pair = byKey.get(slug) ?? { a, b, slug, pick: {} };
      pair.pick[other] = note;
      byKey.set(slug, pair);
    }
  }
  cache = [...byKey.values()].sort((x, y) => x.slug.localeCompare(y.slug));
  return cache;
}

export const vsBySlug = (slug: string) => vsPairs().find((p) => p.slug === slug) ?? null;

/** The comparisons a lift is in, for links from its own page. */
export const vsFor = (id: string) => vsPairs().filter((p) => p.a === id || p.b === id);

/** Where `b` ranks among `a`'s swaps for any gym (1 is the closest match), and how many swaps there are. */
export function swapRank(a: string, b: string): { rank: number; of: number } | null {
  const list = alternatives(a, null);
  const i = list.findIndex((x) => x.id === b);
  return i < 0 ? null : { rank: i + 1, of: list.length };
}

export interface VsFacts {
  a: Exercise;
  b: Exercise;
  /** Main muscles both work, then the ones only one of them works as a main mover. */
  shared: Muscle[];
  onlyA: Muscle[];
  onlyB: Muscle[];
  samePattern: boolean;
  sameEquipment: boolean;
  /** How close a swap each is for the other. */
  bForA: { rank: number; of: number } | null;
  aForB: { rank: number; of: number } | null;
}

export function vsFacts(p: VsPair): VsFacts {
  const a = EXERCISE_BY_ID.get(p.a)!;
  const b = EXERCISE_BY_ID.get(p.b)!;
  const shared = a.primary.filter((m) => b.primary.includes(m));
  return {
    a,
    b,
    shared,
    onlyA: a.primary.filter((m) => !b.primary.includes(m)),
    onlyB: b.primary.filter((m) => !a.primary.includes(m)),
    samePattern: a.pattern === b.pattern,
    sameEquipment: a.needs.length === b.needs.length && a.needs.every((n) => b.needs.includes(n)),
    bForA: swapRank(a.id, b.id),
    aForB: swapRank(b.id, a.id),
  };
}
