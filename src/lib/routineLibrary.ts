// The public routine library on the phone and the web app (server: src/server/routineLibrary.ts; decision record:
// docs/decisions/routine-library.md). Types, calls, and what a routine needs and how long it takes, worked out here
// from the exercise list (the server doesn't load it).
import { api, AuthError, readAccount } from "./auth";
import { exercise } from "./exercises";
import { encodeRoutine } from "./routineShare";
import { SITE_URL } from "./site";
import type { Equipment, Routine } from "./types";

export const GOALS = ["strength", "muscle", "fitness", "fatLoss", "sport"] as const;
export const LEVELS = ["beginner", "intermediate", "advanced", "any"] as const;
export type Goal = (typeof GOALS)[number];
export type Level = (typeof LEVELS)[number];
export const REPORT_REASONS = ["spam", "abuse", "danger", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export type Sort = "top" | "new";

/** The server's LIBRARY_LIMITS, for the words around the forms. */
export const LIBRARY_RULES = { title: 60, about: 300, perAccount: 30, shown: 3 } as const;

export interface Rating {
  average: number | null;
  count: number;
}

export interface LibraryRoutine {
  id: string;
  title: string;
  about: string;
  goal: Goal;
  level: Level;
  equipment: string[];
  minutes: number;
  code: string;
  by: string;
  saves: number;
  rating: Rating;
  createdAt: number;
  updatedAt: number;
  mine?: boolean;
}

export interface LibraryView extends LibraryRoutine {
  myStars: number;
  saved: boolean;
}

export interface Draft {
  id?: string;
  title: string;
  about: string;
  goal: Goal;
  level: Level;
  showName: boolean;
}

const token = () => readAccount()?.token;
const mustToken = () => {
  const t = token();
  if (!t) throw new AuthError("signedOut", 401);
  return t;
};
const post = <T>(body: Record<string, unknown>) => api<T>("/api/library/", { token: mustToken(), body });

/** Everything a routine's exercises need, so a lifter can see at a glance whether their gym has it. */
export function routineEquipment(r: Pick<Routine, "items">): Equipment[] {
  const out = new Set<Equipment>();
  for (const i of r.items) for (const e of exercise(i.exerciseId).needs) out.add(e);
  return [...out].sort();
}

/** About how long it takes: a set and its rest is about two and a half minutes, a warm-up or cool-down five, cardio its own. */
export function routineMinutes(r: Pick<Routine, "items" | "parts">): number {
  const sets = r.items.reduce((k, i) => k + i.sets, 0);
  const parts = (r.parts ?? []).reduce((k, p) => k + (p.kind === "cardio" ? (p.minutes ?? 15) : 5), 0);
  return Math.min(240, Math.max(5, Math.round((sets * 2.5 + parts) / 5) * 5));
}

export interface Search {
  q: string;
  goal: Goal | null;
  /** The lifter's gym equipment, or null for every routine. */
  have: readonly string[] | null;
  sort: Sort;
}

export function searchPath(s: Search): string {
  const q = new URLSearchParams();
  if (s.q.trim()) q.set("q", s.q.trim());
  if (s.goal) q.set("goal", s.goal);
  if (s.have) q.set("have", [...s.have].join(","));
  if (s.sort === "new") q.set("sort", "new");
  const x = q.toString();
  return `/api/library/${x ? `?${x}` : ""}`;
}

export const browseLibrary = async (s: Search) => (await api<{ routines: LibraryRoutine[] }>(searchPath(s), { token: token() })).routines;
export const loadLibraryRoutine = async (id: string) =>
  (await api<{ routine: LibraryView }>(`/api/library/?id=${encodeURIComponent(id)}`, { token: token() })).routine;
export const loadMine = async () =>
  (await api<{ mine: (LibraryRoutine & { hidden: boolean })[] }>("/api/library/?mine=1", { token: mustToken() })).mine;

/** Publishes the routine (or changes the one already published from it). */
export async function publish(r: Routine, d: Draft): Promise<LibraryRoutine> {
  const routine = {
    id: d.id,
    code: encodeRoutine(r),
    title: d.title,
    about: d.about,
    goal: d.goal,
    level: d.level,
    showName: d.showName,
    minutes: routineMinutes(r),
    equipment: routineEquipment(r),
  };
  return (await post<{ routine: LibraryRoutine }>({ action: "publish", routine })).routine;
}
export const unpublish = (id: string) => post<{ ok: boolean }>({ action: "unpublish", id });
/** Counts a save from the library, once per lifter. Best effort: the routine is already saved on the phone. */
export const noteSave = (id: string) => post<{ ok: boolean }>({ action: "save", id });
export const rate = async (id: string, stars: number) => (await post<{ rating: Rating }>({ action: "rate", id, stars })).rating;
export const report = (id: string, reason: ReportReason, note: string) => post<{ ok: boolean }>({ action: "report", id, reason, note });

/** The routine's page on the website, to share. */
export function libraryPageUrl(r: Pick<LibraryRoutine, "id" | "title">): string {
  const slug =
    r.title
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/, "") || "routine";
  return `${SITE_URL}/routines/${slug}-${r.id}/`;
}

/** The published routine made from this one, if any (same exercises, sets, supersets and parts). */
export const publishedFrom = (r: Routine, mine: readonly LibraryRoutine[]) => mine.find((m) => m.code === encodeRoutine(r));
