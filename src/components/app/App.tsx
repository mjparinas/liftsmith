"use client";
import { applyA11y, readPhoneTextScale, savedA11y } from "@/lib/a11y";
import { readPhoneLanguage, setLanguage, t } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
import type { MessageKey } from "@/locales/en";
import { applyAppearance, savedAppearance, useLight } from "@/lib/appearance";
import { onSessionAction, stopSession } from "@/lib/sessionNotify";
import { linkAction, runShortcut, type ShortcutAction } from "@/lib/shortcuts";
import { useApp } from "@/lib/store";
import { useAccount } from "@/lib/auth";
import { useEffect } from "react";
import { keepStorage } from "@/lib/saving";
import { installDiag } from "@/lib/diag";
import { applyAccent, feel, haptic, sound, type TimerSound } from "@/lib/juice";
import { COSMETICS } from "@/lib/game";
import { flushFeedback } from "@/lib/feedback";
import { onReminderTap, refreshReminders } from "@/lib/reminders";
import { startAnalytics, track } from "@/lib/analytics";
import { Account } from "./Account";
import { Achievements } from "./Achievements";
import { startSync } from "@/lib/sync";
import { Done } from "./Done";
import { Feedback } from "./Feedback";
import { Gym } from "./Gym";
import { Onboarding } from "./Onboarding";
import { Recovery } from "./Recovery";
import { Remix } from "./Remix";
import { go, parse, useRoute, type Route } from "./router";
import { Programs } from "./Programs";
import { Pro } from "./Pro";
import { startBilling, useBilling } from "@/lib/billing";
import { sendClaim, startCreator, useCreator } from "@/lib/creator";
import { Settings } from "./Settings";
import { TrainingSettings } from "./TrainingSettings";
import { Injuries } from "./Injuries";
import { Stats } from "./Stats";
import { Today } from "./Today";
import { Workout } from "./Workout";
import { Icon, type IconName } from "./icons";
import { TodaySkeleton } from "./ui";
import { Photos } from "./Photos";
import { Recap } from "./Recap";
import { goalStreak } from "@/lib/game";
import { useNow } from "@/lib/useNow";
import { activeTheme, applyTheme } from "@/lib/themes";
import { readHeight } from "@/lib/health";
import { Tools } from "./Tools";

