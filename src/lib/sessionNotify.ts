"use client";
import { isNative } from "./juice";

// The live workout notification. In the Capacitor shell this calls the native WorkoutSession
// plugin (a foreground service with a lock-screen countdown and Log set / +30 s buttons). On the
// web it uses a service worker notification that updates at each change, plus a timer for the
// end-of-rest alert while the page is open.

export interface SessionState {
  title: string;
  next: string;
  plates?: string;
  restUntil: number | null;
  setLabel: string;
  hr?: number;
  /** Whether the native rest-over alert plays a sound (vibration always runs). */
  sound?: boolean;
}

export type SessionAction = "log" | "add30";
type Handle = { remove(): Promise<void> };
type Plugin = {
  update(s: SessionState): Promise<void>;
  stop(): Promise<void>;
  requestPermission(): Promise<{ granted: boolean }>;
  addListener(event: "action", cb: (e: { action: SessionAction }) => void): Promise<Handle>;
};
const plugin = (): Plugin | undefined => (typeof window !== "undefined" ? (window as unknown as { Capacitor?: { Plugins?: { WorkoutSession?: Plugin } } }).Capacitor?.Plugins?.WorkoutSession : undefined);

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
  const until = s.restUntil ? new Date(s.restUntil).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" }) : null;
  await reg.showNotification(s.title, {
    tag: "workout",
    body: [until ? `Rest until ${until}` : s.setLabel, `Next: ${s.next}`, s.plates, s.hr ? `♥ ${s.hr} bpm` : null].filter(Boolean).join("\n"),
    silent: true,
    requireInteraction: true,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: "/app/#/workout" },
    // Web notifications can't count down, so the end of rest gets its own alert below.
  } as NotificationOptions);
}

export async function restOverAlert(next: string) {
  if (isNative()) return; // the native service sounds its own alert
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const reg = await navigator.serviceWorker?.getRegistration();
  await reg?.showNotification("Rest over", { tag: "rest", body: `Up next: ${next}`, vibrate: [200, 100, 200], icon: "/icon-192.png" } as NotificationOptions);
}

/** Log set / +30 s buttons on the native notification. Returns an unsubscribe function. */
export function onSessionAction(cb: (a: SessionAction) => void): () => void {
  const p = plugin();
  if (!p || !isNative()) return () => {};
  const handle = p.addListener("action", (e) => cb(e.action));
  return () => void handle.then((h) => h.remove());
}

export async function stopSession() {
  const p = plugin();
  if (p && isNative()) return p.stop();
  const reg = typeof navigator !== "undefined" ? await navigator.serviceWorker?.getRegistration() : undefined;
  for (const n of (await reg?.getNotifications()) ?? []) n.close();
}
