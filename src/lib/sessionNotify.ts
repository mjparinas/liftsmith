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
}

/** The status bar chip while lifting: "2/4" for set 2 of 4, "W1/2" for a warm-up. Numbers only, so it fits the
 *  chip's 96 dp (Android shows the text only when it fits) in every language. */
export function chipText(warming: boolean, n: number, total: number): string {
  return `${warming ? "W" : ""}${n}/${total}`;
}

/** Notification buttons send log and add30; voice and system shortcuts also send start (shortcuts.ts). */
export type SessionAction = "log" | "add30" | "start";
type Handle = ListenerHandle;
type Plugin = {
  update(s: SessionState): Promise<void>;
  stop(): Promise<void>;
  requestPermission(): Promise<{ granted: boolean }>;
  addListener(event: "action", cb: (e: { action: SessionAction }) => void): Handle | Promise<Handle>;
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

/** Log set / +30 s on the native notification, and the voice and system shortcuts. Returns an unsubscribe function. */
export function onSessionAction(cb: (a: SessionAction) => void): () => void {
  const p = plugin();
  if (!p || !isNative()) return () => {};
  return unlisten(p.addListener("action", (e) => cb(e.action)));
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
