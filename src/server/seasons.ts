// The season schedule (src/lib/seasons.ts): what the admin Seasons tab saved, merged over the built-in season 1.
// One admin setting (admin_settings "seasons"), so it costs one indexed read per request and no table of its own.
import { changeProblem, mergeSchedule, type SeasonDef } from "@/lib/seasons";

import { getJson, setSetting } from "./settings";

const KEY = "seasons";

/** What the admin panel saved (without the built-in seasons it didn't change). */
export async function savedSeasons(): Promise<SeasonDef[]> {
  const v = await getJson<unknown>(KEY, []);
  return Array.isArray(v) ? (v as SeasonDef[]) : [];
}

/** The whole schedule the app should use. */
export async function seasonSchedule(): Promise<SeasonDef[]> {
  return mergeSchedule(await savedSeasons());
}

/** Saves a new schedule, or says why it can't be saved (a season that started can't change). */
export async function saveSeasons(next: SeasonDef[], now = Date.now()): Promise<string | null> {
  const before = await seasonSchedule();
  const problem = changeProblem(before, next, now);
  if (problem) return problem;
  await setSetting(KEY, JSON.stringify(next.map((s) => ({ id: s.id, kit: s.kit, start: s.start, weeks: s.weeks }))), now);
  return null;
}
