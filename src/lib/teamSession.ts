"use client";

import { create } from "zustand";

import { api, AuthError, readAccount } from "./auth";
import { EXERCISE_BY_ID } from "./exercises";
import { track } from "./net";
import { repRange } from "./progression";
import type { Goal, RoutineItem } from "./types";

// Team sessions, the tablet side (Melvin, 2026-11-19: gap item 5; server src/server/teamSessions.ts, decision record
// docs/decisions/school-teams.md "Team sessions"). A school coach starts one workout for a team on one tablet, each
// athlete taps their first name and logs their own sets, and the coach watches the board.
//
// Local first (docs/decisions/background-sync.md): the session and every set live on the device (localStorage, under
// `liftsmith.`, so signing out wipes it) and go to the server behind the screen. A push carries everything not yet
// acknowledged, and the server keeps sets by id, so a push that's lost or repeated is harmless. Ending works offline
// too: the session waits on the device until the end reaches the server, which then writes each athlete's workout into
// their own account.

export const SESSION_KEY = "liftsmith.teamSession";

export interface TeamPlanItem {
  exerciseId: string;
  sets: number;
  /** Reps (or seconds for holds) to aim for in each set. */
  reps: number;
}
export interface TeamAthlete {
  id: string;
  /** First name only: the tablet is shared, and the team is teenagers. */
  name: string;
}
export interface TeamSet {
  id: string;
  athlete: string;
  exercise: string;
  /** Kilograms. */
  weight: number;
  reps: number;
  target: number;
  at: number;
}
export interface TeamSessionState {
  id: string;
  team: string;
  teamName: string;
  /** The routine it came from. */
  name: string;
  plan: TeamPlanItem[];
  roster: TeamAthlete[];
  startedAt: number;
  endedAt?: number;
  sets: TeamSet[];
  /** Each athlete's last weight and reps per exercise, from the team's last sessions (for the first set). */
  last: Record<string, Record<string, { weight: number; reps: number }>>;
  /** Set ids the server has. */
  sent: string[];
  /** Set ids taken back that the server may still have. */
  removed: string[];
  /** The server has the session (its first push landed), so the coach's other devices can show its board. */
  synced?: boolean;
  /** The server has the end and wrote the workouts: the session can go from the device. */
  done?: boolean;
}

/** The first name, for the shared tablet. */
export const firstName = (name: string) => name.trim().split(/\s+/)[0]?.slice(0, 30) ?? "";

/** A plan from one of the coach's routines: each exercise's sets, aiming for the bottom of its rep range. Cardio is left out. */
export function planFrom(items: readonly RoutineItem[], goal: Goal): TeamPlanItem[] {
  const out: TeamPlanItem[] = [];
  for (const it of items) {
    const ex = EXERCISE_BY_ID.get(it.exerciseId);
    if (!ex || ex.cardio) continue;
    out.push({ exerciseId: ex.id, sets: Math.min(10, Math.max(1, it.sets)), reps: repRange(ex, goal)[0] });
  }
  return out.slice(0, 20);
}

/** Sets an athlete has logged for an exercise (a set of 0 reps counts as tried, not done). */
const countFor = (st: TeamSessionState, athlete: string, exercise: string) =>
  st.sets.filter((x) => x.athlete === athlete && x.exercise === exercise && x.reps > 0).length;

/** What an athlete does next: the first exercise in the plan with sets left, which set it is, and the target. */
export function nextFor(st: TeamSessionState, athlete: string): { item: TeamPlanItem; setNo: number } | null {
  for (const item of st.plan) {
    const c = countFor(st, athlete, item.exerciseId);
    if (c < item.sets) return { item, setNo: c + 1 };
  }
  return null;
}

/** Sets done (capped at the plan per exercise) and the plan's total, for one athlete. */
export function progressOf(st: TeamSessionState, athlete: string): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const item of st.plan) {
    done += Math.min(item.sets, countFor(st, athlete, item.exerciseId));
    total += item.sets;
  }
  return { done, total };
}

