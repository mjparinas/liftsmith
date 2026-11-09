"use client";
import { useEffect, useState } from "react";

export type Route = "today" | "workout" | "recovery" | "stats" | "gym" | "settings" | "done" | "setup" | "feedback" | "achievements" | "programs";

export function parse(hash: string): { route: Route; arg?: string } {
  const [, r, arg] = hash.replace(/^#/, "").split("/");
  const route = (["today", "workout", "recovery", "stats", "gym", "settings", "done", "setup", "feedback", "achievements", "programs"] as Route[]).includes(r as Route) ? (r as Route) : "today";
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
