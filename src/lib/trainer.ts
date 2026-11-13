"use client";

// Trainer mode, the app side (server: src/server/coach.ts; decision record docs/decisions/trainer-mode.md).
// A coach shares an invite code; a client enters it, sees what the coach will see and agrees; the coach then
// reads the client's training from their synced account and gets a short report that says what to act on
// first (action over stats): a client gone quiet, behind on their weekly goal, missing reps, or stalled.
import { create } from "zustand";

import { api, AuthError, readAccount } from "./auth";
import { coachCode, coachSignup, saveCoachSignup } from "./coachInvite";
import { derive, weekOf, type Pr, type SessionSummary } from "./derive";
import { EXERCISE_BY_ID } from "./exercises";
import { t } from "./i18n";
import { stalls, type Stall } from "./insights";
import { KCAL_DAYS, LOGGED_KCAL, PROTEIN_SHORT } from "./nutrition";
import { gradedSet } from "./progression";
import { decodeRoutine } from "./routineShare";
import { APP_PATH, SITE_URL } from "./site";
import type { AppEvent, Experience, Goal, SetEvent } from "./types";
import { fmtNum } from "./units";

export interface Person {
  id: string;
  name: string;
  since: number;
}
export interface Invite {
  code: string;
  expiresAt: number;
}
/** A routine a coach assigned to a client: `code` is a routine share code (routineShare.ts). */
export interface Plan {
  id: string;
  coachId: string;
  clientId: string;
  name: string;
  code: string;
  at: number;
}
/** What a coach's new clients start setup with (any part may be unset). */
export interface Setup {
  goal?: Goal;
  experience?: Experience;
  days?: number;
}
/** A coach's note to a client. */
export interface Note {
  coachId: string;
  clientId: string;
  text: string;
  at: number;
}
export interface Overview {
  invite: Invite | null;
  clients: Person[];
  coaches: Person[];
  /** Routines this lifter's coaches gave them. */
  plans: Plan[];
  /** Notes this lifter's coaches left them, newest first. */
  notes?: Note[];
  /** What this coach's new clients start setup with. */
  setup?: Setup;
  /** Unread chat messages from each person, by id. */
  unread?: Record<string, number>;
  /** Coaches this client shares body data with; clients who share theirs with this coach. */
  bodyShared?: string[];
  sharesBody?: string[];
  /** Whether this coach gets alerts about their clients (on unless turned off). */
  alerts?: boolean;
  /** Daily nutrition targets this lifter's coaches set them, newest first. */
  targets?: Targets[];
}
/** A chat message between a coach and a client. */
export interface Message {
  id: string;
  from: string;
  text: string;
  at: number;
}
/** A client's body data, when they share it with this coach (the server's BodyShare). */
export interface BodyShare {
  sex: "male" | "female" | null;
  heightCm: number | null;
  weights: { at: number; kg: number; bodyFat?: number }[];
  measures: { at: number; site: string; cm: number }[];
  /** Calories and protein from their food app for each of the last 30 days, oldest first. */
  food?: { day: string; kcal?: number; protein?: number }[];
}
/** A coach's daily nutrition targets for a client. Either number may be empty. */
export interface Targets {
  coachId: string;
  clientId: string;
  kcal: number | null;
  protein: number | null;
  at: number;
}
export interface ClientView {
  name: string;
  daysPerWeek: number | null;
  events: unknown[];
  /** Routines this coach gave the client. */
  plans: Plan[];
  /** This coach's note to the client. */
  note?: Note | null;
  /** The client's body data, when they share it. */
  body?: BodyShare | null;
  /** This coach's daily nutrition targets for the client. */
  targets?: Targets | null;
}
/** The longest note a coach can leave (the server's COACH_LIMITS.note). */
export const NOTE_MAX = 500;

const DAY = 86_400_000;
const WEEK = 7 * DAY;

function token(): string {
  const a = readAccount();
  if (!a) throw new AuthError("signedOut", 401);
  return a.token;
}

export const loadOverview = async () => api<Overview>("/api/coach/", { token: token() });
export const loadClient = async (id: string) => api<ClientView>(`/api/coach/?client=${encodeURIComponent(id)}`, { token: token() });
/** A fresh invite. The first one from a coach who came in through the coaches page says so, for the admin panel's counts. */
export async function newInvite(): Promise<Invite> {
  const via = coachSignup() ? "coaches" : undefined;
  const { invite } = await api<{ invite: Invite }>("/api/coach/", { token: token(), body: { action: "invite", via } });
  saveCoachSignup(false);
  return invite;
}
export const cancelInvite = async () => void (await api("/api/coach/", { token: token(), body: { action: "cancel" } }));
/** Whose a code is, and what their new clients start setup with. Links nothing. */
export const previewInvite = async (code: string) =>
  api<{ coach: Person; setup?: Setup }>("/api/coach/", { token: token(), body: { action: "preview", code } });
