"use client";

// Friends push notifications on the phones (docs/decisions/friends.md; the server side is src/server/push.ts).
// Once the lifter has joined Friends, the app registers this phone's push token with their account: Firebase
// Cloud Messaging on Android (only in builds that carry Firebase's config, which InstallInfo reports, because
// asking Firebase without it crashes) and APNs on iOS. The permission prompt shows only when the lifter acts:
// joining Friends, or turning a notification switch on. A tap opens the screen the push points to. Signing out or
// leaving Friends drops the token. The web app has none (the people button's dot carries it; Platform deltas).
// Coaching (trainer-mode.md) uses the same token for chat messages and a coach's alerts: the Coaching screen registers
// it once the lifter has a coach or a client, asking for permission when they send their first message.
import { PushNotifications, type Token } from "@capacitor/push-notifications";

import { currentLang, t } from "./i18n";
import { installInfo } from "./installInfo";
import { isNative } from "./juice";
import { social } from "./social";
import { coachPushToken } from "./trainer";

const TOKEN_KEY = "liftsmith.pushToken";

let listening = false;

async function canPush(): Promise<boolean> {
  if (!isNative()) return false;
  return !!(await installInfo())?.push;
}

/**
 * Registers this phone for Friends pushes. With `ask`, shows the permission prompt if it hasn't been answered;
 * without it, registers only when permission is already granted. Returns whether pushes can arrive.
 */
export async function startPush(ask = false): Promise<boolean> {
  try {
    if (!(await canPush())) return false;
    let perm = (await PushNotifications.checkPermissions()).receive;
    if (perm !== "granted" && ask && (perm === "prompt" || perm === "prompt-with-rationale")) {
      perm = (await PushNotifications.requestPermissions()).receive;
    }
    if (perm !== "granted") return false;
    listen();
    await PushNotifications.createChannel({ id: "friends", name: t("push.channel"), importance: 3, visibility: 0 }).catch(() => undefined);
    await PushNotifications.register();
    return true;
  } catch {
    return false;
  }
}

function listen() {
  if (listening) return;
  listening = true;
  void PushNotifications.addListener("registration", (tok: Token) => {
    const platform =
      (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor?.getPlatform?.() === "ios" ? "ios" : "android";
    // Friends takes it only after joining; coaching takes it from any signed-in account (trainer-mode.md), so a coach
    // or client who never joined Friends still gets messages and alerts.
    const lang = currentLang();
    void Promise.allSettled([social("pushToken", { token: tok.value, platform, lang }), coachPushToken(tok.value, platform, lang)]).then(
      (r) => {
        if (!r.some((x) => x.status === "fulfilled")) return;
        try {
          localStorage.setItem(TOKEN_KEY, tok.value);
        } catch {}
      },
    );
  });
}

/**
 * A push that arrives while the app is open isn't drawn by the system (Android hands it to the app; iOS does too
 * without presentation options), so refresh Friends instead: the tab badge and Activity show it straight away. A
 * cheer also rains on the workout screen (`kind` is the push's kind, "cheer").
 */
export function onPushWhileOpen(cb: (kind: string) => void): () => void {
  if (!isNative()) return () => {};
  let remove: (() => void) | null = null;
  let gone = false;
  void PushNotifications.addListener("pushNotificationReceived", (n) => {
    const kind = (n.data as { kind?: unknown } | undefined)?.kind;
    cb(typeof kind === "string" ? kind : "");
  })
    .then((h) => (gone ? void h.remove() : (remove = () => void h.remove())))
    .catch(() => undefined);
  return () => {
    gone = true;
    remove?.();
  };
}

/** Taps on a Friends push open its screen (`#/friends`, `#/routine/<code>`). Returns an unsubscribe function. */
export function onPushTap(cb: (route: string) => void): () => void {
  if (!isNative()) return () => {};
  let remove: (() => void) | null = null;
  let gone = false;
  void PushNotifications.addListener("pushNotificationActionPerformed", (a) => {
    const route = (a.notification.data as { route?: unknown } | undefined)?.route;
    if (typeof route === "string" && route.startsWith("#/")) cb(route);
  })
    .then((h) => (gone ? void h.remove() : (remove = () => void h.remove())))
    .catch(() => undefined);
  return () => {
    gone = true;
    remove?.();
  };
}

/** Drops this phone's token from the account (before signing out, or after leaving Friends). */
export async function stopPush(): Promise<void> {
  let token: string | null = null;
  try {
    token = localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
  if (token) await social("pushOff", { token }).catch(() => undefined);
  if (isNative()) await PushNotifications.unregister().catch(() => undefined);
}
