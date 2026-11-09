"use client";
import { applyAppearance, savedAppearance, useLight } from "@/lib/appearance";
import { onSessionAction, stopSession } from "@/lib/sessionNotify";
import { linkAction, runShortcut, type ShortcutAction } from "@/lib/shortcuts";
import { useApp } from "@/lib/store";
import { useEffect } from "react";
import { installDiag } from "@/lib/diag";
import { applyAccent, feel, haptic, sound, type TimerSound } from "@/lib/juice";
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
import { go, parse, useRoute, type Route } from "./router";
import { Settings } from "./Settings";
import { Stats } from "./Stats";
import { Today } from "./Today";
import { Workout } from "./Workout";
import { Icon, type IconName } from "./icons";
import { Photos } from "./Photos";
import { Recap } from "./Recap";
import { goalStreak } from "@/lib/game";
import { useNow } from "@/lib/useNow";
import { activeTheme, applyTheme } from "@/lib/themes";

const TABS: { route: Route; label: string; icon: IconName }[] = [
  { route: "today", label: "Today", icon: "today" },
  { route: "recovery", label: "Recovery", icon: "recovery" },
  { route: "stats", label: "Progress", icon: "progress" },
  { route: "achievements", label: "Awards", icon: "trophy" },
  { route: "gym", label: "Gyms", icon: "gym" },
];

export function App() {
  const { ready, init, profile, active, stats } = useApp();
  const { route, arg } = useRoute();
  // Earned theme (themes.ts). A seasonal theme falls back to Midnight when its month ends.
  const now = useNow(3600_000);
  const themeId = activeTheme(profile.delight?.theme, { stats, goalWeeks: goalStreak(stats, profile, now).weeks, now }).id;
  // Colours, in order: Appearance (dark, light or match system), then the earned theme (only its
  // accent on a light screen), then an equipped cosmetic accent (game.ts COSMETICS), which wins.
  const appearance = profile.theme ?? "dark";
  const light = useLight(appearance);
  useEffect(() => {
    applyAppearance(appearance);
    applyTheme(activeTheme(themeId, { stats, goalWeeks: 0, now: Date.now() }), light);
    const accent = COSMETICS.find((c) => c.id === profile.cosmetics?.accent)?.value;
    if (accent) applyAccent(accent, light);
  }, [themeId, profile.cosmetics, appearance, light]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    applyAppearance(savedAppearance());
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
  // Sounds, haptics, Lean mode and equipped cosmetics (accent colour, rest timer sound) apply app-wide
  // (juice.ts reads `feel`).
  useEffect(() => {
    feel.sound = profile.restSounds;
    feel.haptics = profile.haptics !== false;
    feel.calm = !!profile.lean;
    document.documentElement.classList.toggle("calm", !!profile.lean);
    const pick = (id?: string) => COSMETICS.find((c) => c.id === id);
    sound.theme = (pick(profile.cosmetics?.sound)?.value ?? "classic") as TimerSound;
  }, [profile.restSounds, profile.haptics, profile.lean, profile.cosmetics]);
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

  if (!ready)
    return (
      <div className="grid min-h-dvh place-items-center" role="status" aria-label="Loading">
        <div className="btn-primary grid h-14 w-14 animate-pulse place-items-center rounded-2xl"><Icon name="dumbbell" size={28} strokeWidth={2.4} /></div>
      </div>
    );
  if (!profile.onboarded) return <Onboarding />;

  const screen = { today: <Today />, workout: <Workout />, recovery: <Recovery />, stats: <Stats />, gym: <Gym />, settings: <Settings />, done: <Done />, setup: <Onboarding rerun />, feedback: <Feedback />, achievements: <Achievements />, recap: <Recap arg={arg} />, photos: <Photos /> }[route];
  const showNav = route !== "workout" && route !== "done" && route !== "setup" && route !== "feedback";
  if (route === "setup") return screen;
  return (
    <>
      <main key={route} className="aurora safe-top animate-fade mx-auto max-w-lg px-5">{screen}</main>
      {showNav && (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-bg/92 backdrop-blur-xl" aria-label="Main">
          <ul className="mx-auto grid max-w-lg grid-cols-5 px-1 pt-1.5">
            {TABS.map((t) => {
              const on = route === t.route;
              return (
                <li key={t.route}>
                  <button
                    type="button"
                    aria-current={on ? "page" : undefined}
                    onClick={() => {
                      if (!on) haptic("select");
                      go(t.route);
                    }}
                    className={`press flex w-full flex-col items-center gap-1 py-1.5 text-[11px] font-medium ${on ? "text-ink" : "text-faint"}`}
                  >
                    <span className={`grid h-8 w-12 place-items-center rounded-full transition-colors duration-200 ${on ? "bg-accent/18 text-accent shadow-[0_0_18px_-4px_rgb(76_141_255/0.6)]" : ""}`}>
                      <Icon name={t.icon} size={22} strokeWidth={on ? 2.4 : 2} />
                    </span>
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
