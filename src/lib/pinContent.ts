// What each Pinterest pin and short clip says (docs/decisions/pinterest.md). One exercise makes one tall pin image and one
// 15-second vertical clip, both showing the exercise's 3D figure, three of its own form cues and its page's address.
// The words are the exercise's English setup and cues from exercises.ts (our own text, Canadian English), so a pin
// never says anything the exercise page doesn't. Most exercises have two cues; the third is then the fix for its first
// common mistake (formFaults.ts), the same line the page shows under "Common mistakes". Shared by the build-only studio page that draws them
// (PinStudio.tsx, scripts/pins.mjs) and the server that queues and posts them (src/server/pins.ts).
import { faultWords } from "@/locales/site/fromApp";

import { ENGLISH_ROWS, EXERCISE_BY_ID } from "./exercises";
import { faultIdsFor } from "./formFaults";
import { COMMON, STAPLE } from "./pickWeights";
import { SITE_URL } from "./site";
import type { Muscle } from "./types";

/** Pinterest's limits: a title up to 100 characters, a description and alt text up to 500 (we keep well under). */
export const PIN_LIMITS = { title: 100, description: 500, alt: 500 } as const;

/** The pin image (2:3, the shape Pinterest shows best) and the clip (9:16, 15 s). */
export const PIN_SIZE = { width: 1000, height: 1500 } as const;
export const CLIP_SIZE = { width: 1080, height: 1920, seconds: 15, fps: 30 } as const;

/** When each cue appears in the clip, and when the address card comes up (seconds). */
export const CLIP_TIMES = { cues: [1.2, 4.2, 7.2], end: 11 } as const;

export type PinBoard = "Chest" | "Back" | "Shoulders" | "Arms" | "Core" | "Glutes" | "Legs" | "Cardio";

/** The board names and their one-line descriptions, made on Pinterest the first time a pin needs one. */
export const BOARDS: Record<PinBoard, { name: string; description: string }> = {
  Chest: { name: "Chest exercises", description: "Chest exercises with 3D demos and three form cues each, from Liftsmith." },
  Back: { name: "Back exercises", description: "Back exercises with 3D demos and three form cues each, from Liftsmith." },
  Shoulders: { name: "Shoulder exercises", description: "Shoulder exercises with 3D demos and three form cues each, from Liftsmith." },
  Arms: { name: "Arm exercises", description: "Biceps, triceps and forearm exercises with 3D demos and form cues, from Liftsmith." },
  Core: { name: "Core exercises", description: "Ab and core exercises with 3D demos and three form cues each, from Liftsmith." },
  Glutes: { name: "Glute exercises", description: "Glute exercises with 3D demos and three form cues each, from Liftsmith." },
  Legs: { name: "Leg exercises", description: "Quad, hamstring and calf exercises with 3D demos and form cues, from Liftsmith." },
  Cardio: { name: "Cardio and conditioning", description: "Cardio and conditioning moves with 3D demos and form cues, from Liftsmith." },
};

const FAMILY: Record<Muscle, PinBoard> = {
  chest: "Chest",
  frontDelts: "Shoulders",
  sideDelts: "Shoulders",
  rearDelts: "Shoulders",
  biceps: "Arms",
  triceps: "Arms",
  forearms: "Arms",
  abs: "Core",
  obliques: "Core",
  traps: "Back",
  upperBack: "Back",
  lats: "Back",
  lowerBack: "Back",
  glutes: "Glutes",
  quads: "Legs",
  hamstrings: "Legs",
  adductors: "Legs",
  calves: "Legs",
};

export interface PinContent {
  exercise: string;
  name: string;
  /** "Barbell bench press: 3 form cues". */
  title: string;
  /** Exactly three of the exercise's own cues. */
  cues: [string, string, string];
  setup: string;
  description: string;
  alt: string;
  /** The exercise page with UTM tags, so the admin's Traffic tab counts what the pins bring. */
  link: string;
  /** The address as printed on the pin, short and without tags. */
  shown: string;
  board: PinBoard;
}

const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);
const stop = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`);

const fixFor = (id: string) => faultWords("en", [id])[0]?.fix;

/** Three cues: the exercise's own, topped up with the fixes for its common mistakes. */
export function threeCues(id: string): [string, string, string] | null {
  const row = ENGLISH_ROWS.find((r) => r.id === id);
  const ex = EXERCISE_BY_ID.get(id);
  if (!row || !ex) return null;
  const list = row.cues.slice(0, 3).map((c) => c.replace(/\.$/, ""));
  for (const f of faultIdsFor(ex)) {
    if (list.length >= 3) break;
    const fix = fixFor(f)?.replace(/\.$/, "");
    if (fix && !list.some((c) => c.toLowerCase() === fix.toLowerCase())) list.push(fix);
  }
  return list.length >= 3 ? [list[0]!, list[1]!, list[2]!] : null;
}

/** The pin for an exercise, or null when it can't have three cues (nothing worth a pin). */
export function pinContent(id: string, kind: "image" | "video" = "image"): PinContent | null {
  const row = ENGLISH_ROWS.find((r) => r.id === id);
  const ex = EXERCISE_BY_ID.get(id);
  const cues = threeCues(id);
  if (!row || !ex || !cues) return null;
  const board: PinBoard = ex.pattern === "cardio" ? "Cardio" : FAMILY[ex.primary[0] ?? "abs"];
  const title = clip(`${row.name}: 3 form cues`, PIN_LIMITS.title);
  const description = clip(
    `${row.name}, step by step. ${stop(row.setup)} ${cues.map((c, i) => `${i + 1}. ${stop(c)}`).join(" ")} ` +
      "See it from every angle in the free 3D demo, with the muscles it works and the common mistakes, on Liftsmith.",
    PIN_LIMITS.description,
  );
  const alt = clip(`3D figure demonstrating the exercise ${row.name}, with three form cues. ${cues.map(stop).join(" ")}`, PIN_LIMITS.alt);
  const page = `/exercises/${id}/`;
  return {
    exercise: id,
    name: row.name,
    title,
    cues,
    setup: row.setup,
    description,
    alt,
    link: `${SITE_URL}${page}?utm_source=pinterest&utm_medium=social&utm_campaign=${kind === "video" ? "pin-clip" : "pin"}`,
    shown: `${SITE_URL.replace(/^https?:\/\/(www\.)?/, "")}${page}`.replace(/\/$/, ""),
    board,
  };
}

/** Rank for the order pins are made: well-known lifts first (people search for those), then common variations, then the rest. */
const rank = (id: string) => (STAPLE.has(id) ? 0 : COMMON.has(id) ? 1 : 2);

/** Every exercise that can have a pin, in the order they're made. `drawn` says which have a 3D motion of their own. */
export function pinOrder(drawn: (id: string) => boolean): string[] {
  return ENGLISH_ROWS.map((r, i) => ({ id: r.id, i }))
    .filter(({ id }) => drawn(id) && pinContent(id) !== null)
    .sort((a, b) => rank(a.id) - rank(b.id) || a.i - b.i)
    .map(({ id }) => id);
}