const TABS: { route: Route; label: MessageKey; icon: IconName }[] = [
  { route: "today", label: "tab.today", icon: "today" },
  { route: "recovery", label: "tab.recovery", icon: "recovery" },
  { route: "stats", label: "tab.progress", icon: "progress" },
  { route: "achievements", label: "tab.awards", icon: "trophy" },
  { route: "gym", label: "tab.gyms", icon: "gym" },
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
  // Language (i18n.ts): the phone's language, read again on return in case it changed, or the
  // one picked in Settings. useLang re-renders the whole app when it changes.
  useLang();
  const language = profile.language;
  useEffect(() => {
    setLanguage(language);
    const reread = () => document.visibilityState === "visible" && void readPhoneLanguage();
    reread();
    document.addEventListener("visibilitychange", reread);
    return () => document.removeEventListener("visibilitychange", reread);
  }, [language]);
  // Accessibility (a11y.ts): text size, colour-blind safe colours, contrast. The phone's own text
  // size is read again when the app comes back, in case it was changed in the phone's settings.
  const a11y = profile.a11y;
  useEffect(() => {
    applyA11y(a11y);
    const reread = () => {
      if (document.visibilityState === "visible") void readPhoneTextScale().then(() => applyA11y(a11y));
    };
    reread();
    document.addEventListener("visibilitychange", reread);
    return () => document.removeEventListener("visibilitychange", reread);
  }, [a11y]);
  useEffect(() => {
    // iOS WebKit only shows :active (the instant pressed state) when a touch listener exists.
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    return () => document.removeEventListener("touchstart", noop);
  }, []);
  useEffect(() => {
    applyAppearance(savedAppearance());
    applyA11y(savedA11y());
    installDiag();
    startAnalytics();
    // Feedback written offline goes out as soon as there's a connection.
    void flushFeedback();
    // A creator code from a link or the Play install referrer (creator.ts); one saved offline is checked when online.
    void startCreator();
    const online = () => {
      void flushFeedback();
      if (useCreator.getState().claim?.status === "pending") void sendClaim();
    };
    window.addEventListener("online", online);
    void init();
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") void navigator.serviceWorker.register("/sw.js");
    return () => window.removeEventListener("online", online);
  }, [init]);
  // Store billing (billing.ts): the Pro entitlement re-renders the app, and keeps the plan source in step
  // (free lifters follow the free classic 5x5; Pro brings their own plan back).
  const billing = useBilling();
  useEffect(() => {
    if (ready) void startBilling();
  }, [ready]);
  // In a browser, keep asking it not to clear this site's storage (saving.ts); an account backs it up too (sync.ts).
  useEffect(() => {
    if (ready && profile.onboarded) void keepStorage();
  }, [ready, profile.onboarded]);
  // Sync with the lifter's account, when signed in (sync.ts): on open, on return, when online, after changes.
  const signedIn = useAccount((s) => !!s.account);
  useEffect(() => {
    if (ready && signedIn) return startSync();
  }, [ready, signedIn]);
  useEffect(() => {
    if (ready && profile.onboarded) useApp.getState().applyAccess();
  }, [ready, profile.onboarded, billing.live, billing.ent]);
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
  // TDEE tracking (tdee.ts): height from Health Connect or Apple Health on open (weigh-ins and body fat come
  // in through the store's importHealthBody), then
  // a snapshot whenever weight, age, height or training days change. Debounced, so typing a weight in
  // Settings records the final value, not every keystroke.
  useEffect(() => {
    if (!ready) return;
    void readHeight().then((r) => useApp.getState().applyHealthBody(r));
    let t: ReturnType<typeof setTimeout> | undefined;
    const unsub = useApp.subscribe((s, prev) => {
      if (s.events === prev.events && s.profile === prev.profile) return;
      clearTimeout(t);
      t = setTimeout(() => useApp.getState().refreshTdee(), 2000);
    });
    return () => {
      unsub();
      clearTimeout(t);
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
      <TodaySkeleton />
    );
  if (!profile.onboarded) return <Onboarding />;

  const screen = { today: <Today />, workout: <Workout />, recovery: <Recovery />, stats: <Stats />, gym: <Gym />, settings: <Settings />, done: <Done />, setup: <Onboarding rerun />, feedback: <Feedback />, achievements: <Achievements />, recap: <Recap arg={arg} />, photos: <Photos />, programs: <Programs />, injuries: <Injuries />, training: <TrainingSettings />, tools: <Tools arg={arg} />, remix: <Remix code={arg} />, pro: <Pro />, account: <Account /> }[route];
  const showNav = route !== "workout" && route !== "done" && route !== "setup" && route !== "feedback" && route !== "pro";
  if (route === "setup") return screen;
  return (
    <>
      <main key={route} className="aurora safe-top animate-fade mx-auto max-w-lg px-5">{screen}</main>
      {showNav && (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-bg/92 backdrop-blur-xl" aria-label={t("nav.main")}>
          <ul className="mx-auto grid max-w-lg grid-cols-5 px-1 pt-1.5">
            {TABS.map((tab) => {
              const on = route === tab.route;
              return (
                <li key={tab.route}>
                  <button
                    type="button"
                    aria-current={on ? "page" : undefined}
                    onClick={() => {
                      if (!on) haptic("select");
                      go(tab.route);
                    }}
                    className={`press flex w-full flex-col items-center gap-1 py-1.5 text-[0.6875rem] font-medium ${on ? "text-ink" : "text-faint"}`}
                  >
                    <span className={`grid h-8 w-12 place-items-center rounded-full transition-colors duration-200 ${on ? "bg-accent/18 text-accent shadow-[0_0_18px_-4px_rgb(76_141_255/0.6)]" : ""}`}>
                      <Icon name={tab.icon} size={22} strokeWidth={on ? 2.4 : 2} />
                    </span>
                    {t(tab.label)}
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
