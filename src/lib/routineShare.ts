import { EXERCISE_BY_ID } from "./exercises";
import { t } from "./i18n";
import { clampSets, MAX_ITEMS, NAME_MAX } from "./routines";
import { APP_PATH, SITE_URL } from "./site";
import { linksOf, withLinks } from "./superset";
import type { Routine, RoutineItem } from "./types";

// Sharing a routine (Melvin, 2026-11-11: "share routines with other users"). The routine travels in
// the link itself, like a remix link: its name, the exercises in order, set counts and supersets.
// No weights, reps, notes or anything personal, because the other lifter's own progression fills
// those in. Nothing is uploaded, so it works signed out and offline, on every platform.

const SHARE_VERSION = "r1";

const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

// The name goes in as base64url of its UTF-8, so no app that encodes the link again can change it.
function nameOut(name: string): string {
  let bin = "";
  for (const b of new TextEncoder().encode(name)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function nameIn(code: string): string {
  try {
    const bin = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
    return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch {
    return "";
  }
}

/** The link code for a routine: `r1~<name>~<exercise>.<sets>[.s]~…`, where `.s` links it to the next. */
export function encodeRoutine(r: Pick<Routine, "name" | "items">): string {
  const items = r.items.filter((i) => EXERCISE_BY_ID.has(i.exerciseId)).slice(0, MAX_ITEMS);
  const links = linksOf(items);
  const name = nameOut(r.name.trim().slice(0, NAME_MAX));
  const parts = items.map((i, k) => `${i.exerciseId}.${clampSets(i.sets)}${links[k] ? ".s" : ""}`);
  return [SHARE_VERSION, name, ...parts].join("~");
}

/**
 * Reads a routine code. Unknown exercises and bad set counts are dropped (a superset holds only
 * between two exercises that both survive and were next to each other), so a link from a newer app
 * still opens. Null when nothing usable is left.
 */
export function decodeRoutine(code: string): { name: string; items: RoutineItem[] } | null {
  // Some apps encode the fragment again; the separators are plain, so decode once if they're missing.
  const raw = code.includes("~") ? code : safeDecode(code);
  const [v, rawName = "", ...parts] = raw.split("~");
  if (v !== SHARE_VERSION) return null;
  const kept: { exerciseId: string; sets: number; at: number; link: boolean }[] = [];
  parts.slice(0, MAX_ITEMS).forEach((p, at) => {
    const [exerciseId = "", s, flag] = p.split(".");
    const sets = Number(s);
    if (!EXERCISE_BY_ID.has(exerciseId) || !Number.isInteger(sets) || sets < 1 || sets > 10) return;
    kept.push({ exerciseId, sets, at, link: flag === "s" });
  });
  if (!kept.length) return null;
  const items = withLinks(
    kept.map(({ exerciseId, sets }) => ({ exerciseId, sets })),
    kept.slice(0, -1).map((k, i) => k.link && kept[i + 1]!.at === k.at + 1),
  );
  // Control characters never belong in a name; the rest is shown as plain text.
  const name = nameIn(rawName)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, NAME_MAX);
  return { name: name || t("rt.defaultName"), items };
}

export function routineUrl(code: string, base = SITE_URL): string {
  return `${base.replace(/\/$/, "")}${APP_PATH}#/routine/${code}`;
}

/** The code in a pasted routine link (or a bare code), or null when it isn't one. */
export function codeFromLink(text: string): string | null {
  const s = text.trim();
  const m = /#\/routine\/([^\s]+)/.exec(s);
  const code = m ? m[1]! : s;
  return decodeRoutine(code) ? code : null;
}

/** True when a saved routine has the same exercises, sets and supersets in the same order. */
export function sameItems(a: readonly RoutineItem[], b: readonly RoutineItem[]): boolean {
  if (a.length !== b.length) return false;
  const la = linksOf(a);
  const lb = linksOf(b);
  return a.every((x, i) => x.exerciseId === b[i]!.exerciseId && x.sets === b[i]!.sets) && la.every((on, i) => on === lb[i]);
}
