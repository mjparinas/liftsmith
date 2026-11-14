"use client";

import { useEffect, useState } from "react";

// Every screen in the app, one per line so two changes adding a screen don't touch the same line.
// App.tsx maps each one to its component (a Record<Route, ...>, so a new route needs a screen).
export const ROUTES = [
  "today",
  "workout",
  "recovery",
  "stats",
  "gym",
  "settings",
  "done",
  "setup",
  "feedback",
  "achievements",
  "recap",
  "photos",
  "programs",
  "injuries",
  "training",
  "tools",
  "remix",
  "pro",
  "account",
  "connections",
  "stretch",
  "routine",
  "friends",
  "person",
  "invite",
  "club",
  "trainer",
  "exercise",
  "exercises",
  "gymlink",
  "gymplace",
  "gymclaim",
  "gymedit",
  "gymstaff",
  "gymadd",
  "log",
] as const;
export type Route = (typeof ROUTES)[number];

// The name each screen has in the address bar, when it isn't the route's own (Melvin, 2026-11-14: the web URL says
// what the screen is called). The old names keep working: a link, bookmark, notification or older app that opens
// #/stats lands on Progress and the address is rewritten to #/progress. Links other people open (coach invites, shared
// routines, gyms and clubs) are still made with the old names, so an older app on someone's phone can open them.
export const URL_NAMES: Partial<Record<Route, string>> = {
  stats: "progress",
  achievements: "awards",
  trainer: "coaching",
  gym: "gyms",
  stretch: "stretching",
  training: "workout-preferences",
};
// The Body tab's two views have their own addresses (#/muscles, #/health); the old #/recovery opens the view the
// tab would open. The route stays "recovery", with the view as its argument.
export const BODY_VIEWS = ["muscles", "health"] as const;
export type BodyView = (typeof BODY_VIEWS)[number];

const BY_NAME = new Map<string, Route>([
  ...ROUTES.map((r) => [r, r] as const),
  ...Object.entries(URL_NAMES).map(([r, name]) => [name, r as Route] as const),
]);

