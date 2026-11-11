"use client";

// Friends and the workout feed, the app side (server: src/server/social.ts; decision record docs/decisions/friends.md).
// Everything goes through one route, POST /api/social/, with the account token. Pure web code: the phones call
// it on SITE_URL like sync does, so Android, iOS and the web app get it together.
import { create } from "zustand";

import type { MessageKey } from "@/locales/en";

import { api, AuthError, readAccount } from "./auth";
import type { SessionSummary } from "./derive";
import { EXERCISE_BY_ID } from "./exercises";
import { flag } from "./flags";
import { t } from "./i18n";
import { estimate } from "./onerm";
import { encodeRoutine } from "./routineShare";
import { musclesWorked } from "./shareCards";
import { SITE_URL } from "./site";
import type { Audience, FeedPost, PostBody, PostExercise, ShowcaseLift, SocialProfile } from "./socialTypes";
import type { AppEvent } from "./types";

export async function social<T = Record<string, unknown>>(op: string, body: Record<string, unknown> = {}): Promise<T> {
  const account = readAccount();
  if (!account) throw new AuthError("signedOut", 401);
  return api<T>("/api/social/", { token: account.token, body: { op, ...body } });
}

/** Whether Friends shows at all: the admin switch (flag `social`). */
export const socialOn = () => flag("social") !== false;

/** The words for a refusal from the server. */
export function socialError(e: unknown): string {
  const code = e instanceof AuthError ? e.message : "";
  const known: Record<string, MessageKey> = {
    offline: "friends.err.offline",
    slow: "friends.err.slow",
    handle: "friends.err.handle",
    handleTaken: "friends.err.handleTaken",
    "name.link": "friends.err.link",
    "name.words": "friends.err.words",
    "comment.link": "friends.err.link",
    "comment.words": "friends.err.words",
    "caption.link": "friends.err.link",
    "caption.words": "friends.err.words",
    noOne: "friends.err.noOne",
    gone: "friends.err.gone",
    suspended: "friends.err.suspended",
    off: "friends.err.off",
    old: "friends.err.old",
    notFriends: "friends.err.notFriends",
    code: "friends.err.code",
    signedOut: "friends.err.signedOut",
    "Signed out. Sign in again.": "friends.err.signedOut",
  };
  return t(known[code] ?? "friends.err.failed");
}

export interface SocialMe {
  profile: SocialProfile | null;
  suspended?: boolean;
  followers?: number;
  following?: number;
  requests?: number;
  unread?: number;
}

interface SocialState {
  me: SocialMe | null;
  /** The last refresh failed (offline, or the server said no). */
  error: string | null;
  loading: boolean;
}

export const useSocial = create<SocialState>(() => ({ me: null, error: null, loading: false }));

let inflight: Promise<void> | null = null;
/** Reads the lifter's own Friends state. Signed out, it's simply nothing. */
export function refreshSocial(): Promise<void> {
  if (!readAccount() || !socialOn()) {
    useSocial.setState({ me: null, error: null, loading: false });
    return Promise.resolve();
  }
  inflight ??= (async () => {
    useSocial.setState({ loading: true });
    try {
      useSocial.setState({ me: await social<SocialMe>("me"), error: null });
    } catch (e) {
      useSocial.setState({ error: socialError(e) });
    } finally {
      useSocial.setState({ loading: false });
      inflight = null;
    }
  })();
  return inflight;
}

/** A public profile's web page (src/server/publicProfile.ts). */
export const publicPageUrl = (handle: string) => `${SITE_URL}/u/${handle}/`;
/** The link a lifter shares: their public page when the profile is public, else the profile in the app. */
export const profileUrl = (handle: string, isPublic = false) => (isPublic ? publicPageUrl(handle) : `${SITE_URL}/app/#/person/${handle}`);

/**
 * The post for a finished workout: per exercise its sets and best set (by estimated one-rep max), the totals,
 * and the muscles worked. Weights only while the lifter shows weights. Nothing else from the log goes on it.
 */