export const previewCode = async (code: string) => (await previewInvite(code)).coach;
export const joinInvite = async (code: string) =>
  api<{ coach: Person; setup?: Setup }>("/api/coach/", { token: token(), body: { action: "join", code } });
export const joinCode = async (code: string) => (await joinInvite(code)).coach;
export const saveSetup = async (setup: Setup) =>
  (await api<{ setup: Setup }>("/api/coach/", { token: token(), body: { action: "setup", setup } })).setup;
export const saveNote = async (client: string, text: string) =>
  (await api<{ note: Note | null }>("/api/coach/", { token: token(), body: { action: "note", client, text } })).note;
export const saveTargets = async (client: string, kcal: number | null, protein: number | null) =>
  (await api<{ targets: Targets | null }>("/api/coach/", { token: token(), body: { action: "targets", client, kcal, protein } })).targets;
export const assignPlan = async (client: string, name: string, code: string) =>
  (await api<{ plan: Plan }>("/api/coach/", { token: token(), body: { action: "assign", client, name, code } })).plan;
export const removePlan = async (id: string) => void (await api("/api/coach/", { token: token(), body: { action: "unassign", id } }));
/** The longest chat message (the server's COACH_LIMITS.message). */
export const MESSAGE_MAX = 1000;
export const loadMessages = async (id: string, before?: number) =>
  api<{ messages: Message[]; more: boolean; name?: string }>(
    `/api/coach/?chat=${encodeURIComponent(id)}${before ? `&before=${before}` : ""}`,
    { token: token() },
  );
export const sendMessage = async (id: string, text: string) =>
  (await api<{ message: Message }>("/api/coach/", { token: token(), body: { action: "send", id, text } })).message;
export const setBodyShare = async (coach: string, on: boolean) =>
  (await api<{ on: boolean }>("/api/coach/", { token: token(), body: { action: "share", id: coach, on } })).on;
export const setCoachAlerts = async (on: boolean) =>
  (await api<{ on: boolean }>("/api/coach/", { token: token(), body: { action: "alerts", on } })).on;
/** This phone's push token for coaching pushes, which don't need Friends (push.ts calls it). */
export const coachPushToken = async (tokenValue: string, platform: string, lang: string) =>
  void (await api("/api/coach/", { token: token(), body: { action: "pushToken", token: tokenValue, platform, lang } }));
export const unlinkPerson = async (id: string) => void (await api("/api/coach/", { token: token(), body: { action: "unlink", id } }));

/** A code as it's shown and read out: ABCD-EFGH. */
export const showCode = (code: string) => (code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code);
/** The link a coach sends: it opens Coaching in the app with the code filled in. */
export const inviteUrl = (code: string, base = SITE_URL) => `${base.replace(/\/$/, "")}${APP_PATH}#/trainer/${code}`;
/** The code in a pasted invite link, or the typed code itself, tidied. Empty when it can't be one. */
export const codeFrom = (text: string) => coachCode(text);

export function trainerError(e: unknown): string {
  if (e instanceof AuthError) {
    if (e.message === "offline") return t("trn.err.offline");
    if (e.message === "slow") return t("trn.err.slow");
    if (e.message === "unknown") return t("trn.err.unknown");
    if (e.message === "self") return t("trn.err.self");
    if (e.message === "full") return t("trn.err.full");
    if (e.message === "coachFull") return t("trn.err.coachFull");
    if (e.message === "gone") return t("trn.err.gone");
  }
  return t("trn.err.failed");
}

// --- The coach's report on one client ---

const num = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const str = (x: unknown): x is string => typeof x === "string" && x.length > 0 && x.length <= 120;

/**
 * The client's events as the app's own types, keeping only well-formed ones: they came from another
 * person's device, so nothing odd in them may break this screen.
 */
