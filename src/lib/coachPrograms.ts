// Coaches sell programs, on the phone and the web app (server: src/server/coachPrograms.ts; decision record:
// docs/decisions/coach-programs.md). Types, calls, and the one rule about where a paid program can be bought.
import { api, AuthError, readAccount } from "./auth";
import type { Rating, Review } from "./coachReviews";
import { openOutside } from "./connections";
import { isNative } from "./juice";
import { decodeRoutine, encodeRoutine } from "./routineShare";
import type { Routine } from "./types";

export const LEVELS = ["beginner", "intermediate", "advanced", "any"] as const;
export const GOALS = ["strength", "muscle", "fitness", "fatLoss", "sport"] as const;
export type Level = (typeof LEVELS)[number];
export type Goal = (typeof GOALS)[number];
export type Role = "trainer" | "coach" | "physio";

export const PROGRAM_LIMITS = {
  title: 60,
  about: 600,
  days: 7,
  weeks: [1, 16] as const,
  price: [1, 500] as const,
  perCoach: 20,
};

export interface ProgramDay {
  name: string;
  /** Only when the lifter has the program, or it's free. */
  code?: string;
  exercises: number;
  sets: number;
  /** JS getDay() weekdays (0=Sun … 6=Sat) this day runs, when set for season assigns. */
  weekdays?: number[];
}

export interface CoachProgram {
  id: string;
  coachId: string;
  coachName: string;
  role: Role | null;
  title: string;
  about: string;
  level: Level;
  goal: Goal;
  weeks: number;
  days: ProgramDay[];
  price: number;
  currency: string;
  listed: boolean;
  updatedAt: number;
  owned: boolean;
  sales?: number;
}

export interface MinePrograms {
  mine: CoachProgram[];
  owned: CoachProgram[];
  /** The coach's Stripe account takes payments, so a program can have a price. */
  pay: { ready: boolean; currency: string | null };
}

export interface ProgramDraft {
  id?: string;
  title: string;
  about: string;
  level: Level;
  goal: Goal;
  weeks: number;
  /** Routine ids from the coach's own routines, in order. */
  routineIds: string[];
  /** Optional weekdays per routine id index (season programs). */
  weekdays?: number[][];
  price: number;
  listed: boolean;
}

/**
 * Store billing rules (Melvin, 2026-11-15): a coach's program is a digital good, so the Android and iOS apps never sell
 * one, show its price or point to where it's sold. A paid program shows in the apps only once the lifter has it.
 */
export const canBuyHere = () => !isNative();

/** Whether this screen may show a program at all: anything on the web; free or owned ones in the apps. */
export const shownHere = (p: Pick<CoachProgram, "price" | "owned">) => canBuyHere() || p.price === 0 || p.owned;

const token = () => readAccount()?.token;
const mustToken = () => {
  const t = token();
  if (!t) throw new AuthError("signedOut", 401);
  return t;
};
const post = <T>(body: Record<string, unknown>) => api<T>("/api/programs/", { token: mustToken(), body });

/** The server's PROGRAM_REVIEW_LIMITS (programReviews.ts), for the words around the form. */
export const PROGRAM_REVIEW_RULES = { days: 14, shown: 3, text: 500 } as const;

export type ProgramReviewBlock = "notOwner" | "yours" | "teen" | "wait";

/** One program with its ratings: none shown until it has PROGRAM_REVIEW_RULES.shown, except to its coach. */
export interface ProgramPage {
  program: CoachProgram;
  rating?: Rating;
  reviews?: Review[];
  /** For a lifter who has it: their own review and whether they can write one now. */
  mine?: { review: Review | null; can: { ok: true } | { ok: false; why: ProgramReviewBlock; readyAt?: number } } | null;
}

export const loadProgramPage = (id: string) => api<ProgramPage>(`/api/programs/?id=${encodeURIComponent(id)}`, { token: token() });
export const loadProgram = async (id: string) => (await loadProgramPage(id)).program;

