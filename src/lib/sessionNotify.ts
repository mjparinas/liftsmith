"use client";

import { t } from "./i18n";
import { isNative } from "./juice";
import { unlisten, type ListenerHandle } from "./nativeListen";

// The live workout notification. In the Capacitor shell this calls the native WorkoutSession
// plugin (a foreground service with a lock-screen countdown and Log set / +30 s buttons). On the
// web it uses a service worker notification that updates at each change, plus a timer for the
// end-of-rest alert while the page is open.

export interface SessionState {
  title: string;
  next: string;
  plates?: string;
  restUntil: number | null;
  /** The whole rest in seconds (+30 s included), for the rest bar on the Android notification and iOS Live Activity. */
  restTotal?: number;
  setLabel: string;
  hr?: number;
  /** Whether the native rest-over alert plays a sound and vibrates (Workout preferences › Rest-over alert). */
  sound?: boolean;
  vibrate?: boolean;
  /** A gentle buzz REST_WARN_S (10) seconds before rest ends, from the Android service and the watches (training.ts restWarnOn). */
  warn?: boolean;
  /** Voice coach: said by the Android service when rest ends (voice.ts). iOS and the web say it in the page. */
  speak?: string;
  /** The cue's language (the app's, which can differ from the phone's), so the speech engine uses the right voice. */
  speakLang?: string;
  /** A few characters for the Android 16 status bar chip and Now Bar, and iOS's compact Dynamic Island, while lifting
   *  (`chipText`). During rest the chip shows the countdown instead. */
  chip?: string;
  /** Working sets logged so far and planned in the whole workout, for the progress bar on both platforms. */
  done?: number;
  total?: number;
  /** The workout's id: the watch apps open themselves once per workout (watch-apps.md). */
  sessionId?: string;
  /** Labs, watch rep counting: the Wear OS or Apple Watch app streams its motion for this set (watchMotion.ts). */
  motion?: boolean;
  /** Labs, hands-free watch sets: keep streaming motion through rest too, so the phone sees the next set start (watchAuto.ts). */
  motionRest?: boolean;
  /** Labs, hands-free watch sets: the watch buzzes once each time this id changes (the set started or logged itself). */
  cue?: string;
  /** The notification after each of the next Log sets (sessionAhead.ts), so Log set works with the app closed. */
  ahead?: AheadStep[];
  /**
   * The set timer for holds, carries and cardio, phase by phase in wall-clock time (setTimer.ts timerPhases), so the
   * lock screen and the watches count it down on their own clocks while the app is asleep. Only while lifting.
   */
  timer?: TimerSegment[];
  /** What the lock screen and watches say when the last phase runs out ("Time's up"). */
  timerOver?: string;
  /** What the watches can change on this set before Log set: a ladder of weights and the reps (workout/watchAdjust.ts). */
  adj?: WatchAdj;
  /** After an exercise's last set: how did it feel, answered on the watch (workout/watchAdjust.ts watchAsk). */
  ask?: WatchAsk;
}

/**
 * The set's weight and reps as the watches change them with the crown, bezel, − / + or keys. `kg` is a ladder of
 * weights around the set's own, lightest first, with `w` the words for each ("102.5 lb", "20 kg each") and `i` where
 * the set's own weight is; both are empty for a bodyweight move (reps only). `key` names the set, and a weight and reps
 * sent back for another set are ignored.
 */
export interface WatchAdj {
  key: string;
  kg: number[];
  w: string[];
  i: number;
  reps: number;
  /** The word after the reps: "reps" or "reps each side", in the app's language. */
  rs: string;
}

/** "How did Bench press feel?" with three answers (`o`) and the rating each one sends (`v`: 1 too easy, 0, -1 too hard). */
export interface WatchAsk {
  ex: string;
  q: string;
  o: string[];
  v: number[];
}

/** What came with a watch's tap: the weight and reps it settled on (log, adjust), or its answer to `ask` (rate). */
export interface SessionPayload {
  key?: string;
  kg?: number;
  reps?: number;
  ex?: string;
  v?: number;
}

/** One phase of the set timer: a countdown to `to` labelled "Time left", "Switch sides"…, or a count-up from `from`. */
export interface TimerSegment {
  from: number;
  /** Absent for a count-up (cardio), which runs until the set is logged. */
  to?: number;
  label: string;
}

/** The phase showing at `now` (the last one that has started and not ended), or null. Every platform uses the same rule. */
export function timerSegmentAt(timer: readonly TimerSegment[] | undefined, now: number): TimerSegment | null {
  for (const x of timer ?? []) if (x.from <= now && (x.to === undefined || now < x.to)) return x;
  return null;
}

/** What the notification shows after one more Log set, worked out by the app ahead of time (sessionAhead.ts). */
export interface AheadStep {
  title: string;
  setLabel: string;
  next: string;
  plates?: string;
  /** The rest that starts at the tap, in seconds; 0 for none (the last set, or auto-start rest is off). */
  rest: number;
  chip?: string;
  done: number;
  total: number;
  /** Every planned set is logged: the notification says so and further taps do nothing. */
  end?: boolean;
  /** What the watches can change on that set, so a watch can adjust it with the app closed too. */
  adj?: WatchAdj;
}

/** The status bar chip while lifting: "2/4" for set 2 of 4, "W1/2" for a warm-up. Numbers only, so it fits the
 *  chip's 96 dp (Android shows the text only when it fits) in every language. */