/** The weight an athlete starts a set at: their last set of it here, then their last session's, then nothing. */
export function startWeight(st: TeamSessionState, athlete: string, exercise: string): { weight: number; reps: number } | null {
  for (let i = st.sets.length - 1; i >= 0; i--) {
    const x = st.sets[i]!;
    if (x.athlete === athlete && x.exercise === exercise) return { weight: x.weight, reps: x.reps };
  }
  return st.last[athlete]?.[exercise] ?? null;
}

export interface BoardLine {
  id: string;
  name: string;
  done: number;
  total: number;
  /** The exercise their next set is on; empty when they're finished. */
  on: string;
}

/** The live board, action first: who hasn't started, then everyone by sets done. Never a weight. */
export function boardOf(st: TeamSessionState): { rows: BoardLine[]; notStarted: number; finished: number } {
  const rows = st.roster.map((a) => ({ id: a.id, name: a.name, ...progressOf(st, a.id), on: nextFor(st, a.id)?.item.exerciseId ?? "" }));
  rows.sort((a, b) => b.done - a.done || a.name.localeCompare(b.name));
  return {
    rows,
    notStarted: rows.filter((r) => r.done === 0).length,
    finished: rows.filter((r) => r.total > 0 && r.done >= r.total).length,
  };
}

/** Most sets in one push: keeps each request small on a weak gym connection. */
export const PUSH_SETS = 100;

/** What the server doesn't have yet: new sets (up to PUSH_SETS), sets taken back, and the end once every set is in. */
export function pendingPush(
  st: TeamSessionState,
): { body: Record<string, unknown>; sets: string[]; removed: string[]; ends: boolean } | null {
  if (st.done) return null;
  const sent = new Set(st.sent);
  const fresh = st.sets.filter((x) => !sent.has(x.id));
  const sets = fresh.slice(0, PUSH_SETS);
  const removed = st.removed.slice(0, PUSH_SETS);
  // The end goes only with the last of the sets, so the server writes workouts with every set in them.
  const ends = st.endedAt !== undefined && fresh.length <= PUSH_SETS && st.removed.length <= PUSH_SETS;
  if (!sets.length && !removed.length && !ends && st.synced) return null;
  return {
    body: {
      session: {
        id: st.id,
        team: st.team,
        name: st.name,
        plan: st.plan,
        startedAt: st.startedAt,
        ...(ends ? { endedAt: st.endedAt } : {}),
      },
      sets,
      removed,
    },
    sets: sets.map((x) => x.id),
    removed,
    ends,
  };
}

// --- The session on this device ---

function load(): TeamSessionState | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as TeamSessionState) : null;
  } catch {
    return null;
  }
}
function save(st: TeamSessionState | null) {
  try {
    if (st) localStorage.setItem(SESSION_KEY, JSON.stringify(st));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Private mode or full storage: the session still runs from memory.
  }
}

const newId = () => crypto.randomUUID();

interface Store {
  session: TeamSessionState | null;
  /**
   * Why the last push didn't land: "offline" (sets wait on the device for a connection) or "refused" (the server said
   * no: the team is gone or the coach's school proof ran out, which trying again won't fix).
   */
  waiting: "offline" | "refused" | null;
}
export const useTeamSession = create<Store>(() => ({ session: typeof window === "undefined" ? null : load(), waiting: null }));

function put(st: TeamSessionState | null) {
  save(st);
  useTeamSession.setState({ session: st });
  if (st && !st.done) schedulePush();
}

/** Starts a session for a team with a plan, its athletes (first names) and their last weights. */
export function startTeamSession(
  team: { id: string; name: string },
  name: string,
  plan: TeamPlanItem[],
  roster: TeamAthlete[],
  last: TeamSessionState["last"] = {},
  now = Date.now(),
): TeamSessionState {
  const st: TeamSessionState = {
    id: newId(),
    team: team.id,
    teamName: team.name,
    name,
    plan,
    roster: [...roster].sort((a, b) => a.name.localeCompare(b.name)),
    startedAt: now,
    sets: [],
    last,
    sent: [],
    removed: [],
  };
  put(st);
  return st;
}

