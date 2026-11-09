"use client";
import { onSessionAction, stopSession } from "@/lib/sessionNotify";
import { linkAction, runShortcut, type ShortcutAction } from "@/lib/shortcuts";
import { useApp } from "@/lib/store";
import { useEffect } from "react";
import { installDiag } from "@/lib/diag";
import { applyAccent, juice, sound, type TimerSound } from "@/lib/juice";
import { COSMETICS } from "@/lib/game";
import { flushFeedback } from "@/lib/feedback";
import { onReminderTap, refreshReminders } from "@/lib/reminders";
import { startAnalytics, track } from "@/lib/analytics";
import { Achievements } from "./Achievements";
import { Done } from "./Done";
import { Feedback } from "./Feedback";
import { Gym } from "./Gym";
import { Onboarding } from "./Onboarding";
import { Recovery } from "./Recovery";
import { Remix } from "./Remix";
import { go, parse, useRoute, type Route } from "./router";
import { Settings } from "./Settings";
import { Stats } from "./Stats";
import { Today } from "./Today";
import { Workout } from "./Workout";
import { Photos } from "./Photos";
import { Recap } from "./Recap";
import { goalStreak } from "@/lib/game";
import { useNow } from "@/lib/useNow";
import { activeTheme, applyTheme } from "@/lib/themes";

const TABS: { route: Route; label: string; icon: string }[] = [
  { route: "today", label: "Today", icon: "M4 12h4l3-8 4 16 3-8h2" },
  { route: "recovery", label: "Recovery", icon: "M12 21s-7-4.5-9-9.5C1.6 7.6 4.3 4 7.9 4c1.8 0 3.2 1 4.1 2.3C12.9 5 14.3 4 16.1 4 19.7 4 22.4 7.6 21 11.5 19 16.5 12 21 12 21z" },
  { route: "stats", label: "Progress", icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  { route: "achievements", label: "Awards", icon: "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" },
  { route: "gym", label: "Gyms", icon: "M6 6v12M18 6v12M3 9v6M21 9v6M6 12h12" },
];

export function App() {
  const { ready, init, profile, active, stats } = useApp();
  const { route, arg } = useRoute();
  // Earned theme (themes.ts). A seasonal theme falls back to Midnight when its month ends.
  const now = useNow(3600_000);
  const themeId = activeTheme(profile.delight?.theme, { stats, goalWeeks: goalStreak(stats, profile, now).weeks, now }).id;
  // An equipped cosmetic accent (game.ts COSMETICS) wins over the theme's accent, so it goes on second.
  useEffect(() => {
    applyTheme(activeTheme(themeId, { stats, goalWeeks: 0, now: Date.now() }));
    const accent = COSMETICS.find((c) => c.id === profile.cosmetics?.accent)?.value;
    if (accent) applyAccent(accent);
  }, [themeId, profile.cosmetics]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    installDiag();
    startAnalytics();
    // Feedback written offline goes out as soon as there's a connection.
    void flushFeedback();
    const online = () => void flushFeedback();
    window.addEventListener("online", online);
    void init();
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") void navigator.serviceWorker.register("/sw.js");
    return () => window.removeEventListener("online", online);
  }, [init]);
  // Lean mode and equipped cosmetics (accent colour, rest timer sound) apply app-wide.
  useEffect(() => {
    juice.lean = !!profile.lean;
    const pick = (id?: string) => COSMETICS.find((c) => c.id === id);
    sound.theme = (pick(profile.cosmetics?.sound)?.value ?? "classic") as TimerSound;
  }, [profile.lean, profile.cosmetics]);
  // Which screens get used (the route name only, nothing on it).
  useEffect(() => {
    if (ready) track("screen_view", { screen: profile.onboarded ? route : "onboarding" });
  }, [ready, route, profile.onboarded]);
  // A workout left running ends itself a few hours after the last set (checked each minute and on open).
  useEffect(() => {
    if (!ready) return;
    const check = () => {
      if (useApp.getState().autoEnd()) {
        void stopSession();
        if (location.hash.startsWith("#/workout")) go("today");
      }
    };
    check();
    const id = setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, [ready]);
  // Gym by location: once on open and each time the app comes back to the foreground (never on a timer).
  useEffect(() => {
    if (!ready) return;
    const pick = () => {
      if (document.visibilityState === "visible") void useApp.getState().pickGymByLocation();
    };
    pick();
    document.addEventListener("visibilitychange", pick);
    return () => document.removeEventListener("visibilitychange", pick);
  }, [ready]);
  // Notification buttons, voice and system shortcuts (Siri, App Actions, Quick Settings tile, launcher
  // and web manifest shortcuts). Registered once the store is ready, so a cold start's action waits for it.
  useEffect(() => {
    if (!ready) return;
    const run = (a: ShortcutAction) => {
      const to = runShortcut(a);
      if (!location.hash.startsWith(`#/${to}`)) go(to);
    };
    const fromLink = linkAction(location.search);
    if (fromLink) {
      // Keep Next.js's own history state, or its router puts the old URL back.
      history.replaceState(history.state, "", location.pathname + location.hash);
      sessionStorage.setItem("ls.resumed", "1");
      run(fromLink);
    }
    return onSessionAction(run);
  }, [ready]);
  // Reminders: rescheduled from the latest data on open, on return to the foreground, and whenever
  // the workouts or the profile change (reminders.ts). A tap on one opens the screen it points to.
  useEffect(() => {
    if (!ready) return;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      refreshReminders(
        () => useApp.getState(),
        (status) => {
          const { profile: p, setProfile } = useApp.getState();
          if (p.messages?.email) setProfile({ messages: { ...p.messages, email: { ...p.messages.email, status } } });
        },
      );
    };
    refresh();
    const unsub = useApp.subscribe((s, prev) => {
      if (s.events !== prev.events || s.profile !== prev.profile) refresh();
    });
    document.addEventListener("visibilitychange", refresh);
    const offTap = onReminderTap((r) => go(parse(`#/${r}`).route));
    return () => {
      unsub();
      offTap();
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [ready]);
  useEffect(() => {
    if (ready && active && route === "today" && sessionStorage.getItem("ls.resumed") !== "1") {
      sessionStorage.setItem("ls.resumed", "1");
      go("workout");
    }
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return <div className="grid min-h-dvh place-items-center text-muted">Loading…</div>;
  if (!profile.onboarded) return <Onboarding />;

  const screen = { today: <Today />, workout: <Workout />, recovery: <Recovery />, stats: <Stats />, gym: <Gym />, settings: <Settings />, done: <Done />, setup: <Onboarding rerun />, feedback: <Feedback />, achievements: <Achievements />, recap: <Recap arg={arg} />, photos: <Photos />, remix: <Remix code={arg} /> }[route];
  const showNav = route !== "workout" && route !== "done" && route !== "setup" && route !== "feedback";
  if (route === "setup") return screen;
  return (
    <>
      <main className="safe-top mx-auto max-w-lg px-5">{screen}</main>
      {showNav && (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 backdrop-blur" aria-label="Main">
          <ul className="mx-auto grid max-w-lg grid-cols-5">
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