export function chipText(warming: boolean, n: number, total: number): string {
  return `${warming ? "W" : ""}${n}/${total}`;
}

/**
 * Notification buttons send log and add30; voice and system shortcuts also send start (shortcuts.ts). The watches also
 * send adjust (a new weight or reps, a moment after the last turn of the crown) and rate (how the exercise felt).
 */
export type SessionAction = "log" | "add30" | "start" | "adjust" | "rate";
type Handle = ListenerHandle;
type Plugin = {
  update(s: SessionState): Promise<void>;
  stop(): Promise<void>;
  requestPermission(): Promise<{ granted: boolean }>;
  addListener(event: "action", cb: (e: { action: SessionAction; at?: number; data?: unknown }) => void): Handle | Promise<Handle>;
  addListener(event: "heartRate", cb: (e: { bpm: number }) => void): Handle | Promise<Handle>;
  addListener(event: "watchMotion", cb: (e: unknown) => void): Handle | Promise<Handle>;
};
const plugin = (): Plugin | undefined =>
  typeof window !== "undefined"
    ? (window as unknown as { Capacitor?: { Plugins?: { WorkoutSession?: Plugin } } }).Capacitor?.Plugins?.WorkoutSession
    : undefined;

export async function notifyPermission(): Promise<boolean> {
  const p = plugin();
  if (p && isNative()) return (await p.requestPermission()).granted;
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
}

export async function updateSession(s: SessionState) {
  const p = plugin();
  if (p && isNative()) return p.update(s);
  if (typeof Notification === "undefined" || Notification.permission !== "granted" || !("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return;
  const until = s.restUntil
    ? new Date(s.restUntil).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })
    : null;
  await reg.showNotification(s.title, {
    tag: "workout",
    body: [
      until ? t("workout.notify.until", { time: until }) : s.setLabel,
      t("workout.notify.next", { next: s.next }),
      s.plates,
      s.hr ? `♥ ${s.hr} bpm` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    silent: true,
    requireInteraction: true,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: "/app/#/workout" },
    // Web notifications can't count down, so the end of rest gets its own alert below.
  } as NotificationOptions);
}

export async function restOverAlert(next: string, alert: { sound: boolean; vibrate: boolean } = { sound: true, vibrate: true }) {
  if (isNative()) return; // the native service sounds its own alert
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const reg = await navigator.serviceWorker?.getRegistration();
  await reg?.showNotification(t("workout.notify.over"), {
    tag: "rest",
    body: t("workout.notify.next", { next }),
    silent: !alert.sound && !alert.vibrate,
    vibrate: alert.vibrate ? [200, 100, 200] : undefined,
    icon: "/icon-192.png",
  } as NotificationOptions);
}

/**
 * Log set / +30 s on the native notification, and the voice and system shortcuts. `at` is when it was tapped: a tap
 * made with the app closed (or asleep in the background) reaches the app when it next runs, and is logged at its own
 * time, not then. Returns an unsubscribe function.
 */
export function onSessionAction(cb: (a: SessionAction, at?: number, data?: SessionPayload) => void): () => void {
  const p = plugin();
  if (!p || !isNative()) return () => {};
  return unlisten(p.addListener("action", (e) => cb(e.action, tapTime(e.at), tapData(e.data))));
}

/**
 * What came with a watch's tap, read field by field: a JSON string (Android keeps it as text) or an object (iOS).
 * Only numbers and short strings pass; the shortcut code then checks them against the set (watchAdjust.ts).
 */
export function tapData(d: unknown): SessionPayload | undefined {
  let o: unknown = d;
  if (typeof d === "string") {
    if (d.length > 500) return undefined;
    try {
      o = JSON.parse(d);
    } catch {
      return undefined;
    }
  }
  if (!o || typeof o !== "object") return undefined;
  const r = o as Record<string, unknown>;
  const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
  const str = (x: unknown) => (typeof x === "string" && x.length <= 120 ? x : undefined);
  const out: SessionPayload = { key: str(r.key), kg: num(r.kg), reps: num(r.reps), ex: str(r.ex), v: num(r.v) };
  return Object.values(out).some((x) => x !== undefined) ? out : undefined;
}

/** A tap's time from the native side: a real past moment (not in the future, not over a day old), else undefined (now). */
export function tapTime(at: unknown, now = Date.now()): number | undefined {
  return typeof at === "number" && Number.isFinite(at) && at <= now && at > now - 86400_000 ? Math.round(at) : undefined;
}

/** Heart rate from the watch app's own sensor (Wear OS or Apple Watch), about every 2 s. Returns an unsubscribe function. */
export function onWatchHeartRate(cb: (bpm: number) => void): () => void {
  const p = plugin();
  if (!p || !isNative()) return () => {};
  return unlisten(p.addListener("heartRate", (e) => cb(e.bpm)));
}

/** Motion batches from the watch app while `motion` is on (Labs, watch rep counting), read by parseWatchMotion. */
export function onWatchMotion(cb: (batch: unknown) => void): () => void {
  const p = plugin();
  if (!p || !isNative()) return () => {};
  return unlisten(p.addListener("watchMotion", cb));
}

export async function stopSession() {
  const p = plugin();
  if (p && isNative()) return p.stop();
  const reg = typeof navigator !== "undefined" ? await navigator.serviceWorker?.getRegistration() : undefined;
  for (const n of (await reg?.getNotifications()) ?? []) n.close();
}
