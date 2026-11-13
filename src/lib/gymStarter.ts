import { EXERCISE_BY_ID } from "./exercises";

// A gym's starter program (Melvin, 2026-11-13, docs/decisions/gyms.md "Staff and the starter program"): the routine
// the gym suggests to new members, published by its owner or staff from one of their own routines. It's kept as a
// routine share code (routineShare.ts), so it carries no weights or anything personal, and opening it in the app is
// the same Save screen as any shared routine (#/routine/<code>). This file only reads the code, with no app text, so
// the server and the website's gym page use it too.

/** Longest code kept: 20 exercises plus warm-up and cool-down stretches fit well inside. */
export const STARTER_MAX = 2_000;

export interface Starter {
  name: string;
  items: { id: string; sets: number }[];
}

function nameOf(code: string): string {
  try {
    const bin = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
    return new TextDecoder("utf-8", { fatal: true })
      .decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .trim()
      .slice(0, 40);
  } catch {
    return "";
  }
}

/** The program's name and its exercises with set counts, or null when the code isn't a usable routine. */
export function readStarter(code: unknown): Starter | null {
  if (typeof code !== "string" || !code || code.length > STARTER_MAX || !/^[A-Za-z0-9_~.:,-]+$/.test(code)) return null;
  const [v, rawName = "", ...parts] = code.split("~");
  if (v !== "r1") return null;
  const items = parts.flatMap((p) => {
    const [id = "", s] = p.split(".");
    const sets = Number(s);
    return EXERCISE_BY_ID.has(id) && Number.isInteger(sets) && sets >= 1 && sets <= 10 ? [{ id, sets }] : [];
  });
  if (!items.length) return null;
  return { name: nameOf(rawName), items: items.slice(0, 20) };
}
