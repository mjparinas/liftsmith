// The season schedule (src/lib/seasons.ts): what the admin Seasons tab saved, merged over the built-in schedule
// (DEFAULT_SEASONS, back to back through 2027). One admin setting (admin_settings "seasons"), so it costs one
// indexed read per request and no table of its own. A built-in season taken off in the admin is kept as
// `{ id, off: true }`, so the apps (which carry the built-in schedule too) drop it as well.
import { changeProblem, mergeSchedule, toSaved, type ScheduleRow, type SeasonDef } from "@/lib/seasons";

import { getJson, setSetting } from "./settings";

const KEY = "seasons";

/** What the admin panel saved: seasons it changed or added, and `off` for built-in ones it took off. */
export async function savedSeasons(): Promise<ScheduleRow[]> {
  const v = await getJson<unknown>(KEY, []);
  return Array.isArray(v) ? (v as ScheduleRow[]) : [];
}

/** The whole schedule the app should use. */
export async function seasonSchedule(): Promise<SeasonDef[]> {
  return mergeSchedule(await savedSeasons());
}

/** What GET /api/seasons/ sends: the schedule, plus `off` for each built-in season taken off (new builds drop it). */
export async function seasonFeed(): Promise<ScheduleRow[]> {
  return toSaved(await seasonSchedule());
}

/** Saves a new schedule, or says why it can't be saved (a season that started can't change). */
export async function saveSeasons(next: SeasonDef[], now = Date.now()): Promise<string | null> {
  const before = await seasonSchedule();
  const problem = changeProblem(before, next, now);
  if (problem) return problem;
  await setSetting(KEY, JSON.stringify(toSaved(next)), now);
  return null;
}
