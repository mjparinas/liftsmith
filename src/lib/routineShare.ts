import { EXERCISE_BY_ID } from "./exercises";
import { t } from "./i18n";
import { PHASES, REHAB_PROGRAMS } from "./rehab";
import { clampSets, cleanCue, cleanParts, cleanRange, cleanReps, MAX_ITEMS, NAME_MAX } from "./routines";
import { APP_PATH, SITE_URL } from "./site";
import { linksOf, withLinks } from "./superset";
import { BODY_PARTS, type BodyPart, type RehabPlan, type RehabProtocolId, type Routine, type RoutineItem, type RoutinePart } from "./types";

// Sharing a routine (Melvin, 2026-11-11: "share routines with other users"). The routine travels in
// the link itself, like a remix link: its name, the exercises in order, set counts and supersets.
// No weights or anything personal, because the other lifter's own progression fills those in.
// A rehab program may also carry a physio's reps or seconds and a short cue (2026-11-22); older apps
// keep the exercise and the sets and drop the extra pieces. Nothing is uploaded, so it works signed
// out and offline, on every platform.

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
/**
 * Cardio after the lifting (stage 5) travels as `c`, with its exercise and minutes after colons (`c:rowing-machine:15`,
 * either may be empty). No dot, so older apps drop it like the other part marks.
 */
const PART_MARK: Record<RoutinePart["kind"], string> = { warm: "w", cool: "d", cardio: "c" };
/**
 * A rehab program's injury area and times a week (2026-11-15) travel as `h:<part>:<times>` just before the rehab mark
 * (either may be empty). No dot, so older apps drop it like the part marks and still read the rehab mark last.
 */
const REHAB_INFO = "h";
/**
 * Rehab protocols (2026-11-17): the protocol and phase follow in the same segment, `h:<part>:<times>:<protocol>:<phase>`,
 * with `:a` at the end when the physio lets the lifter move phases on their own. Older apps read only the first two.
 */
const SELF_MARK = "a";

function rehabOut(r: Pick<Routine, "rehab" | "rehabPart" | "perWeek" | "rehabPlan">): string[] {
  if (!r.rehab) return [];
  const w = cleanTimes(r.perWeek);
  const plan = cleanPlan(r.rehabPlan);
  const tail = plan ? `:${plan.id}:${plan.phase}${plan.self ? `:${SELF_MARK}` : ""}` : "";
  return [...(r.rehabPart || w || plan ? [`${REHAB_INFO}:${r.rehabPart ?? ""}:${w ?? ""}${tail}`] : []), REHAB_MARK];
}

/** A protocol and phase that the app knows (rehab.ts ids, phases 1 to 3), without `since`, which stays on the phone. */
export function cleanPlan(p: Partial<RehabPlan> | undefined): RehabPlan | undefined {
  if (!p || !REHAB_PROGRAMS.some((x) => x.id === p.id)) return undefined;
  const phase = Number(p.phase);
  if (!Number.isInteger(phase) || phase < 1 || phase > PHASES) return undefined;
  return { id: p.id!, phase, ...(p.self ? { self: true as const } : {}) };
}

/** Times a week, 1 to 7, or undefined. */
export function cleanTimes(n: unknown): number | undefined {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 7 ? n : undefined;
}

function rehabIn(segments: readonly string[]): { rehabPart?: BodyPart; perWeek?: number; rehabPlan?: RehabPlan } {
  const seg = segments.find((s) => s.startsWith(`${REHAB_INFO}:`));
  if (!seg) return {};
  const [, part = "", times = "", protocol = "", phase = "", self = ""] = seg.split(":");
  const w = cleanTimes(Number(times));
  const plan = protocol
    ? cleanPlan({ id: protocol as RehabProtocolId, phase: Number(phase), ...(self === SELF_MARK ? { self: true } : {}) })
    : undefined;
  return {
    ...((BODY_PARTS as readonly string[]).includes(part) ? { rehabPart: part as BodyPart } : {}),
    ...(times && w ? { perWeek: w } : {}),
    ...(plan ? { rehabPlan: plan } : {}),
  };
}

function partsOut(parts: readonly RoutinePart[] | undefined): string[] {
  return (cleanParts(parts) ?? []).map((p) =>
    p.kind === "cardio"
      ? p.exerciseId || p.minutes
        ? `${PART_MARK.cardio}:${p.exerciseId ?? ""}:${p.minutes ?? ""}`
        : PART_MARK.cardio
      : PART_MARK[p.kind] + (p.stretches?.length ? `:${p.stretches.join(",")}` : ""),
  );
}