export function cleanEvents(raw: readonly unknown[]): { events: AppEvent[]; names: Map<string, string> } {
  const events: AppEvent[] = [];
  const names = new Map<string, string>();
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const e = r as Record<string, unknown>;
    if (!str(e.id) || !num(e.at)) continue;
    if (e.type === "set") {
      if (!str(e.sessionId) || !str(e.exerciseId) || !num(e.weight) || !num(e.reps) || !num(e.targetReps)) continue;
      events.push({ ...(e as unknown as SetEvent), rir: num(e.rir) ? e.rir : 2 });
    } else if (e.type === "sessionStart" || e.type === "sessionEnd" || e.type === "feedback") {
      if (!str(e.sessionId)) continue;
      if (e.type === "sessionEnd" && !num(e.seconds)) continue;
      events.push(e as unknown as AppEvent);
    } else if (e.type === "customExercise") {
      const x = e.exercise as { id?: unknown; name?: unknown } | undefined;
      if (x && str(x.id) && str(x.name)) names.set(x.id, x.name.slice(0, 60));
    }
  }
  return { events, names };
}

/** What a coach should look at first, most urgent first. */
export type Flag =
  | { kind: "new" }
  | { kind: "quiet"; days: number }
  | { kind: "behind"; done: number; goal: number }
  | { kind: "missing"; pct: number }
  | { kind: "stalled"; exerciseId: string; weeks: number }
  | { kind: "prs"; count: number }
  | { kind: "planUnused"; name: string }
  | { kind: "kcalOff"; avg: number; target: number; days: number }
  | { kind: "proteinShort"; avg: number; target: number; days: number }
  | { kind: "onTrack"; done: number; goal: number };

/** How an assigned routine is going: workouts since it was assigned that follow it. */
export interface PlanProgress {
  plan: Plan;
  done: number;
  lastAt: number | null;
}

/**
 * A workout follows a routine when it was done after the routine was assigned and has most of its exercises
 * (60%+). The client's copy of a routine has its own id on their phone, so it's matched by what was trained.
 */
export function planProgress(plan: Plan, sessions: readonly SessionSummary[]): PlanProgress {
  const want = new Set(decodeRoutine(plan.code)?.items.map((i) => i.exerciseId) ?? []);
  const hits = want.size
    ? sessions.filter((s) => s.start >= plan.at && s.exercises.filter((e) => want.has(e)).length >= Math.ceil(want.size * 0.6))
    : [];
  return { plan, done: hits.length, lastAt: hits[0]?.start ?? null };
}

export interface Report {
  name: string;
  /** When it was made, so screens that read it agree on "now". */
  now: number;
  goal: number | null;
  /** Workouts in each of the last 4 weeks, oldest first; the last is this week so far. */
  weeks: { start: number; count: number }[];
  lastAt: number | null;
  /** The last 10 workouts, newest first. */
  sessions: SessionSummary[];
  /** New bests in the last 30 days, newest first. */
  prs: Pr[];
  stalls: Stall[];
  flags: Flag[];
  /** Names for the client's own exercises, which this phone's library doesn't have. */
  names: Map<string, string>;
  /** The routines this coach assigned, newest first, with how each is going. */
  plans: PlanProgress[];
}

export function clientReport(view: ClientView, now: number): Report {
  const { events, names } = cleanEvents(view.events);
  const stats = derive(events, now);
  const sessions = stats.sessions;
  const thisWeek = weekOf(now);
  const weeks = [3, 2, 1, 0].map((i) => {
    const start = weekOf(thisWeek - i * WEEK + 12 * 3_600_000);
    return { start, count: sessions.filter((s) => weekOf(s.start) === start).length };
  });
  const goal = view.daysPerWeek;
  const lastAt = sessions[0]?.start ?? null;
  const prs = stats.prs.filter((p) => now - p.at <= 30 * DAY).sort((a, b) => b.at - a.at);
  const stalled = stalls(events, now);
  const flags: Flag[] = [];
  const plans = (view.plans ?? []).map((p) => planProgress(p, sessions));

  if (lastAt === null) flags.push({ kind: "new" });
  else {
    const days = Math.floor((now - lastAt) / DAY);
    if (days >= 7) flags.push({ kind: "quiet", days });
    // Last full week against the weekly goal.
    const last = weeks[2]!;
    if (goal && days < 7 && last.count < goal) flags.push({ kind: "behind", done: last.count, goal });
    // Missed reps across the last three workouts (the same test as the fatigue coach's note).
    const bySession = new Map<string, SetEvent[]>();
    for (const e of events) if (e.type === "set") bySession.set(e.sessionId, [...(bySession.get(e.sessionId) ?? []), e]);
    const lastThree = [...bySession.values()].sort((a, b) => b.at(-1)!.at - a.at(-1)!.at).slice(0, 3);
    if (lastThree.length === 3 && now - lastThree[2]!.at(-1)!.at < 3 * WEEK) {
      const rates = lastThree.map((sets) => {
        const real = sets.filter(gradedSet);
        return real.length ? real.filter((x) => x.reps >= x.targetReps).length / real.length : 1;
      });
      if (rates.every((r) => r < 0.7)) flags.push({ kind: "missing", pct: Math.round((rates.reduce((a, b) => a + b, 0) / 3) * 100) });
    }
    for (const s of stalled.slice(0, 2)) flags.push({ kind: "stalled", exerciseId: s.exerciseId, weeks: s.weeks });
    // Eating against the coach's targets, from the food days a client shares with their body data.
    for (const f of foodFlags(view, now)) flags.push(f);
    // A routine given a week ago or more that hasn't been done yet.
    for (const p of plans) if (!p.done && now - p.plan.at >= WEEK) flags.push({ kind: "planUnused", name: p.plan.name });
    if (prs.length) flags.push({ kind: "prs", count: prs.length });
    if (!flags.some((f) => f.kind !== "prs") && goal) flags.push({ kind: "onTrack", done: weeks[3]!.count, goal });
  }
  return { name: view.name, now, goal, weeks, lastAt, sessions: sessions.slice(0, 10), prs, stalls: stalled, flags, names, plans };
}

