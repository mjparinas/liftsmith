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
] as const;
export type Route = (typeof ROUTES)[number];

export function parse(hash: string): { route: Route; arg?: string } {
  const [, r, arg] = hash.replace(/^#/, "").split("/");
  const route = (ROUTES as readonly string[]).includes(r) ? (r as Route) : "today";
  return { route, arg };
}

export function go(route: Route, arg?: string) {
  location.hash = `#/${route}${arg ? `/${arg}` : ""}`;
  window.scrollTo(0, 0);
}

export function useRoute() {
  const [h, setH] = useState(() => (typeof location === "undefined" ? "" : location.hash));
  useEffect(() => {
    const on = () => setH(location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return parse(h);
}
