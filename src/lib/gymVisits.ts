"use client";

// Anonymous gym visits for owner insights, the app side (server: src/server/gymInsights.ts; docs/decisions/gyms.md
// "Owner insights"). When a workout ends at a gym the lifter added from the map, the app sends its weekday, hour,
// length and the kinds of equipment used: never a weight, a rep, an exercise or a position. Off with Settings › Your
// data and privacy › Count my visits (`profile.gymStats`, on by default except where data choices need a yes first),
// never for under-18s. Kept on the device until sent, because gyms have bad reception.
import { askFirstHere, installId } from "./analytics";
import { api, readAccount } from "./auth";
import { EXERCISE_BY_ID } from "./exercises";
import type { GymInsights, GymVisit } from "./gymInsights";
import { isTeen } from "./teen";
import type { AppEvent, Equipment, Gym, Profile } from "./types";

const KEY = "liftsmith.gymVisits";
/** Visits waiting longer than this are dropped: the server only takes the last 14 days. */
const MAX_AGE = 13 * 86_400_000;
/** Workouts shorter than this aren't a visit (a test, a mistaken start). */
const MIN_MINUTES = 10;

/** Whether this lifter's visits count toward their gym's numbers. */
export const visitsOn = (p: Pick<Profile, "gymStats" | "birthYear">) => !isTeen(p) && (p.gymStats ?? !askFirstHere());

function read(): GymVisit[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]") as unknown;
    return Array.isArray(v) ? (v as GymVisit[]) : [];
  } catch {
    return [];
  }
}
function write(list: GymVisit[]) {
  try {
    if (list.length) localStorage.setItem(KEY, JSON.stringify(list.slice(-20)));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage full or blocked: the visit isn't counted, nothing else depends on it.
  }
}

/** The visit for a finished workout, or null when it doesn't count (no real gym, too short, switched off). */
export function visitFor(
  state: { profile: Profile; gyms: Gym[]; events: AppEvent[] },
  sessionId: string,
  startedAt: number,
  endedAt: number,
): GymVisit | null {
  if (!visitsOn(state.profile)) return null;
  const start = state.events.find((e) => e.type === "sessionStart" && e.sessionId === sessionId);
  const gym = start?.type === "sessionStart" ? state.gyms.find((g) => g.id === start.gymId) : undefined;
  const minutes = Math.round((endedAt - startedAt) / 60_000);
  if (!gym?.placeId || minutes < MIN_MINUTES) return null;
  const gear = new Set<Equipment>();
  for (const e of state.events)
    if (e.type === "set" && e.sessionId === sessionId) for (const n of EXERCISE_BY_ID.get(e.exerciseId)?.needs ?? []) gear.add(n);
  const d = new Date(startedAt);
  return {
    session: sessionId,
    place: gym.placeId,
    day: d.getDay(),
    hour: d.getHours(),
    at: endedAt,
    minutes: Math.min(600, minutes),
    gear: [...gear],
  };
}

let sending: Promise<void> | null = null;

/** Sends what's waiting; anything that fails for the network stays for next time. */
export function flushVisits(now = Date.now()): Promise<void> {
  sending ??= (async () => {
    const account = readAccount();
    // Sent, refused or too old: taken off the list at the end, which may have grown meanwhile.
    const done = new Set<string>();
    for (const v of read()) {
      if (now - v.at > MAX_AGE) {
        done.add(v.session);
        continue;
      }
      try {
        await api("/api/gyms/", { token: account?.token, body: { op: "visit", visit: v, ...(account ? {} : { install: installId() }) } });
        done.add(v.session);
      } catch (e) {
        // Offline or the server busy: try again later. A visit the server refused (bad, slow) is dropped.
        const status = (e as { status?: number }).status ?? 0;
        if (status && status < 500) done.add(v.session);
      }
    }
    write(read().filter((v) => !done.has(v.session)));
  })().finally(() => {
    sending = null;
  });
  return sending;
}

/** Keeps the visit for a finished workout and tries to send it. */
export function noteVisit(v: GymVisit | null): void {
  if (!v) return;
  write([...read().filter((x) => x.session !== v.session), v]);
  void flushVisits();
}

/** The owner's insights for their gym; null when offline or not theirs. */
export async function loadInsights(place: string): Promise<GymInsights | null> {
  const token = readAccount()?.token;
  if (!token) return null;
  try {
    return (await api<{ insights: GymInsights }>("/api/gyms/", { token, body: { op: "insights", place } })).insights;
  } catch {
    return null;
  }
}
