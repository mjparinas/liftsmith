import type { PlanItem } from "./generator";

// Supersets: two or more exercises done back to back, one set of each, then the rest.
// Exercises in a superset sit next to each other in the plan and share `group`.

/** Seconds to move from one exercise to the next inside a round. */
export const SWITCH_REST = 15;

type Linkable = { exerciseId: string; group?: string };
type Item = Pick<PlanItem, "exerciseId" | "sets" | "restSec"> & Linkable;

/** First and last index (inclusive) of the superset that item i is in, or [i, i] on its own. */
export function groupRange(items: readonly Linkable[], i: number): [number, number] {
  const g = items[i]?.group;
  if (!g) return [i, i];
  let s = i;
  let e = i;
  while (s > 0 && items[s - 1]!.group === g) s--;
  while (e < items.length - 1 && items[e + 1]!.group === g) e++;
  return [s, e];
}

/** True when item i and item i + 1 are in the same superset. */
export function linkedToNext(items: readonly Linkable[], i: number): boolean {
  return !!items[i]?.group && items[i].group === items[i + 1]?.group;
}

/** Rebuilds the groups from which neighbours are linked. A group's id is its first exercise. */
export function withLinks<T extends Linkable>(items: readonly T[], links: readonly boolean[]): T[] {
  const out: T[] = [];
  let id: string | undefined;
  items.forEach((it, i) => {
    const joinsPrev = i > 0 && !!links[i - 1];
    const joinsNext = i < items.length - 1 && !!links[i];
    if (!joinsPrev) id = joinsNext ? `ss-${it.exerciseId}` : undefined;
    const { group: _old, ...rest } = it; // eslint-disable-line @typescript-eslint/no-unused-vars
    out.push((id ? { ...rest, group: id } : rest) as T);
  });
  return out;
}

/** The links between neighbours (link[i] joins i and i + 1). */
export function linksOf(items: readonly Linkable[]): boolean[] {
  return items.slice(0, -1).map((_, i) => linkedToNext(items, i));
}

/** Links item i with the next one, or splits them if they're already linked. */
export function toggleLink<T extends Linkable>(items: readonly T[], i: number): T[] {
  if (i < 0 || i >= items.length - 1) return [...items];
  const links = linksOf(items);
  links[i] = !links[i];
  return withLinks(items, links);
}

/**
 * Re-applies the lifter's superset choices to a rebuilt plan, where both exercises are still
 * neighbours: "a>b" links them, and "!a>b" splits a pair the plan linked itself (a routine, or
 * "Same as last time"). Other pairs keep the plan's own links.
 */
export function applyLinks<T extends Linkable>(items: readonly T[], links: readonly string[]): T[] {
  if (!links.length) return [...items];
  const want = new Set(links);
  const l = linksOf(items).map((on, i) => {
    const key = `${items[i]!.exerciseId}>${items[i + 1]!.exerciseId}`;
    return want.has(key) || (on && !want.has(`!${key}`));
  });
  return withLinks(items, l);
}

/** Rest after a full round of a superset: the longest rest any of its exercises asks for. */
export function roundRest(items: readonly Item[], i: number): number {
  const [s, e] = groupRange(items, i);
  return Math.max(...items.slice(s, e + 1).map((x) => x.restSec));
}

/**
 * Where to go after a working set of item `index` is logged, and how long to rest first.
 * `done(i)` is the working sets of item i done so far, counting the one just logged.
 * Inside a superset it moves to the next exercise that still has sets (a short switch), and after
 * the last one of a round it rests the full time and starts the next round. When every exercise in
 * the superset is done it moves past the superset.
 */
export function afterSet(
  items: readonly Item[],
  index: number,
  done: (i: number) => number,
): { index: number; rest: number; finished: boolean } {
  const item = items[index]!;
  const [s, e] = groupRange(items, index);
  if (s === e) {
    const finished = done(index) >= item.sets;
    return { index: finished ? index + 1 : index, rest: item.restSec, finished };
  }
  const left = (i: number) => done(i) < items[i]!.sets;
  const order = [...Array.from({ length: e - index }, (_, k) => index + 1 + k), ...Array.from({ length: index - s + 1 }, (_, k) => s + k)];
  const next = order.find(left);
  const finished = done(index) >= item.sets;
  if (next === undefined) return { index: e + 1, rest: roundRest(items, index), finished };
  // Still inside this round: switch straight to the next exercise.
  if (next > index) return { index: next, rest: SWITCH_REST, finished };
  return { index: next, rest: next === index ? item.restSec : roundRest(items, index), finished };
}

/** Letters for each superset in order (A, B, ...), keyed by group id. */
export function groupLetters(items: readonly Item[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const it of items) if (it.group && !out.has(it.group)) out.set(it.group, String.fromCharCode(65 + out.size));
  return out;
}

/** "Superset A · 1 of 2" for item i, or null when it's on its own. */
export function supersetLabel(items: readonly Item[], i: number): string | null {
  const [s, e] = groupRange(items, i);
  if (s === e) return null;
  return `Superset ${groupLetters(items).get(items[i]!.group!)} · ${i - s + 1} of ${e - s + 1}`;
}

/**
 * Seconds for a plan with supersets: within a superset the exercises share one rest per round, with
 * a short switch between them. `alone(i)` is item i's time on its own (generator `itemSeconds`).
 */
export function groupedSeconds(items: readonly Item[], alone: (i: number) => number): number {
  let total = 0;
  for (let i = 0; i < items.length;) {
    const [s, e] = groupRange(items, i);
    if (s === e) {
      total += alone(i) + (i ? items[i]!.restSec : 0);
      i++;
      continue;
    }
    const members = items.slice(s, e + 1);
    const rounds = Math.max(...members.map((m) => m.sets));
    const sets = members.reduce((n, m) => n + m.sets, 0);
    const switches = sets - 1 - (rounds - 1);
    const rest = roundRest(items, s);
    // Each exercise's own time without its between-set rests, plus the shared rests.
    for (let k = s; k <= e; k++) total += alone(k) - (items[k]!.sets - 1) * items[k]!.restSec;
    total += switches * SWITCH_REST + (rounds - 1) * rest + (s ? rest : 0);
    i = e + 1;
  }
  return total;
}