/** Logs one set for an athlete; returns its id (for Undo). */
export function logTeamSet(
  athlete: string,
  exercise: string,
  weightKg: number,
  reps: number,
  target: number,
  now = Date.now(),
): string | null {
  const st = useTeamSession.getState().session;
  if (!st || st.endedAt !== undefined) return null;
  const id = newId();
  put({ ...st, sets: [...st.sets, { id, athlete, exercise, weight: Math.max(0, weightKg), reps: Math.max(0, reps), target, at: now }] });
  return id;
}

/** Takes a set back (Undo). */
export function undoTeamSet(id: string) {
  const st = useTeamSession.getState().session;
  if (!st || st.endedAt !== undefined) return;
  const was = st.sent.includes(id);
  put({
    ...st,
    sets: st.sets.filter((x) => x.id !== id),
    sent: st.sent.filter((x) => x !== id),
    removed: was ? [...st.removed, id] : st.removed,
  });
}

/** Ends the session: it stays on the device until the server has every set and the end. */
export function endTeamSession(now = Date.now()) {
  const st = useTeamSession.getState().session;
  if (!st || st.endedAt !== undefined) return;
  // A session with nothing logged needs nothing from the server.
  if (!st.sets.length && !st.sent.length) return put(null);
  put({ ...st, endedAt: now });
}

/** Clears a finished session from the device (Done on the summary). */
export function clearTeamSession() {
  const st = useTeamSession.getState().session;
  if (st && (st.done || !st.sets.length)) put(null);
}

let timer: ReturnType<typeof setTimeout> | null = null;
let pushing = false;

/** Pushes soon after a change, so a burst of sets goes in one request. */
export function schedulePush(delayMs = 1500) {
  if (typeof window === "undefined") return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void flushTeamSession();
  }, delayMs);
}

/** Sends what the server doesn't have yet, a chunk at a time. Quietly waits for a connection when there's none. */
export async function flushTeamSession(): Promise<void> {
  if (pushing) return;
  const account = readAccount();
  if (!account) return;
  pushing = true;
  try {
    for (let i = 0; i < 100; i++) {
      const st = useTeamSession.getState().session;
      if (!st) return;
      const p = pendingPush(st);
      if (!p) return;
      try {
        const r = await track(api<{ ok: true; written: boolean }>("/api/teams/session/", { token: account.token, body: p.body }));
        useTeamSession.setState({ waiting: null });
        const now = useTeamSession.getState().session;
        if (!now || now.id !== st.id) return;
        const removed = new Set(p.removed);
        const next: TeamSessionState = {
          ...now,
          sent: [...new Set([...now.sent, ...p.sets])],
          removed: now.removed.filter((x) => !removed.has(x)),
          synced: true,
          ...(r.written && now.endedAt !== undefined ? { done: true } : {}),
        };
        save(next);
        useTeamSession.setState({ session: next });
        if (next.done) return;
      } catch (e) {
        // No connection: everything waits on the device for the next try. A refusal (the team is gone, the coach's
        // school proof ran out) can't be fixed by trying again, so the board says so and stops.
        const status = e instanceof AuthError ? e.status : 0;
        useTeamSession.setState({ waiting: status === 0 || status >= 500 || status === 429 ? "offline" : "refused" });
        return;
      }
    }
  } finally {
    pushing = false;
  }
}

// --- The coach's other devices ---

export interface LiveRow {
  id: string;
  name: string;
  done: number;
  total: number;
  on: string;
}
export interface LiveBoard {
  id: string;
  team: string;
  teamName: string;
  name: string;
  startedAt: number;
  endedAt: number | null;
  plan: TeamPlanItem[];
  rows: LiveRow[];
}

function token(): string {
  const a = readAccount();
  if (!a) throw new AuthError("signedOut", 401);
  return a.token;
}

/** A running session's board, for the coach's phone while the tablet runs it. */
export const loadLiveBoard = async (id: string) =>
  (await api<{ board: LiveBoard }>(`/api/teams/session/?id=${encodeURIComponent(id)}`, { token: token() })).board;

/** Each athlete's last weights in the team's last few sessions (for the tablet's start). */
export const loadLastWeights = async (team: string) =>
  (await api<{ last: TeamSessionState["last"] }>(`/api/teams/session/?last=${encodeURIComponent(team)}`, { token: token() })).last;
