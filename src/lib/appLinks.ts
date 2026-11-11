"use client";

import { APP_PATH } from "./site";

// Android App Links (Melvin, 2026-11-11). Links to the web app on our own domain
// (https://www.getliftsmith.com/app/#/routine/…, #/remix/…) open the installed Android app when the
// domain is verified: the manifest's autoVerify intent filter claims /app on www.getliftsmith.com, and
// public/.well-known/assetlinks.json names the app's signing certificates. The app then gets the link
// through @capacitor/app (`getLaunchUrl` on a cold start, `appUrlOpen` while running) and shows the
// screen in its fragment. iOS Universal Links are deferred (open-items.md); the paste box in Routines
// covers the iPhone meanwhile.

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
  if (path !== APP_PATH && path !== `${APP_PATH}index.html/`) return null;
  return u.hash.startsWith("#/") ? u.hash : "#/today";
}

/** Listens for app links on Android and calls `open` with each one's hash. Returns the stop function. */
export async function startAppLinks(open: (hash: string) => void): Promise<() => void> {
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } }).Capacitor;
  if (!cap?.isNativePlatform?.() || cap.getPlatform?.() !== "android") return () => {};
  const { App } = await import("@capacitor/app");
  const go = (url: string | undefined) => {
    const hash = url ? hashFromLink(url) : null;
    if (hash) open(hash);
  };
  const handle = await App.addListener("appUrlOpen", (e) => go(e.url));
  try {
    go((await App.getLaunchUrl())?.url);
  } catch {}
  return () => void handle.remove();
}
