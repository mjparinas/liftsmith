"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";

import { applyA11y, readPhoneTextScale, savedA11y } from "@/lib/a11y";
import { startAnalytics, track } from "@/lib/analytics";
import { applyAppearance, savedAppearance, useLight } from "@/lib/appearance";
import { startAppLinks } from "@/lib/appLinks";
import { useAccount } from "@/lib/auth";
import { startBackButton } from "@/lib/back";
import { startBilling, useBilling, useProMember } from "@/lib/billing";
import { BRAND } from "@/lib/brand";
import { pendingCoach, savePendingCoach, startCoachInvite } from "@/lib/coachInvite";
import { startConnections } from "@/lib/connections";
import { redeemSaved, sendClaim, startCreator, useCreator } from "@/lib/creator";
import { installDiag } from "@/lib/diag";
import { flushFeedback } from "@/lib/feedback";
import { COSMETICS } from "@/lib/game";
import { readBodyStats } from "@/lib/health";
import { startHealthRefresh } from "@/lib/healthRefresh";
import { readPhoneLanguage, setLanguage, subscribeLang, t } from "@/lib/i18n";
import { startInvite } from "@/lib/invite";
import { applyAccent, feel, haptic, sound, type TimerSound } from "@/lib/juice";
import { applyLayout, useDesktop } from "@/lib/layout";
import { onPushTap, onPushWhileOpen } from "@/lib/push";
import { onReminderTap, refreshReminders } from "@/lib/reminders";
import { startFlags } from "@/lib/remoteFlags";
import { keepStorage } from "@/lib/saving";
import { onSessionAction } from "@/lib/sessionNotify";
import { linkAction, runShortcut, type ShortcutAction } from "@/lib/shortcuts";
import { refreshSocial, socialOn } from "@/lib/social";
import { startLive } from "@/lib/socialLive";
import { useApp } from "@/lib/store";
import { startSync } from "@/lib/sync";
import { activeTheme, applyTheme, unlockContext } from "@/lib/themes";
import { forgetNotes, refreshCoachNotes } from "@/lib/trainer";
import { useLang } from "@/lib/useLang";
import { useNow } from "@/lib/useNow";
import { watchWorkout } from "@/lib/workoutWatch";
import type { MessageKey } from "@/locales/en";

import { Account } from "./Account";
import { Achievements } from "./Achievements";
import { Connections } from "./Connections";
import { Done } from "./Done";
import { ExercisePage } from "./ExercisePage";
import { Feedback } from "./Feedback";
import { ClubScreen, Friends, InviteScreen, PersonScreen, useFriendsWaiting } from "./Friends";
import { Gym } from "./Gym";
import { useHomeWidget } from "./HomeWidget";
import { Icon, type IconName } from "./icons";
import { Injuries } from "./Injuries";
import { LogPast } from "./LogPast";
import { Onboarding } from "./Onboarding";
import { Photos } from "./Photos";
import { Pro } from "./Pro";
import { Programs } from "./Programs";
import { ProWelcome } from "./ProWelcome";
import { Recap } from "./Recap";
import { Recovery } from "./Recovery";
import { Remix } from "./Remix";
import { go, goBack, historyDepth, parse, useRoute, type Route } from "./router";
import { ScreenBoundary } from "./ScreenBoundary";
import { Settings } from "./Settings";
import { SharedGym } from "./SharedGym";
import { SharedRoutine } from "./SharedRoutine";
import { Stats } from "./Stats";
import { StretchScreen } from "./Stretch";
import { Toaster } from "./Toaster";
import { Today } from "./Today";
import { Tools } from "./Tools";
import { Trainer } from "./Trainer";
import { TrainingSettings } from "./TrainingSettings";
import { TodaySkeleton } from "./ui";
import { Workout } from "./Workout";

