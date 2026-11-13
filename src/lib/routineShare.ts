import { EXERCISE_BY_ID } from "./exercises";
import { t } from "./i18n";
import { clampSets, cleanParts, MAX_ITEMS, NAME_MAX } from "./routines";
import { APP_PATH, SITE_URL } from "./site";
import { linksOf, withLinks } from "./superset";
import type { Routine, RoutineItem, RoutinePart } from "./types";

// Sharing a routine (Melvin, 2026-11-11: "share routines with other users"). The routine travels in
// the link itself, like a remix link: its name, the exercises in order, set counts and supersets.
// No weights, reps, notes or anything personal, because the other lifter's own progression fills
// those in. Nothing is uploaded, so it works signed out and offline, on every platform.

const SHARE_VERSION = "r1";
/**
 * The last part of a routine from a rehab program a physio assigned (physio support, 2026-11-13). Older apps read it
 * as an exercise they don't know and drop it, so the routine still opens there as a plain one.
 */
const REHAB_MARK = "rehab";
/**
 * Workouts with parts (stage 3): a warm-up or cool-down travels as `w` or `d`, with its stretches after a colon
 * (`w:cat-cow,leg-swings`). They sit after the exercises and before the rehab mark. Older apps read them as exercises
 * they don't know and drop them, so the routine still opens there with its exercises, which is why the version stays r1.
 */
const PART_MARK: Record<RoutinePart["kind"], string> = { warm: "w", cool: "d" };

function partsOut(parts: readonly RoutinePart[] | undefined): string[] {
  return (cleanParts(parts) ?? []).map((p) => PART_MARK[p.kind] + (p.stretches?.length ? `:${p.stretches.join(",")}` : ""));
}

function partsIn(segments: readonly string[]): RoutinePart[] | undefined {
  const found: RoutinePart[] = [];
  for (const seg of segments) {
    const [mark, list = ""] = seg.split(":");
    const kind = mark === PART_MARK.warm ? "warm" : mark === PART_MARK.cool ? "cool" : null;
    if (!kind || found.some((p) => p.kind === kind)) continue;
    const stretches = list.split(",").filter(Boolean);
    found.push(stretches.length ? { kind, stretches } : { kind });
  }
  return cleanParts(found);
}

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

/**
 * The link code for a routine: `r1~<name>~<exercise>.<sets>[.s]~…[~w[:stretches]][~d[:stretches]][~rehab]`, where `.s`
 * links an exercise to the next.
 */
export function encodeRoutine(r: Pick<Routine, "name" | "items" | "rehab" | "parts">): string {
  const items = r.items.filter((i) => EXERCISE_BY_ID.has(i.exerciseId)).slice(0, MAX_ITEMS);
  const links = linksOf(items);
  const name = nameOut(r.name.trim().slice(0, NAME_MAX));
  const parts = items.map((i, k) => `${i.exerciseId}.${clampSets(i.sets)}${links[k] ? ".s" : ""}`);
  return [SHARE_VERSION, name, ...parts, ...partsOut(r.parts), ...(r.rehab ? [REHAB_MARK] : [])].join("~");
}

/**
 * Reads a routine code. Unknown exercises and bad set counts are dropped (a superset holds only
 * between two exercises that both survive and were next to each other), so a link from a newer app
 * still opens. Null when nothing usable is left.
 */
export function decodeRoutine(code: string): { name: string; items: RoutineItem[]; rehab?: true; parts?: RoutinePart[] } | null {
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
  const rehab = parts.at(-1) === REHAB_MARK;
  const routineParts = partsIn(parts.filter((p) => !p.includes(".")));
  return {
    name: name || t("rt.defaultName"),
    items,
    ...(rehab ? { rehab } : {}),
    ...(routineParts ? { parts: routineParts } : {}),
  };
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
