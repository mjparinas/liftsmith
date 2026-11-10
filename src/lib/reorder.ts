import { linkedToNext, withLinks } from "./superset";

// Drag to reorder (polish pass, Melvin 2026-11-10: "build it all"). Moving an exercise takes it out of
// any superset it was in (its old partners stay linked to each other), and dropping it between two
// linked exercises splits them, because a superset's exercises have to sit next to each other.

type Linkable = { exerciseId: string; group?: string };

/** Moves item `from` to position `to` (both indexes into `items`), keeping every other superset link. */
export function moveItem<T extends Linkable>(items: readonly T[], from: number, to: number): T[] {
  const n = items.length;
  if (from === to || from < 0 || to < 0 || from >= n || to >= n) return [...items];
  // Which pairs were linked, by object, so the links survive the shuffle.
  const linked = new Set<string>();
  const key = (a: T, b: T) => `${items.indexOf(a)}>${items.indexOf(b)}`;
  for (let i = 0; i < n - 1; i++) if (linkedToNext(items, i)) linked.add(key(items[i]!, items[i + 1]!));
  const moved = items[from]!;
  const rest = items.filter((_, i) => i !== from);
  // Closing the gap: the moved item's neighbours stay linked if both were linked through it.
  const prev = items[from - 1];
  const next = items[from + 1];
  if (prev && next && linked.has(key(prev, moved)) && linked.has(key(moved, next))) linked.add(key(prev, next));
  const out = [...rest.slice(0, to), moved, ...rest.slice(to)];
  const links = out.slice(0, -1).map((a, i) => a !== moved && out[i + 1] !== moved && linked.has(key(a, out[i + 1]!)));
  return withLinks(out, links);
}

/**
 * Re-applies an order chosen on Today to a rebuilt plan, when it holds the same exercises (moving the
 * length slider or a new call can change them; then the plan's own order stands).
 */
export function applyOrder<T extends Linkable>(items: readonly T[], order: readonly string[]): T[] {
  if (!order.length || order.length !== items.length) return [...items];
  const ids = items.map((i) => i.exerciseId);
  if (!order.every((id) => ids.includes(id))) return [...items];
  if (order.every((id, i) => ids[i] === id)) return [...items];
  // Supersets the plan made are kept only where their exercises are still neighbours.
  const sorted = order.map((id) => items.find((i) => i.exerciseId === id)!);
  const links = sorted.slice(0, -1).map((a, i) => !!a.group && a.group === sorted[i + 1]!.group);
  return withLinks(sorted, links);
}
