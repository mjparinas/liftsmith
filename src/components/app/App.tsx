"use client";
import { useApp } from "@/lib/store";
import { useEffect } from "react";
import { Done } from "./Done";
import { Gym } from "./Gym";
import { Onboarding } from "./Onboarding";
import { Recovery } from "./Recovery";
import { go, useRoute, type Route } from "./router";
import { Settings } from "./Settings";
import { Stats } from "./Stats";
import { Today } from "./Today";
import { Workout } from "./Workout";

const TABS: { route: Route; label: string; icon: string }[] = [
  { route: "today", label: "Today", icon: "M4 12h4l3-8 4 16 3-8h2" },
  { route: "recovery", label: "Recovery", icon: "M12 21s-7-4.5-9-9.5C1.6 7.6 4.3 4 7.9 4c1.8 0 3.2 1 4.1 2.3C12.9 5 14.3 4 16.1 4 19.7 4 22.4 7.6 21 11.5 19 16.5 12 21 12 21z" },
  { route: "stats", label: "Progress", icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  { route: "gym", label: "Gyms", icon: "M6 6v12M18 6v12M3 9v6M21 9v6M6 12h12" },
];

export function App() {
  const { ready, init, profile, active } = useApp();
  const { route } = useRoute();
  useEffect(() => {
    void init();
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") void navigator.serviceWorker.register("/sw.js");
  }, [init]);
  useEffect(() => {
    if (ready && active && route === "today" && sessionStorage.getItem("ls.resumed") !== "1") {
      sessionStorage.setItem("ls.resumed", "1");
      go("workout");
    }
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return <div className="grid min-h-dvh place-items-center text-muted">Loading…</div>;
  if (!profile.onboarded) return <Onboarding />;

  const screen = { today: <Today />, workout: <Workout />, recovery: <Recovery />, stats: <Stats />, gym: <Gym />, settings: <Settings />, done: <Done />, setup: <Onboarding rerun /> }[route];
  const showNav = route !== "workout" && route !== "done" && route !== "setup";
  if (route === "setup") return screen;
  return (
    <>
      <main className="safe-top mx-auto max-w-lg px-5">{screen}</main>
      {showNav && (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 backdrop-blur" aria-label="Main">
          <ul className="mx-auto grid max-w-lg grid-cols-4">
            {TABS.map((t) => {
              const on = route === t.route;
              return (
                <li key={t.route}>
                  <button type="button" aria-current={on ? "page" : undefined} onClick={() => go(t.route)} className={`press flex w-full flex-col items-center gap-1 py-2 text-xs ${on ? "text-accent" : "text-faint"}`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={t.icon} /></svg>
                    {t.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
}