const TABS: { route: Route; label: MessageKey; icon: IconName }[] = [
  { route: "today", label: "tab.today", icon: "today" },
  { route: "recovery", label: "tab.recovery", icon: "recovery" },
  { route: "stats", label: "tab.progress", icon: "progress" },
  { route: "friends", label: "tab.friends", icon: "people" },
  { route: "achievements", label: "tab.awards", icon: "trophy" },
];
// Friends took Gyms' place in the bar (2026-11-12, docs/decisions/friends.md): gyms are set up once and switched
// from Today's gym chip, so Gyms lives in Settings now. With the social flag off the bar has four tabs.

// Screens that hide the tab bar.
const FULL_SCREEN: ReadonlySet<Route> = new Set<Route>(["workout", "done", "setup", "feedback", "pro"]);

export function App() {
  const { ready, init, profile, active, stats, events } = useApp();
  const { route, arg } = useRoute();
  const desktop = useDesktop();
  useEffect(() => applyLayout(desktop), [desktop]);
  // Earned theme (themes.ts). A seasonal theme falls back to Midnight when its month ends.
  const now = useNow(3600_000);
  const unlockCtx = useMemo(() => unlockContext(events, stats, profile, now), [events, stats, profile, now]);
  const theme = activeTheme(profile.delight?.theme, unlockCtx);
  const themeId = theme.id;
  // Colours, in order: Appearance (dark, light or match system), then the earned theme (only its
  // accent on a light screen), then an equipped cosmetic accent (game.ts COSMETICS), which wins.
  const appearance = profile.theme ?? "dark";
  const light = useLight(appearance);
  useEffect(() => {
    applyAppearance(appearance);
    applyTheme(theme, light);
    const accent = COSMETICS.find((c) => c.id === profile.cosmetics?.accent)?.value;
    if (accent) applyAccent(accent, light);
  }, [themeId, profile.cosmetics, appearance, light]); // eslint-disable-line react-hooks/exhaustive-deps
  // Language (i18n.ts): the phone's language, read again on return in case it changed, or the
  // one picked in Settings. useLang re-renders the whole app when it changes.
  useLang();
  // The home-screen widget (widget.ts): today's call and why, the weekly goal and the top coach's note.
  useHomeWidget();
  const language = profile.language;
  useEffect(() => {
    setLanguage(language);
    const reread = () => document.visibilityState === "visible" && void readPhoneLanguage();
    reread();
    document.addEventListener("visibilitychange", reread);
    return () => document.removeEventListener("visibilitychange", reread);
  }, [language]);
  // Today's plan words its notes and labels when it's built, so a new language rebuilds it.
  useEffect(() => subscribeLang(() => useApp.getState().replan()), []);
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
    // Android's back button: close a sheet, else the previous screen, and leave the app only from Today (back.ts).
    let stop = () => {};
    let gone = false;
    void startBackButton({ depth: historyDepth, atRoot: () => parse(location.hash).route === "today", back: goBack }).then((s) =>
      gone ? s() : (stop = s),
    );
    return () => {
      gone = true;
      stop();
    };
  }, []);
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
    // Feature flags and A/B tests from the server (remoteFlags.ts); the last answer stays for offline use.
    startFlags();
    // Feedback written offline goes out as soon as there's a connection.
    void flushFeedback();
    // A creator code from a link or the Play install referrer (creator.ts); one saved offline is checked when online.
    void startCreator();
    // An invite that came through the Play install referrer waits for Friends (invite.ts).
    void startInvite();
    // A coach's invite (#/trainer/<code>, or the Play install referrer) waits for setup's coach path (coachInvite.ts).
    void startCoachInvite();
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
  // Health Connect / Apple Health: read on open (store.ts) and again on return to the app, at most every 15
  // minutes (healthRefresh.ts), so an app left in memory overnight still sees last night's sleep and HRV.
  useEffect(() => {
    if (!ready) return;
    return startHealthRefresh(() => useApp.getState());
  }, [ready]);
  // Sync with the lifter's account, when signed in (sync.ts): on open, on return, when online, after changes.
  const signedIn = useAccount((s) => !!s.account);
  useEffect(() => {
    if (!ready || !signedIn) return;
    return startSync();
  }, [ready, signedIn]);
  // A lifetime code typed while signed out is redeemed once the lifter signs in (creator.ts).
  useEffect(() => {
    if (ready && signedIn) void redeemSaved();
  }, [ready, signedIn]);
  // Strava, Oura, WHOOP, Withings, Polar and Concept2 (Connected apps): status, readings in and workouts out, while signed in.
  useEffect(() => {
    if (!ready || !signedIn) return;
    return startConnections();
  }, [ready, signedIn]);
  const accountPro = useAccount((s) => !!s.account?.pro);
  useEffect(() => {
    if (ready && profile.onboarded) useApp.getState().applyAccess();
  }, [ready, profile.onboarded, billing.live, billing.ent, accountPro]);
  // A month with Pro is logged once (store.notePro), for the Pro achievement and its rewards, which stay earned.
  const member = useProMember();
  useEffect(() => {
    if (ready && profile.onboarded && member) useApp.getState().notePro();
  }, [ready, profile.onboarded, member]);
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
  // A workout left running ends itself a few hours after the last set: one timer for that moment (moved
  // each time the lifter does something), checked again on return. No minute-by-minute polling, so a
  // phone with a forgotten workout isn't woken every minute (docs/decisions/battery.md).
  useEffect(() => {
    if (!ready) return;
    return watchWorkout(useApp, () => {
      if (location.hash.startsWith("#/workout")) go("today");
    });
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
    const run = (a: ShortcutAction, at?: number) => {
      const to = runShortcut(a, at);
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
  // Android App Links (appLinks.ts): a tapped link to the app on our domain opens its screen here. Waits
  // for the store, like shortcuts, so a cold start's link lands after loading.
  useEffect(() => {
    if (!ready) return;
    let stop = () => {};
    let gone = false;
    void startAppLinks((hash) => {
      if (location.hash !== hash) location.hash = hash;
    }).then((s) => (gone ? s() : (stop = s)));
    return () => {
      gone = true;
      stop();
    };
  }, [ready]);
  // Reminders: rescheduled from the latest data on open, on return to the foreground, and whenever
  // the workouts or the profile change (reminders.ts). A tap on one opens the screen it points to.
  useEffect(() => {
    if (!ready) return;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      refreshReminders(
        () => useApp.getState(),
        (status, address) => {
          const { profile: p, setProfile } = useApp.getState();
          if (p.messages?.email) setProfile({ messages: { ...p.messages, email: { ...p.messages.email, status, address } } });
        },
      );
    };
    refresh();
    const unsub = useApp.subscribe((s, prev) => {
      if (s.events !== prev.events || s.profile !== prev.profile) refresh();
    });
    document.addEventListener("visibilitychange", refresh);
    const offTap = onReminderTap((r) => go(parse(`#/${r}`).route));
    // Friends pushes carry the whole hash (#/friends, #/routine/<code>).
    const offPush = onPushTap((h) => {
      const r = parse(h);
      go(r.route, r.arg);
    });
    const offOpen = onPushWhileOpen(() => void refreshSocial());
    // Training now (Friends): the workout in progress, for mutual friends, while the lifter has it on.
    const offLive = startLive();
    return () => {
      offLive();
      unsub();
      offTap();
      offPush();
      offOpen();
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [ready]);
  // TDEE tracking (tdee.ts): height (and on iOS sex and birth year) from health data on open (weigh-ins and body fat come
  // in through the store's importHealthBody), then
  // a snapshot whenever weight, age, height or training days change. Debounced, so typing a weight in
  // Settings records the final value, not every keystroke.
  useEffect(() => {
    if (!ready) return;
    void readBodyStats().then((r) => useApp.getState().applyHealthBody(r));
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

  // Notes from the lifter's coaches for Today (trainer.ts): on open and on return to the app, at most every 15 minutes;
  // signing out forgets them. A coach's invite still waiting once the app is set up (an account that was already set
  // up signed in on the welcome screen) opens Coaching with the code filled in.
  useEffect(() => {
    if (!ready || !profile.onboarded) return;
    const code = pendingCoach();
    if (code) {
      savePendingCoach("");
      if (!location.hash.startsWith("#/trainer")) go("trainer", code);
    }
    const look = () => {
      if (document.visibilityState === "visible") void refreshCoachNotes();
    };
    look();
    document.addEventListener("visibilitychange", look);
    const off = useAccount.subscribe((now, before) => {
      if (before.account && !now.account) forgetNotes();
      if (now.account && !before.account) void refreshCoachNotes(Date.now(), true);
    });
    return () => {
      document.removeEventListener("visibilitychange", look);
      off();
    };
  }, [ready, profile.onboarded]);

  if (!ready) return <TodaySkeleton />;
  if (!profile.onboarded) return <Onboarding />;

  const screens: Record<Route, ReactNode> = {
    today: <Today />,
    workout: <Workout />,
    recovery: <Recovery />,
    stats: <Stats />,
    gym: <Gym />,
    settings: <Settings />,
    done: <Done />,
    setup: <Onboarding rerun />,
    feedback: <Feedback />,
    achievements: <Achievements />,
    recap: <Recap arg={arg} />,
    photos: <Photos />,
    programs: <Programs />,
    injuries: <Injuries />,
    training: <TrainingSettings />,
    tools: <Tools arg={arg} />,
    remix: <Remix code={arg} />,
    pro: <Pro />,
    account: <Account />,
    connections: <Connections />,
    stretch: <StretchScreen arg={arg} />,
    routine: <SharedRoutine code={arg} />,
    friends: <Friends key={arg ?? ""} tab={arg} />,
    person: <PersonScreen key={arg ?? ""} handle={arg ?? ""} />,
    invite: <InviteScreen key={arg ?? ""} code={arg ?? ""} />,
    club: <ClubScreen key={arg ?? ""} code={arg ?? ""} />,
    trainer: <Trainer arg={arg} />,
    exercise: <ExercisePage key={arg ?? ""} id={arg} />,
    gymlink: <SharedGym key={arg ?? ""} code={arg} />,
    log: <LogPast />,
  };
  const screen = screens[route];
  const showNav = !FULL_SCREEN.has(route);
  // Desktop layout (layout.ts): a sidebar instead of the tab bar and a wider page. Full-screen screens (the
  // workout among them) stay a focused, phone-width panel in the middle of the window, with no sidebar.
  const sidebar = desktop && showNav;
  // The thank-you after buying Pro sits over every screen, setup included (a purchase moves on at once).
  if (route === "setup")
    return (
      <>
        <StatusScrim />
        {screen}
        <ProWelcome />
        <Toaster />
      </>
    );
  return (
    <>
      <StatusScrim />
      <div className={sidebar ? "pl-60" : undefined}>
        <main
          key={route}
          className={`aurora safe-top animate-fade mx-auto px-5 ${sidebar ? "max-w-3xl px-10 pt-8" : "max-w-lg"} ${showNav ? "clear-nav" : ""}`}
        >
          <ScreenBoundary>{screen}</ScreenBoundary>
        </main>
      </div>
      <ProWelcome />
      {sidebar ? <Sidebar route={route} /> : showNav && <TabBar route={route} />}
      <Toaster />
    </>
  );
}

// The status bar sits over the page (Android 15+ draws edge to edge, iOS always does), so scrolled
// content would show through it. This strip, the height of the status bar, covers it on every screen.
// It's 0 high in a browser, where the safe area is 0.
function StatusScrim() {
  return <div aria-hidden className="status-scrim" />;
}

// The tab bar publishes its real height (it grows with the text size and the phone's gesture or
// button bar) as --nav-h, so screens pad their bottom by it (.clear-nav) and Today's Start button
// sits right above it, rather than guessing a fixed padding the bar can outgrow.
function TabBar({ route }: { route: Route }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const set = () => root.style.setProperty("--nav-h", `${el.offsetHeight}px`);
    set();
    if (typeof ResizeObserver === "undefined") return () => root.style.removeProperty("--nav-h");
    const ro = new ResizeObserver(set);
    ro.observe(el, { box: "border-box" });
    return () => {
      ro.disconnect();
      root.style.removeProperty("--nav-h");
    };
  }, []);
  const waiting = useFriendsWaiting();
  const tabs = visibleTabs();
  return (
    <nav
      ref={ref}
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-bg/92 backdrop-blur-xl"
      aria-label={t("nav.main")}
    >
      <ul className={`mx-auto grid max-w-lg px-1 pt-1.5 ${tabs.length === 5 ? "grid-cols-5" : "grid-cols-4"}`}>
        {tabs.map((tab) => {
          const on = route === tab.route;
          // Friends carries a dot while follows, requests, likes or comments are waiting, and says so to screen readers.
          const dot = tab.route === "friends" && waiting > 0;
          return (
            <li key={tab.route}>
              <button
                type="button"
                aria-current={on ? "page" : undefined}
                aria-label={dot ? t("friends.openWaiting", { count: waiting }) : undefined}
                onClick={() => {
                  if (!on) haptic("select");
                  go(tab.route);
                }}
                className={`press flex w-full flex-col items-center gap-1 py-1.5 text-[0.6875rem] font-medium ${on ? "text-ink" : "text-faint"}`}
              >
                <span
                  className={`relative grid h-8 w-12 place-items-center rounded-full transition-colors duration-200 ${on ? "bg-accent/18 text-accent shadow-[0_0_18px_-4px_rgb(76_141_255/0.6)]" : ""}`}
                >
                  <Icon name={tab.icon} size={22} strokeWidth={on ? 2.4 : 2} />
                  {dot && <span aria-hidden className="absolute right-2 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg bg-accent" />}
                </span>
                {t(tab.label)}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** The tabs on screen: Friends hides while the social flag is off. */
function visibleTabs() {
  return TABS.filter((tab) => tab.route !== "friends" || socialOn());
}

// The desktop layout's navigation (layout.ts, docs/decisions/desktop-layout.md): the same five tabs as the
// phone's tab bar, down the left side, so it is the tab bar and nothing else is added to it (one control, one
// destination). It sets --nav-h to 0 (nothing covers the bottom of the page) and --side-w to its width, so bars
// pinned to the bottom of a screen and toasts start after it.
function Sidebar({ route }: { route: Route }) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--nav-h", "0px");
    root.style.setProperty("--side-w", "15rem");
    return () => {
      root.style.removeProperty("--nav-h");
      root.style.removeProperty("--side-w");
    };
  }, []);
  const waiting = useFriendsWaiting();
  return (
    <nav
      className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col gap-6 border-r border-line/70 bg-bg/92 px-3 py-6 backdrop-blur-xl"
      aria-label={t("nav.main")}
    >
      <div className="flex items-center gap-2.5 px-3 text-lg font-extrabold tracking-tight text-ink">
        {/* The app icon, like the site header's (SiteChrome BrandMark). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" aria-hidden width={32} height={32} className="size-8 rounded-lg" />
        {BRAND.name}
      </div>
      <ul className="flex flex-col gap-1">
        {visibleTabs().map((tab) => {
          const on = route === tab.route;
          const dot = tab.route === "friends" && waiting > 0;
          return (
            <li key={tab.route}>
              <button
                type="button"
                aria-current={on ? "page" : undefined}
                aria-label={dot ? t("friends.openWaiting", { count: waiting }) : undefined}
                onClick={() => {
                  if (!on) haptic("select");
                  go(tab.route);
                }}
                className={`press flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-base font-semibold transition-colors duration-200 ${on ? "bg-accent/14 text-ink" : "text-muted hover:bg-raised hover:text-ink"}`}
              >
                <span className={`relative grid place-items-center ${on ? "text-accent" : ""}`}>
                  <Icon name={tab.icon} size={22} strokeWidth={on ? 2.4 : 2} />
                  {dot && <span aria-hidden className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-bg bg-accent" />}
                </span>
                {t(tab.label)}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