function partsIn(segments: readonly string[]): RoutinePart[] | undefined {
  const found: RoutinePart[] = [];
  for (const seg of segments) {
    const [mark, list = "", extra = ""] = seg.split(":");
    if (mark === PART_MARK.cardio) {
      if (found.some((p) => p.kind === "cardio")) continue;
      const minutes = Number(extra);
      found.push({ kind: "cardio", ...(list ? { exerciseId: list } : {}), ...(extra && Number.isFinite(minutes) ? { minutes } : {}) });
      continue;
    }
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
/**
 * An exercise segment: `id.sets`, `.s` when linked to the next, `.rN` for prescribed reps or seconds or `.rN-M` for a
 * coach's rep range (2026-11-26; older apps don't read it and keep their own range), `.c` plus a cue.
 */
function itemOut(i: RoutineItem, link: boolean): string {
  const range = i.repsTo !== undefined ? cleanRange(i.reps, i.repsTo) : undefined;
  const reps = range ? `${range[0]}-${range[1]}` : cleanReps(i.reps);
  const cue = cleanCue(i.cue);
  // `.s` stays the third piece when there is no prescription, so an older app still sees the superset.
  // With a prescription it follows `.s` (`id.sets.s.rN`) or stands in the third place (`id.sets.rN`).
  let seg = `${i.exerciseId}.${clampSets(i.sets)}`;
  if (link) seg += ".s";
  if (reps) seg += `.r${reps}`;
  if (cue) {
    const enc = nameOut(cue);
    if (enc) seg += `.c${enc}`;
  }
  return seg;
}

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
 * The link code for a routine: `r1~<name>~<exercise>.<sets>[.s][.rN][.c<cue>]~…[~w[:stretches]][~c[:exercise:minutes]][~d[:stretches]][~h:part:times[:protocol:phase[:a]]][~rehab]`,
 * where `.s` links an exercise to the next, `.rN` is a physio's reps or seconds, and `.c` is a short cue older apps drop.
 */
export function encodeRoutine(r: Pick<Routine, "name" | "items" | "rehab" | "parts" | "rehabPart" | "perWeek" | "rehabPlan">): string {
  const items = r.items.filter((i) => EXERCISE_BY_ID.has(i.exerciseId)).slice(0, MAX_ITEMS);
  const links = linksOf(items);
  const name = nameOut(r.name.trim().slice(0, NAME_MAX));
  const parts = items.map((i, k) => itemOut(i, !!links[k]));
  return [SHARE_VERSION, name, ...parts, ...partsOut(r.parts), ...rehabOut(r)].join("~");
}

/**
 * Reads a routine code. Unknown exercises and bad set counts are dropped (a superset holds only
 * between two exercises that both survive and were next to each other), so a link from a newer app
 * still opens. Null when nothing usable is left.
 */
export function decodeRoutine(code: string): {
  name: string;
  items: RoutineItem[];
  rehab?: true;
  parts?: RoutinePart[];
  rehabPart?: BodyPart;
  perWeek?: number;
  rehabPlan?: RehabPlan;
} | null {
  // Some apps encode the fragment again; the separators are plain, so decode once if they're missing.
  const raw = code.includes("~") ? code : safeDecode(code);
  const [v, rawName = "", ...parts] = raw.split("~");
  if (v !== SHARE_VERSION) return null;
  const kept: { exerciseId: string; sets: number; reps?: number; repsTo?: number; cue?: string; at: number; link: boolean }[] = [];
  parts.slice(0, MAX_ITEMS).forEach((p, at) => {
    const [exerciseId = "", s, ...rest] = p.split(".");
    const sets = Number(s);
    if (!EXERCISE_BY_ID.has(exerciseId) || !Number.isInteger(sets) || sets < 1 || sets > 10) return;
    let link = false;
    let reps: number | undefined;
    let repsTo: number | undefined;
    let cue: string | undefined;
    for (const bit of rest) {
      const range = /^r(\d+)-(\d+)$/.exec(bit);
      if (bit === "s") link = true;
      else if (/^r\d+$/.test(bit)) reps = cleanReps(Number(bit.slice(1)));
      else if (range) [reps, repsTo] = cleanRange(Number(range[1]), Number(range[2])) ?? [undefined, undefined];
      else if (bit.startsWith("c") && bit.length > 1) cue = cleanCue(nameIn(bit.slice(1)));
    }
    kept.push({ exerciseId, sets, at, link, ...(reps ? { reps } : {}), ...(repsTo ? { repsTo } : {}), ...(cue ? { cue } : {}) });
  });
  if (!kept.length) return null;
  const items = withLinks(
    kept.map(({ exerciseId, sets, reps, repsTo, cue }) => ({
      exerciseId,
      sets,
      ...(reps ? { reps } : {}),
      ...(repsTo ? { repsTo } : {}),
      ...(cue ? { cue } : {}),
    })),
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
    ...(rehab ? { rehab, ...rehabIn(parts) } : {}),
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
  return (
    a.every(
      (x, i) =>
        x.exerciseId === b[i]!.exerciseId &&
        x.sets === b[i]!.sets &&
        x.reps === b[i]!.reps &&
        x.repsTo === b[i]!.repsTo &&
        (x.cue ?? "") === (b[i]!.cue ?? ""),
    ) && la.every((on, i) => on === lb[i])
  );
}