/** Logged food days (1,000+ kcal, like nutrition.ts) in the last week, once there are 4. */
export function foodWeek(view: Pick<ClientView, "body">, now: number): { days: number; kcal: number; protein: number | null } | null {
  const from = new Date(now - WEEK);
  const key = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`;
  const days = (view.body?.food ?? []).filter((d) => d.day >= key && (d.kcal ?? 0) >= LOGGED_KCAL);
  if (days.length < KCAL_DAYS) return null;
  const withProtein = days.filter((d) => d.protein !== undefined);
  return {
    days: days.length,
    kcal: Math.round(days.reduce((s, d) => s + d.kcal!, 0) / days.length),
    protein: withProtein.length ? Math.round(withProtein.reduce((s, d) => s + d.protein!, 0) / withProtein.length) : null,
  };
}

/** Calories 10% or more off the coach's target, or protein under 85% of it, over the last week of logged days. */
function foodFlags(view: Pick<ClientView, "body" | "targets">, now: number): Flag[] {
  const t = view.targets;
  const week = t && foodWeek(view, now);
  if (!t || !week) return [];
  const out: Flag[] = [];
  if (t.kcal && Math.abs(week.kcal - t.kcal) >= t.kcal * 0.1)
    out.push({ kind: "kcalOff", avg: week.kcal, target: t.kcal, days: week.days });
  if (t.protein && week.protein !== null && week.protein < t.protein * PROTEIN_SHORT)
    out.push({ kind: "proteinShort", avg: week.protein, target: t.protein, days: week.days });
  return out;
}

/** An exercise's name on the coach's phone: the library's, the client's own, or a plain fallback. */
export function liftName(id: string, names: ReadonlyMap<string, string>): string {
  return EXERCISE_BY_ID.get(id)?.name ?? names.get(id) ?? t("trn.ownExercise");
}

/** The line for a flag: what we saw, and what to do. */
export function flagText(f: Flag, names: ReadonlyMap<string, string>): { title: string; advice: string; tone: "warn" | "good" | "info" } {
  switch (f.kind) {
    case "new":
      return { title: t("trn.f.new"), advice: t("trn.f.newDo"), tone: "info" };
    case "quiet":
      return { title: t("trn.f.quiet", { count: f.days }), advice: t("trn.f.quietDo"), tone: "warn" };
    case "behind":
      return { title: t("trn.f.behind", { done: f.done, goal: f.goal }), advice: t("trn.f.behindDo"), tone: "warn" };
    case "missing":
      return { title: t("trn.f.missing", { pct: f.pct }), advice: t("trn.f.missingDo"), tone: "warn" };
    case "stalled":
      return {
        title: t("trn.f.stalled", { lift: liftName(f.exerciseId, names), weeks: f.weeks }),
        advice: t("trn.f.stalledDo"),
        tone: "warn",
      };
    case "prs":
      return { title: t("trn.f.prs", { count: f.count }), advice: t("trn.f.prsDo"), tone: "good" };
    case "planUnused":
      return { title: t("trn.f.planUnused", { name: f.name }), advice: t("trn.f.planUnusedDo"), tone: "warn" };
    case "kcalOff":
      return {
        title: t(f.avg < f.target ? "trn.f.kcalUnder" : "trn.f.kcalOver", { avg: fmtNum(f.avg), target: fmtNum(f.target), count: f.days }),
        advice: t(f.avg < f.target ? "trn.f.kcalUnderDo" : "trn.f.kcalOverDo"),
        tone: "warn",
      };
    case "proteinShort":
      return {
        title: t("trn.f.proteinShort", { avg: f.avg, target: f.target, count: f.days }),
        advice: t("trn.f.proteinShortDo"),
        tone: "warn",
      };
    case "onTrack":
      return { title: t("trn.f.onTrack", { done: f.done, goal: f.goal }), advice: t("trn.f.onTrackDo"), tone: "good" };
  }
}

// --- The client's side between visits: notes from their coaches, for Today ---

const CACHE = "liftsmith.coachNotes";
const SEEN = "liftsmith.coachNotes.seen";
const TARGETS = "liftsmith.coachTargets";
/** At most one look a quarter of an hour, on open and on return to the app (like Health imports). */
const EVERY = 15 * 60_000;

/** A note to show, with the coach's name. */
export interface ShownNote extends Note {
  coach: string;
}
/** Someone with unread messages for this lifter. */
export interface Unread {
  id: string;
  name: string;
  count: number;
}
interface NotesState {
  notes: ShownNote[];
  /** Coaches or clients with unread messages, for Today and the Coaching row. */
  unread: Unread[];
  /** The newest daily nutrition targets from a coach, with the coach's name, for coach's notes and Health. */
  targets: (Targets & { coach: string }) | null;
  /** Notes "Got it" hid, as coachId:at, so an edited note shows again. */
  seen: string[];
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "null") as T | null;
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    // private mode: notes still show while the app is open
  }
}

export const useCoachNotes = create<NotesState>(() => ({
  notes: typeof window === "undefined" ? [] : readJson<ShownNote[]>(CACHE, []),
  unread: [],
  targets: typeof window === "undefined" ? null : readJson<(Targets & { coach: string }) | null>(TARGETS, null),
  seen: typeof window === "undefined" ? [] : readJson<string[]>(SEEN, []),
}));

export const noteId = (n: Note) => `${n.coachId}:${n.at}`;

/** The notes from an overview, with each coach's name. */
export function shownNotes(o: Pick<Overview, "notes" | "coaches">): ShownNote[] {
  return (o.notes ?? []).map((n) => ({ ...n, coach: o.coaches.find((c) => c.id === n.coachId)?.name ?? "" }));
}

/** Keeps the latest notes for Today (Coaching calls it with what it loaded, so both agree). */
export function keepNotes(o: Pick<Overview, "notes" | "coaches"> & Partial<Pick<Overview, "clients" | "unread" | "targets">>): void {
  const notes = shownNotes(o);
  writeJson(CACHE, notes);
  const first = (o.targets ?? []).find((x) => o.coaches.some((c) => c.id === x.coachId));
  const targets = first ? { ...first, coach: o.coaches.find((c) => c.id === first.coachId)?.name ?? "" } : null;
  writeJson(TARGETS, targets);
  const people = [...o.coaches, ...(o.clients ?? [])];
  const unread = Object.entries(o.unread ?? {})
    .filter(([, n]) => n > 0)
    .map(([id, count]) => ({ id, count, name: people.find((p) => p.id === id)?.name ?? "" }));
  useCoachNotes.setState({ notes, unread, targets });
}

/** A chat was opened: its messages are read now. */
export function markRead(id: string): void {
  useCoachNotes.setState((s) => ({ unread: s.unread.filter((u) => u.id !== id) }));
}

let lastLook = 0;
/** Signed in: looks for new notes from the lifter's coaches, at most every 15 minutes. Quiet on any failure. */
export async function refreshCoachNotes(now = Date.now(), force = false): Promise<void> {
  if (!readAccount() || (!force && now - lastLook < EVERY)) return;
  lastLook = now;
  try {
    keepNotes(await loadOverview());
  } catch {
    // offline or signed out: keep what was there
  }
}

/** "Got it": hides this note on the device until the coach changes it. */
export function dismissNote(n: Note): void {
  const seen = [...useCoachNotes.getState().seen.filter((id) => id !== noteId(n)), noteId(n)].slice(-50);
  writeJson(SEEN, seen);
  useCoachNotes.setState({ seen });
}

/** Signed out, or the lifter erased their data: nothing from a coach stays on the device. */
export function forgetNotes(): void {
  writeJson(CACHE, []);
  writeJson(TARGETS, null);
  useCoachNotes.setState({ notes: [], unread: [], targets: null });
}
