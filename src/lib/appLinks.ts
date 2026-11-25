"use client";

import { inviteAppPath, inviteOfUrl, keepInviteFrom } from "./invite";
import { APP_PATH } from "./site";

// App Links / Universal Links (Melvin, 2026-11-11; iOS 2026-11-23). Links to the web app on our own domain
// (https://www.getliftsmith.com/app/#/routine/…, #/remix/…) open the installed app when the domain is
// verified: Android's manifest autoVerify intent filter claims /app on www.getliftsmith.com with
// public/.well-known/assetlinks.json; iOS uses Associated Domains (applinks:www.getliftsmith.com) and
// public/.well-known/apple-app-site-association. The app then gets the link through @capacitor/app
// (`getLaunchUrl` on a cold start, `appUrlOpen` while running) and shows the screen in its fragment.
// Invite links (www.getliftsmith.com/invite/<code>, 2026-11-15) are claimed too and open the invite
// screen; any other link that carries ?invite=<code> keeps that invite for when the lifter joins Friends.

/** The hosts whose links open the app. The bare domain redirects to www, and verification doesn't follow redirects. */
export const LINK_HOSTS = ["www.getliftsmith.com"] as const;

/** The app screen (a `#/…` hash) a link points to, or null when it isn't a link into the app. */
export function hashFromLink(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || !(LINK_HOSTS as readonly string[]).includes(u.hostname)) return null;
  const path = u.pathname.endsWith("/") ? u.pathname : `${u.pathname}/`;
  if (path.startsWith("/invite/")) {
    const code = inviteOfUrl(u.toString());
    return code ? inviteAppPath(code).slice(APP_PATH.length) : "#/today";
  }
  if (path !== APP_PATH && path !== `${APP_PATH}index.html/`) return null;
  return u.hash.startsWith("#/") ? u.hash : "#/today";
}

/** Listens for app links on Android and Universal Links on iOS; calls `open` with each one's hash. Returns the stop function. */
export async function startAppLinks(open: (hash: string) => void): Promise<() => void> {
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } }).Capacitor;
  if (!cap?.isNativePlatform?.()) return () => {};
  const platform = cap.getPlatform?.();
  if (platform !== "android" && platform !== "ios") return () => {};
  const { App } = await import("@capacitor/app");
  const go = (url: string | undefined) => {
    const hash = url ? hashFromLink(url) : null;
    if (!hash || !url) return;
    keepInviteFrom(url);
    open(hash);
  };
  const handle = await App.addListener("appUrlOpen", (e) => go(e.url));
  try {
    go((await App.getLaunchUrl())?.url);
  } catch {}
  return () => void handle.remove();
}