export const rateProgram = async (id: string, stars: number, text: string) =>
  (await post<{ review: Review }>({ action: "review", id, stars, text })).review;
export const unrateProgram = async (id: string) => void (await post({ action: "unreview", id }));
/** The program's coach answers a review of it, once ("" removes the reply). */
export const replyToProgramReview = async (review: string, text: string) =>
  (await post<{ reply: string }>({ action: "reply", review, text })).reply;

/** Listed programs; the apps ask for free ones only. */
export async function browse(coach?: string): Promise<CoachProgram[]> {
  const q = new URLSearchParams();
  if (!canBuyHere()) q.set("free", "1");
  if (coach) q.set("coach", coach);
  const s = q.toString();
  return (await api<{ programs: CoachProgram[] }>(`/api/programs/${s ? `?${s}` : ""}`, { token: token() })).programs;
}

export const loadMine = () => api<MinePrograms>("/api/programs/?mine=1", { token: mustToken() });

/** The days as routine codes, from the coach's own saved routines (exercises, sets, supersets and parts; no weights). */
export function draftDays(
  draft: Pick<ProgramDraft, "routineIds" | "weekdays">,
  routines: readonly Routine[],
): { name: string; code: string; weekdays?: number[] }[] {
  return draft.routineIds.flatMap((id, i) => {
    const r = routines.find((x) => x.id === id);
    if (!r || !r.items.length) return [];
    const weekdays = draft.weekdays?.[i];
    return [
      {
        name: r.name.trim().slice(0, 40) || "Day",
        code: encodeRoutine(r),
        ...(weekdays?.length ? { weekdays } : {}),
      },
    ];
  });
}

/** What the server keeps from a draft (the routine ids become days). */
const details = (d: ProgramDraft) => ({
  id: d.id,
  title: d.title,
  about: d.about,
  level: d.level,
  goal: d.goal,
  weeks: d.weeks,
  price: d.price,
  listed: d.listed,
});

export async function saveProgram(draft: ProgramDraft, routines: readonly Routine[]): Promise<CoachProgram> {
  return (await post<{ program: CoachProgram }>({ action: "save", program: { ...details(draft), days: draftDays(draft, routines) } }))
    .program;
}
/** Saves a program's details with the days it already has (the coach didn't pick new ones). */
export async function saveProgramKeepingDays(draft: ProgramDraft, program: CoachProgram): Promise<CoachProgram> {
  const days = program.days.flatMap((d) =>
    d.code ? [{ name: d.name, code: d.code, ...(d.weekdays ? { weekdays: d.weekdays } : {}) }] : [],
  );
  return (await post<{ program: CoachProgram }>({ action: "save", program: { ...details(draft), days } })).program;
}
export const deleteProgram = async (id: string) => (await post<{ result: "deleted" | "unlisted" }>({ action: "delete", id })).result;
export const getFree = async (id: string) => (await post<{ program: CoachProgram }>({ action: "get", id })).program;
export const dropProgram = (id: string) => post<{ ok: boolean }>({ action: "drop", id });

/** Opens Stripe's checkout page on the coach's account. The web app only. */
export async function buy(id: string): Promise<void> {
  if (!canBuyHere()) return;
  openOutside((await post<{ url: string }>({ action: "buy", id })).url, true);
}

/** The program's days as routines, ready to save (the lifter's own progression fills in weights and reps). */
export function programRoutines(p: CoachProgram, now: number, newId: () => string): Routine[] {
  return p.days.flatMap((d) => {
    const r = d.code ? decodeRoutine(d.code) : null;
    if (!r) return [];
    return [
      { id: newId(), name: r.name || d.name, items: r.items, createdAt: now, updatedAt: now, ...(r.parts ? { parts: r.parts } : {}) },
    ];
  });
}

/** The link a coach shares: it opens the program in the app, or on the web app where it can be bought. */
export const programLink = (siteUrl: string, id: string) => `${siteUrl}/app/#/program/${id}`;
