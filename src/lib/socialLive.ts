"use client";

// Training now and cheers (Melvin, 2026-11-12, Friends gap list 2: item 4; docs/decisions/friends.md). While
// "Show friends when I'm training" is on, the app tells the server what the lifter is doing: the workout started,
// each logged set (the exercise on screen, sets done of the total), and the end. Mutual friends see that on their
// Feed and can send a cheer, which floats up the lifter's workout screen. Event-driven, like sync: a call on each
// change, never on a timer, so nothing runs while the app is away (docs/decisions/battery.md).
import { readAccount } from "./auth";
import { onPushWhileOpen } from "./push";
import { social, socialOn, useSocial } from "./social";
import type { CheerIn } from "./socialTypes";
import { useApp } from "./store";
import type { Active } from "./store/workout";
import type { AppEvent } from "./types";

export interface LiveNow {
  sessionId: string;
  exercise: string;
  done: number;
  total: number;
}

/** What the server is told about the workout in progress, or null when there's none. */
export function liveNow(active: Pick<Active, "sessionId" | "plan" | "index"> | null, events: readonly AppEvent[]): LiveNow | null {
  if (!active) return null;
  let done = 0;
  for (const e of events) if (e.type === "set" && e.sessionId === active.sessionId) done++;
  const planned = active.plan.items.reduce((n, i) => n + i.sets, 0);
  return {
    sessionId: active.sessionId,
    exercise: active.plan.items[active.index]?.exerciseId ?? "",
    done,
    total: Math.max(done, planned),
  };
}

/** A refresh so a long set or rest doesn't drop off friends' Feed (the server forgets a workout after 20 minutes). */
const REFRESH_MS = 10 * 60_000;

/**
 * Keeps the server's "training now" in step with the workout in progress while the lifter has it on. Returns an
 * unsubscribe function. Calls only when something changed (or 10 minutes passed, checked on the next change).
 */
export function startLive(): () => void {
  let sent = "";
  let sentAt = 0;
  let wasOn = false;
  const push = () => {
    const on = !!readAccount() && socialOn() && !!useSocial.getState().me?.profile?.live;
    const { active, events } = useApp.getState();
    const now = on ? liveNow(active, events) : null;
    const key = now ? `${now.sessionId}|${now.exercise}|${now.done}|${now.total}` : "";
    if (!now) {
      // Tell the server once that it's over (the workout ended, or the switch went off mid-workout).
      if (wasOn && sent) void social("live", { on: false }).catch(() => undefined);
      sent = "";
      wasOn = on;
      return;
    }
    wasOn = true;
    if (key === sent && Date.now() - sentAt < REFRESH_MS) return;
    sent = key;
    sentAt = Date.now();
    void social("live", { ...now }).catch(() => {
      sent = "";
    });
  };
  push();
  const offApp = useApp.subscribe((s, prev) => {
    if (s.active !== prev.active || s.events !== prev.events) push();
  });
  const offSocial = useSocial.subscribe((s, prev) => {
    if (s.me?.profile?.live !== prev.me?.profile?.live) push();
  });
  return () => {
    offApp();
    offSocial();
  };
}

/** Cheers for this workout after `since`, oldest first. Empty when signed out, off, or offline. */
export async function loadCheers(sessionId: string, since: number): Promise<CheerIn[]> {
  if (!readAccount() || !socialOn() || !useSocial.getState().me?.profile?.live) return [];
  try {
    return (await social<{ cheers: CheerIn[] }>("cheers", { sessionId, since })).cheers;
  } catch {
    return [];
  }
}

/** Calls `cb` when a cheer's push arrives while the app is open (phones only). */
export const onCheerPush = (cb: () => void) => onPushWhileOpen((kind) => kind === "cheer" && cb());