export function parse(hash: string): { route: Route; arg?: string } {
  const [, r = "", arg] = hash.replace(/^#/, "").split("/");
  if ((BODY_VIEWS as readonly string[]).includes(r)) return { route: "recovery", arg: r };
  const route = BY_NAME.get(r) ?? "today";
  return { route, arg };
}

// The Body view to open when none is named (the one the lifter last looked at, Health without Pro). Set by the Body
// screen, which knows; until then Muscles.
let bodyView: () => BodyView = () => "muscles";
export function setBodyView(pick: () => BodyView) {
  bodyView = pick;
}

/** The address of a screen: #/progress for Progress, #/muscles or #/health for Body. */
export function hashOf(route: Route, arg?: string): string {
  if (route === "recovery") return `#/${(BODY_VIEWS as readonly string[]).includes(arg ?? "") ? arg : bodyView()}`;
  return `#/${URL_NAMES[route] ?? route}${arg ? `/${arg}` : ""}`;
}

/** The address a hash should show: an old name swapped for the screen's own, everything after it kept. */
export function canonical(hash: string): string {
  const m = /^#\/([^/]*)(.*)$/.exec(hash);
  if (!m) return hash;
  const [, name = "", rest = ""] = m;
  if (name === "recovery") return hashOf("recovery");
  const route = BY_NAME.get(name);
  const want = route && URL_NAMES[route];
  return want && want !== name ? `#/${want}${rest}` : hash;
}

/** Whether this address is that screen, under its own name or an old one. */
export const isRoute = (hash: string, route: Route) => /^#\//.test(hash) && parse(hash).route === route;

// The app's own history (AGENTS.md "Back button"). Each history entry the app makes carries how many of
// the app's screens sit behind it and which screen that is, so back can tell "previous screen" from "left
// the app", and a screen's own "‹ Back" link can step back instead of stacking a new entry on top.
type Entry = { ls: 1; depth: number; prev: string; hash: string };
let lastDepth = 0;
let lastHash = "";
let tracking = false;

/**
 * This entry's record, kept under its own key beside Next.js's router state (which must stay, or its
 * router puts the old URL back). A new entry from a hash change can carry a copy of the last entry's
 * state, so the record only counts when its hash matches.
 */
function entry(): Entry | null {
  const s: unknown = history.state;
  if (!s || typeof s !== "object") return null;
  const e = (s as { __ls?: Partial<Entry> }).__ls;
  return e && e.ls === 1 && e.hash === location.hash ? (e as Entry) : null;
}

// Next.js's router state from the last entry that had it. A hash change makes an entry without it, and
// Next reloads the page when back lands on such an entry, so every entry the app stamps carries a copy.
let nextState: object = {};

function rememberNext() {
  const s: unknown = history.state;
  if (!s || typeof s !== "object") return;
  const rest = Object.entries(s).filter(([k]) => k !== "__ls");
  if (rest.length) nextState = Object.fromEntries(rest);
}

const stamp = (depth: number, prev: string, url?: string) => {
  rememberNext();
  const hash = url ?? location.hash;
  history.replaceState({ ...nextState, __ls: { ls: 1, depth, prev, hash } satisfies Entry }, "", url);
};

/** Stamps the current history entry if it's new (a hash link, the first page load), then remembers where we are. */
export function trackHistory() {
  let e = entry();
  rememberNext();
  if (!e) {
    stamp(lastHash !== location.hash && tracking ? lastDepth + 1 : 0, tracking ? lastHash : "");
    e = entry()!;
  }
  lastDepth = e.depth;
  lastHash = location.hash;
}

/** How many of the app's screens are behind this one. */
export function historyDepth(): number {
  return entry()?.depth ?? 0;
}

/** The first page load has no hash, which is Today. */
const home = (hash: string) => (hash.replace(/^#\/?/, "") ? hash : "#/today");

function startTracking() {
  if (tracking || typeof window === "undefined") return;
  trackHistory();
  tracking = true;
  window.addEventListener("hashchange", trackHistory);
}

export function go(route: Route, arg?: string) {
  startTracking();
  const hash = hashOf(route, arg);
  if (hash === location.hash) return window.scrollTo(0, 0);
  // Going to the screen we came from is a step back, so the phone's back button doesn't return to the
  // screen just left (Settings › Training › "‹ Settings", then back, would open Training again).
  const e = entry();
  if (e && e.depth > 0 && home(e.prev) === hash) return history.back();
  const from = location.hash;
  const depth = e?.depth ?? 0;
  rememberNext();
  location.hash = hash;
  // Stamp the new entry now rather than on hashchange, so a second go() straight after sees it.
  stamp(depth + 1, from);
  trackHistory();
  window.scrollTo(0, 0);
}

/**
 * Keeps Next.js's router out of the app's own back and forward steps. The app is one page with hash routes,
 * so a step between two of its entries changes only the hash and the app follows it from `hashchange`. Next
 * treated each of those popstates as a history traversal of its own: it restored the entry's copy of its tree
 * and, once its cached copy of the page had gone stale or been dropped (a few minutes into a workout on a
 * phone), asked the server for the page again. The Android app's local server answers every path with the
 * HTML page, so that request failed and Next showed "This page couldn't load" until a reload (the Today and
 * ‹ Back buttons and the phone's back all step back, Melvin, 2026-11-10). Traversals to another page (a
 * different path or query) still go to Next.
 */
let lastDoc = "";
const docOf = () => location.pathname + location.search;
export function onPopState(e: Event) {
  const doc = docOf();
  if (doc === lastDoc) e.stopImmediatePropagation();
  lastDoc = doc;
}
export function guardTraversals() {
  if (typeof window === "undefined" || lastDoc) return;
  lastDoc = docOf();
  // Capture on window runs before Next's own listener, which is added later, on hydration.
  window.addEventListener("popstate", onPopState, { capture: true });
  // pushState and replaceState change the path without a popstate (Next's own links to the site's pages).
  for (const k of ["pushState", "replaceState"] as const) {
    const orig = history[k];
    history[k] = function (this: History, ...args: Parameters<History["pushState"]>) {
      orig.apply(this, args);
      lastDoc = docOf();
    };
  }
}
guardTraversals();

/** Swaps this history entry's screen for another, without adding a step for back to undo. */
export function replaceRoute(route: Route, arg?: string) {
  startTracking();
  const hash = hashOf(route, arg);
  if (hash === location.hash) return;
  const e = entry();
  stamp(e?.depth ?? 0, e?.prev ?? "", hash);
  trackHistory();
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

/** One step back through the app's history; with nothing behind this screen, Today. */
export function goBack() {
  startTracking();
  if (historyDepth() > 0) history.back();
  else if (parse(location.hash).route !== "today") {
    stamp(0, "", "#/today");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    window.scrollTo(0, 0);
  }
}

/** Rewrites an old screen name in the address to the screen's own, in place (no extra step for back). */
export function tidyAddress() {
  if (typeof location === "undefined") return;
  const want = canonical(location.hash);
  if (want === location.hash) return;
  const e = entry();
  rememberNext();
  history.replaceState({ ...nextState, __ls: { ls: 1, depth: e?.depth ?? 0, prev: e?.prev ?? "", hash: want } satisfies Entry }, "", want);
  if (tracking) lastHash = want;
}

export function useRoute() {
  const [h, setH] = useState(() => (typeof location === "undefined" ? "" : location.hash));
  useEffect(() => {
    startTracking();
    const on = () => {
      tidyAddress();
      setH(location.hash);
    };
    on();
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return parse(h);
}
