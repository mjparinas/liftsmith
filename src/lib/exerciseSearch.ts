import { englishName, EXERCISES } from "./exercises";
import { currentTag } from "./i18n";
import { EQUIPMENT_LABEL, MUSCLE_LABEL, type Exercise, type Muscle } from "./types";

// The one exercise browser's filter (Melvin, 2026-11-11: "some kind of search or organization or both"):
// words typed, a muscle or Cardio chip, and only what this gym has. Used by routines, swaps, adding an
// exercise mid-workout and the exercise preferences.

export interface ExerciseQuery {
  /** Words typed; every word must match the name (in the app's language or English), a muscle or equipment. */
  text?: string;
  /** Only exercises with this muscle as a main one; "cardio" for cardio. */
  group?: Muscle | "cardio" | null;
  /** The gym's equipment: when given, only what it can do. */
  equipment?: readonly string[] | null;
  /** Ids to leave out (already in the routine or workout). */
  skip?: readonly string[];
}

/** Lower case with accents taken off, so "presion" finds "presión" and "ecarte" finds "écarté". */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase(currentTag());
}

function haystack(e: Exercise): string {
  return fold(
    [
      e.name,
      englishName(e),
      ...e.primary.map((m) => MUSCLE_LABEL[m]),
      ...e.secondary.map((m) => MUSCLE_LABEL[m]),
      ...e.needs.map((n) => EQUIPMENT_LABEL[n]),
    ].join(" "),
  );
}

/**
 * Exercises matching the query, best first: names that start with what was typed, then main-muscle
 * matches, then the rest, each A to Z in the app's language.
 */
export function searchExercises(q: ExerciseQuery, list: readonly Exercise[] = EXERCISES): Exercise[] {
  const words = fold(q.text ?? "")
    .split(/\s+/)
    .filter(Boolean);
  const have = q.equipment ? new Set(q.equipment) : null;
  const skip = new Set(q.skip ?? []);
  const hits = list.filter((e) => {
    if (skip.has(e.id)) return false;
    if (have && !e.needs.every((n) => have.has(n))) return false;
    if (q.group === "cardio" && !e.cardio) return false;
    if (q.group && q.group !== "cardio" && !e.primary.includes(q.group)) return false;
    if (!words.length) return true;
    const h = haystack(e);
    return words.every((w) => h.includes(w));
  });
  const first = words[0];
  const rank = (e: Exercise) => {
    if (!first) return 0;
    const n = fold(e.name);
    if (n.startsWith(first)) return 0;
    if (n.includes(first)) return 1;
    return 2;
  };
  const tag = currentTag();
  return hits.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, tag));
}
