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
import { musclesWorked } from "./shareCards";
import { SITE_URL } from "./site";
import type { PostBody, PostExercise, SocialProfile } from "./socialTypes";
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

export async function postWorkout(events: readonly AppEvent[], s: SessionSummary, weights: boolean): Promise<string> {
  const r = await social<{ id: string }>("post", { workoutId: s.sessionId, at: s.start, body: postBodyFor(events, s, weights) });
  return r.id;
}