export function postBodyFor(events: readonly AppEvent[], s: SessionSummary, weights: boolean): PostBody {
  const by = new Map<string, { sets: number; best: { w: number; r: number; d?: number; score: number } | null }>();
  for (const e of events) {
    if (e.type !== "set" || e.sessionId !== s.sessionId) continue;
    const row = by.get(e.exerciseId) ?? { sets: 0, best: null };
    row.sets++;
    const score = e.distanceM ?? (e.weight > 0 ? estimate(e.weight, e.reps) : e.reps);
    if (!row.best || score > row.best.score) row.best = { w: e.weight, r: e.reps, ...(e.distanceM ? { d: e.distanceM } : {}), score };
    by.set(e.exerciseId, row);
  }
  const exercises: PostExercise[] = [...by.entries()].slice(0, 20).map(([id, row]) => ({
    id,
    name: (EXERCISE_BY_ID.get(id)?.name ?? id).slice(0, 60),
    sets: row.sets,
    w: weights ? (row.best?.w ?? 0) : null,
    r: row.best?.r ?? 0,
    ...(row.best?.d ? { d: row.best.d } : {}),
  }));
  return {
    v: 1,
    seconds: Math.round(s.seconds),
    sets: s.sets,
    volume: weights ? Math.round(s.volume) : null,
    prs: s.prs,
    muscles: musclesWorked(s.exercises, 6),
    exercises,
  };
}

export async function postWorkout(
  events: readonly AppEvent[],
  s: SessionSummary,
  weights: boolean,
  extra: { caption?: string; audience?: Audience } = {},
): Promise<string> {
  const r = await social<{ id: string }>("post", { workoutId: s.sessionId, at: s.start, body: postBodyFor(events, s, weights), ...extra });
  return r.id;
}

/**
 * The lifter's best lifts for their profile's showcase: the three exercises with the highest estimated one-rep
 * max, each with the set behind it. Loaded sets only (no cardio, no sets done lighter for an injury).
 */
export function bestLifts(events: readonly AppEvent[], count = 3): ShowcaseLift[] {
  const best = new Map<string, { lift: ShowcaseLift; score: number }>();
  for (const e of events) {
    if (e.type !== "set" || e.weight <= 0 || e.reps < 1 || e.reps > 100 || e.injuryPct || e.distanceM) continue;
    const ex = EXERCISE_BY_ID.get(e.exerciseId);
    if (!ex || ex.cardio) continue;
    const score = estimate(e.weight, e.reps);
    const had = best.get(e.exerciseId);
    const lift = { id: e.exerciseId, w: Math.round(e.weight * 100) / 100, r: e.reps, at: Math.round(e.at) };
    if (!had || score > had.score) best.set(e.exerciseId, { lift, score });
  }
  return [...best.values()]
    .sort((a, b) => b.score - a.score || a.lift.id.localeCompare(b.lift.id))
    .slice(0, count)
    .map((x) => x.lift);
}

const sameLifts = (a: readonly ShowcaseLift[], b: readonly ShowcaseLift[]) =>
  a.length === b.length && a.every((x, i) => x.id === b[i]!.id && x.w === b[i]!.w && x.r === b[i]!.r);

/**
 * What the server should hold for this lifter but doesn't yet: the avatar picked in the Locker (or Friends
 * settings) and the best lifts, both worked out on the device. Null when nothing changed, so nothing is sent.
 */
export function profileChanges(p: SocialProfile, avatar: string, lifts: readonly ShowcaseLift[]): Record<string, unknown> | null {
  const out: Record<string, unknown> = {};
  if ((avatar || "") !== (p.avatar || "")) out.avatar = avatar;
  if (!sameLifts(p.lifts, lifts)) out.lifts = lifts;
  return Object.keys(out).length ? out : null;
}

/**
 * A friend's posted workout as a routine link code: the exercises in order with their set counts, ready for the
 * shared-routine preview's Save. Custom exercises the app doesn't know are left out. Null when none are left.
 */
export function postRoutineCode(post: Pick<FeedPost, "name" | "body">): string | null {
  const items = post.body.exercises.filter((e) => EXERCISE_BY_ID.has(e.id)).map((e) => ({ exerciseId: e.id, sets: e.sets }));
  if (!items.length) return null;
  return encodeRoutine({ name: t("friends.post.routineName", { name: post.name }), items });
}
