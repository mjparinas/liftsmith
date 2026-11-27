"use client";

import { isAdminLink, openAdmin } from "./adminLink";
import { generatorHash } from "./genLink";
import { inviteAppPath, inviteOfUrl, keepInviteFrom } from "./invite";
import { APP_PATH } from "./site";
import { SITE_LANGS } from "./siteLang";
import { THIRTY_BY_SLUG } from "./thirtyDay";

// Android App Links (Melvin, 2026-11-11). Links to our own domain open the installed Android app when the domain is
// verified: the manifest's autoVerify intent filter claims the paths in APP_LINK_PATHS on www.getliftsmith.com, and
// public/.well-known/assetlinks.json names the app's signing certificates. The app then gets the link through
// @capacitor/app (`getLaunchUrl` on a cold start, `appUrlOpen` while running) and shows the screen in its fragment.
// iOS Universal Links are deferred (open-items.md); the paste box in Routines covers the iPhone meanwhile.
//
// Website pages too (Melvin, 2026-11-26: "When I open a link that opens up the Liftsmith website … It should redirect
// and take me to the app instead"): until then only /app and /invite were claimed, so a gym, routine, profile or
// exercise page always opened in the browser. Now every website page that has a screen in the app opens it there
// (webScreen below). Pages with no screen of their own (blog, guides, help, legal pages) stay on the website, and
// coaches' programs stay there on purpose: a paid program is bought on the website only (coach-programs.md), so the
// app must never catch its link. Any other link that carries ?invite=<code> keeps that invite for when the lifter
// joins Friends.

/** The hosts whose links open the app. The bare domain redirects to www, and verification doesn't follow redirects. */
export const LINK_HOSTS = ["www.getliftsmith.com"] as const;

/** Website sections that come in every site language (/de/exercises/…), besides the home page (/de/). */
const TRANSLATED = ["exercises", "programs", "tools", "pricing", "challenges"] as const;

/**
 * Every path the Android manifest claims, exactly as written there (`appLinks.test.ts` checks they match): `path`
 * entries are whole paths, `prefix` entries are path prefixes. Each one needs an answer in hashFromLink.
 */
export const APP_LINK_PATHS: { path?: string; prefix?: string }[] = [
  { path: "/" },
  { path: "/app" },
  { prefix: "/app/" },
  { prefix: "/invite/" },
  { prefix: "/u/" },
  { prefix: "/gyms/" },
  { prefix: "/gym-chains/" },
  { prefix: "/routines/" },
  { prefix: "/community/" },
  // The admin panel and its emailed sign-in link open in the app's browser tab, not a screen (adminLink.ts).
  { path: "/admin" },
  { prefix: "/admin/" },
  { prefix: "/api/admin/login/" },
  ...TRANSLATED.map((x) => ({ prefix: `/${x}/` })),
  ...SITE_LANGS.filter((l) => l !== "en").flatMap((l) => [
    { path: `/${l}` },
    { path: `/${l}/` },
    ...TRANSLATED.map((x) => ({ prefix: `/${l}/${x}/` })),
  ]),
];

// The website's tool pages (src/app/tools/) and the app's tool screens (#/tools/<arg>, Tools.tsx). One the app has
// no screen for opens the tools list.
const TOOL_ARGS: Record<string, string> = {
  "tdee-calculator": "tdee",
  "macro-calculator": "macros",
  "one-rep-max-calculator": "onerm",
  "plate-calculator": "plates",
  "warm-up-calculator": "warmup",
  "dots-calculator": "strength",
  "wilks-calculator": "strength",
  "strength-standards": "strength",
  "body-fat-calculator": "bodyfat",
  "ffmi-calculator": "ffmi",
  "heart-rate-zone-calculator": "hrzones",
  "interval-timer": "intervals",
};

const SLUG = /^[a-z0-9-]+$/;
/** The id at the end of a "<words>-<id>" page address (routines, community posts), as the server reads it. */
const idAtEnd = (slug: string) => /(?:^|-)([A-Za-z0-9]{12})$/.exec(slug)?.[1] ?? null;

/** The app screen for a website page, or null when the page has none. `parts` is the path's segments. */
function webScreen(parts: string[], u: URL): string | null {
  const [lang] = parts;
  if (lang && lang !== "en" && (SITE_LANGS as readonly string[]).includes(lang)) {
    const rest = parts.slice(1);
    return !rest.length || (TRANSLATED as readonly string[]).includes(rest[0]!) ? webScreen(rest, u) : null;
  }
  const [section, a, b] = parts;
  switch (section) {
    case undefined:
      return "#/today";
    case "u":
      return a ? `#/person/${encodeURIComponent(a)}` : "#/friends";
    case "gyms": {
      if (!a || !b || !SLUG.test(a) || !SLUG.test(b)) return "#/gyms";
      return `#/gymplace/${a}~${b}${u.searchParams.get("from") === "qr" ? "~qr" : ""}`;
    }
    case "gym-chains":
      return a && SLUG.test(a) ? `#/gymchain/${a}` : "#/gyms";
    case "routines": {
      const id = a ? idAtEnd(a) : null;
      return id ? `#/library/${id}` : "#/library";
    }
    case "community": {
      if (a === "roadmap") return "#/community/roadmap";
      const id = a ? idAtEnd(a) : null;
      return id ? `#/community/${id}` : "#/community";
    }
    case "exercises":
      return a && a !== "vs" && SLUG.test(a) ? `#/exercise/${a}` : "#/exercises";
    case "programs":
      return "#/programs";
    case "tools": {
      // The website's workout generator: the workout in the link, as a routine to save or start (genLink.ts).
      if (a === "workout-generator") return generatorHash(u.searchParams.get("w"));
      const arg = a ? TOOL_ARGS[a] : undefined;
      return arg ? `#/tools/${arg}` : "#/tools";
    }
    case "pricing":
      return "#/pro";
    case "challenges": {
      // A challenge page opens its challenge (thirtyDay.ts); the index and an unknown slug open the list.
      const c = a ? THIRTY_BY_SLUG.get(a) : undefined;
      return c ? `#/challenge/${c.id}` : "#/challenge";
    }
    default:
      return null;
  }
}

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
  if (path === APP_PATH || path === `${APP_PATH}index.html/`) return u.hash.startsWith("#/") ? u.hash : "#/today";
  if (path.startsWith(APP_PATH)) return "#/today";
  let parts: string[];
  try {
    parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  } catch {
    return null;
  }
  return webScreen(parts, u);
}

/** Listens for app links on Android and calls `open` with each one's hash. Returns the stop function. */
export async function startAppLinks(open: (hash: string) => void): Promise<() => void> {
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } }).Capacitor;
  if (!cap?.isNativePlatform?.() || cap.getPlatform?.() !== "android") return () => {};
  const { App } = await import("@capacitor/app");
  const go = (url: string | undefined) => {
    if (url && isAdminLink(url)) return void openAdmin(url);
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
