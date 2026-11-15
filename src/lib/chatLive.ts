"use client";

// Who's online in coach chat, and the alert when a message comes in (Melvin, 2026-11-13: "We need audible alerts when
// messages come through"; docs/decisions/trainer-mode.md "Chat dock, statuses and stickers"). One store for the chat
// dock and the Messages page: everyone the lifter can message with their status, unread count, typing and newest
// message, and the lifter's own status. It asks the server every 20 seconds while a screen that shows it is on the
// screen and the app is in front, and shows the copy kept on the device first (liveRead). The one thing that keeps
// asking in the background is the desktop dock, once a minute while its browser tab is hidden, because an alert that
// only comes once you look isn't an alert; phones never do (docs/decisions/battery.md), they get a push instead. A message that arrives while it watches plays the message sound once and puts the count in
// the browser tab's title.
import { useEffect } from "react";
import { create } from "zustand";

import type { Status } from "./coachStatus";
import { sound } from "./juice";
import { liveRead } from "./liveRead";
import { loadLive, saveStatus, type Live, type Message } from "./trainer";
import { isVisible, onVisibility } from "./visibility";

export const LIVE_POLL_MS = 20_000;
/** The desktop dock's pace while its tab is hidden (browsers slow hidden tabs to about this anyway). */
export const LIVE_HIDDEN_MS = 60_000;

type LiveState = { live: Live | null };
export const useLive = create<LiveState>(() => ({ live: null }));

/** The newest incoming message already chimed for, so the dock and an open thread never chime twice for one. */
let chimedAt = 0;

/**
 * Chimes once for an incoming message newer than any chimed before. The first look after opening only sets the mark:
 * messages that were already waiting don't ring.
 */
export function chimeFor(m: Pick<Message, "at"> | undefined, first = false): boolean {
  if (!m || m.at <= chimedAt) return false;
  chimedAt = m.at;
  if (first) return false;
  sound.message();
  return true;
}

/** For tests: forget what was chimed. */
export function resetChime(at = 0) {
  chimedAt = at;
}

/** Unread messages across everyone. */
export const unreadTotal = (live: Live | null) => (live?.people ?? []).reduce((n, p) => n + p.unread, 0);

/** The tab's title with the unread count in front, "(2) Liftsmith", or the plain title when there's none. */
export function titleWith(title: string, unread: number): string {
  const plain = title.replace(/^\(\d+\+?\) /, "");
  return unread > 0 ? `(${unread > 99 ? "99+" : unread}) ${plain}` : plain;
}

let seenOnce = false;

/** Asks the server once and stores the answer; chimes for anything new from someone else. */
export async function refreshLive(me: string): Promise<void> {
  await liveRead<Live>("coach.live", loadLive, (live, fresh) => {
    useLive.setState({ live });
    if (!fresh) return;
    const incoming = live.people
      .map((p) => p.last)
      .filter((m): m is Message => !!m && m.from !== me)
      .sort((a, b) => b.at - a.at)[0];
    // Only unread ones ring: a message read on another device doesn't.
    const waiting = live.people.some((p) => p.unread > 0 && p.last && p.last.from !== me && p.last.at === incoming?.at);
    if (waiting || !seenOnce) chimeFor(incoming, !seenOnce);
    seenOnce = true;
  });
}

/**
 * Keeps the store fresh while a screen that shows it is open and the app is in front; with `background` (the desktop
 * dock) it keeps asking once a minute while the tab is hidden too.
 */
export function useLivePoll(me: string | null, on = true, background = false): void {
  useEffect(() => {
    if (!me || !on) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = () => void refreshLive(me).catch(() => undefined);
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const start = (visible: boolean) => {
      stop();
      if (!visible && !background) return;
      if (visible) tick();
      timer = setInterval(tick, visible ? LIVE_POLL_MS : LIVE_HIDDEN_MS);
    };
    start(isVisible());
    const off = onVisibility(start);
    return () => {
      stop();
      off();
    };
  }, [me, on, background]);
}

/** Keeps the browser tab's title showing the unread count while the dock is on screen. */
export function useUnreadTitle(on: boolean): void {
  const unread = useLive((s) => unreadTotal(s.live));
  useEffect(() => {
    if (!on || typeof document === "undefined") return;
    document.title = titleWith(document.title, unread);
    return () => {
      document.title = titleWith(document.title, 0);
    };
  }, [on, unread]);
}

/** Picks this lifter's status, showing it at once and putting it back if the server says no. */
export async function pickStatus(status: Status, until = 0): Promise<void> {
  const before = useLive.getState().live;
  if (before) useLive.setState({ live: { ...before, me: { status, until } } });
  try {
    const r = await saveStatus(status, until);
    const now = useLive.getState().live;
    if (now) useLive.setState({ live: { ...now, me: r } });
  } catch (e) {
    useLive.setState({ live: before });
    throw e;
  }
}

/** A thread was read here: its count goes from the dock at once, before the next answer from the server. */
export function clearUnread(id: string): void {
  const live = useLive.getState().live;
  if (!live?.people.some((p) => p.id === id && p.unread > 0)) return;
  useLive.setState({ live: { ...live, people: live.people.map((p) => (p.id === id ? { ...p, unread: 0 } : p)) } });
}
