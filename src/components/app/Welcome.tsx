"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";

import { LiftDemo } from "@/components/demo/LiftDemo";
import { useAccount } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { coachCode, playCoachSignupUrl, playCoachUrl } from "@/lib/coachInvite";
import { t } from "@/lib/i18n";
import { calm, isNative } from "@/lib/juice";
import { useApp } from "@/lib/store";
import { syncNow } from "@/lib/sync";
import { readSync } from "@/lib/syncOutbox";
import type { MessageKey } from "@/locales/en";

import { AccountPanel } from "./Account";
import { Icon, type IconName } from "./icons";
import { go, replaceRoute } from "./router";
import { Button, Sheet } from "./ui";

const POINTS: { icon: IconName; hue: string; key: MessageKey }[] = [
  { icon: "target", hue: "var(--color-accent)", key: "setup.welcome.plan" },
  { icon: "bolt", hue: "var(--color-ember)", key: "setup.welcome.tap" },
  { icon: "clock", hue: "var(--color-cyan)", key: "setup.welcome.quick" },
];

/**
 * The first thing a new install sees, before the setup wizard's first question (Melvin, 2026-11-10: opening straight
 * onto "What are you training for?" felt jarring). One screen: the 3D lifter, what the app does, Get started, and sign-in for a lifter
 * who already has an account. Only on the very first run; "Run setup again" in Settings skips it.
 *
 * Opened with a coach's invite (`coach`, trainer mode 2026-11-12), it says so and asks to sign in first, because sharing
 * workouts with a coach goes through the account; setup then takes the short coach path. Without one, a quiet "Got a
 * code from a coach?" takes the code typed in (the App Store has no install referrer, and links get lost).
 *
 * Opened from the website's coaches page (`coaching`, 2026-11-12), it's the coach's way in: sign in first (clients find
 * a coach through the account), then setup skips the save step and ends on the coaching screen. "I'm here to train"
 * goes back to the usual setup.
 */
export function Welcome({
  onStart,
  coach = "",
  onCoach = () => {},
  coaching = false,
  onCoaching = () => {},
}: {
  onStart: (signedIn?: boolean) => void;
  coach?: string;
  onCoach?: (code: string) => void;
  /** Came in through the website's coaches page (coachInvite.ts, coachSignup): signing up as a coach. */
  coaching?: boolean;
  onCoaching?: (on: boolean) => void;
}) {
  // Which welcome: a client's invite, a coach signing up, or the usual one.
  const kind = coach ? "coach" : coaching ? "coaching" : null;
  // The website's "Sign in" link opens the app at #/account: on the welcome screen that's the sign-in sheet.
  const [signIn, setSignIn] = useState(() => typeof location !== "undefined" && location.hash.startsWith("#/account"));
  const [asking, setAsking] = useState(false);
  const restoring = useRestore(signIn, () => setSignIn(false), onStart);
  const signedIn = useAccount((s) => !!s.account);
  return (
    <main className="aurora safe-top safe-bottom mx-auto flex min-h-dvh max-w-lg flex-col px-5">
      <div className="animate-rise flex flex-1 flex-col justify-center py-3">
        {/* The 3D lifter squatting (the exercise demo engine, bare: no frame or readout). Reduced motion holds a still pose;
            phones without GPU WebGL get the 2D figure, as everywhere else. Decoration only, so hidden from screen readers;
            it takes taps only for the easter egg (five quick taps and it dances, lib/demo/dance.ts). */}
        <div className="keep-colours relative -mx-5 h-[14rem]" aria-hidden>
          <LiftDemo exerciseId="back-squat" className="h-full" fps={30} still={calm()} bare />
        </div>
        <p className="text-gradient mt-2 text-center text-sm font-bold uppercase tracking-[0.16em]">
          {kind ? t(`setup.${kind}.kicker`) : BRAND.name}
        </p>
        <h1 className="mt-2 text-center text-3xl font-extrabold tracking-tight">
          {kind ? t(`setup.${kind}.title`) : t("setup.welcome.title")}
        </h1>
        <p className="mt-3 text-center text-muted">{kind ? t(`setup.${kind}.lead`) : t("setup.welcome.lead")}</p>
        {/* Not for a coach or a coach's client: "No account needed" would contradict signing in first. */}
        <ul className={`stagger mt-6 space-y-2.5 ${kind ? "hidden" : ""}`}>
          {POINTS.map((p) => (
            <li key={p.key} className="card-tint flex items-center gap-3 px-4 py-3" style={{ "--tint": p.hue } as CSSProperties}>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface" style={{ color: p.hue }}>
                <Icon name={p.icon} />
              </span>
              <span className="text-sm font-medium">{t(p.key)}</span>
            </li>
          ))}
        </ul>
      </div>
      {kind ? (
        <div className="space-y-2 pb-2">
          <Button className="w-full py-4 text-lg" onClick={() => (signedIn ? onStart() : setSignIn(true))}>
            {signedIn ? t("setup.welcome.start") : t("setup.coach.signIn")}
          </Button>
          {/* On an Android phone in the browser: the app, with the code as the install referrer so it arrives there too. */}
          {!isNative() && /Android/i.test(typeof navigator === "undefined" ? "" : navigator.userAgent) && (
            <a
              href={coach ? playCoachUrl(coach) : playCoachSignupUrl()}
              className="press flex min-h-11 w-full items-center justify-center rounded-2xl border border-line bg-surface px-4 text-sm font-semibold"
            >
              {t("setup.coach.getApp")}
            </a>
          )}
          <Button
            kind="quiet"
            className="w-full"
            onClick={() => {
              if (coach) onCoach("");
              else onCoaching(false);
              onStart();
            }}
          >
            {coach ? t("setup.coach.own") : t("setup.coaching.train")}
          </Button>
        </div>
      ) : (
        <div className="space-y-2 pb-2">
          <Button className="w-full py-4 text-lg" onClick={() => onStart()}>
            {t("setup.welcome.start")}
          </Button>
          {/* A lifter with an account signs in instead: sync brings their profile back and setup ends. */}
          <Button kind="quiet" className="w-full" onClick={() => setSignIn(true)}>
            {t("setup.welcome.signIn")}
          </Button>
          <Button kind="quiet" className="w-full" onClick={() => setAsking(true)}>
            {t("setup.coach.have")}
          </Button>
        </div>
      )}
      <CodeSheet
        open={asking}
        onClose={() => setAsking(false)}
        onCode={(c) => {
          setAsking(false);
          onCoach(c);
        }}
      />
      <Sheet open={signIn} onClose={() => setSignIn(false)} title={t("account.signIn")}>
        {restoring === "busy" ? (
          <p role="status" className="py-6 text-center text-muted">
            {t("setup.welcome.restoring")}
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted">{t("account.lead")}</p>
            {restoring === "failed" && (
              <p role="alert" className="mb-3 text-sm text-warn">
                {t("account.syncError")}
              </p>
            )}
            <AccountPanel />
          </>
        )}
      </Sheet>
    </main>
  );
}

/** "Got a code from a coach?": the code typed in, or their invite link pasted. */
function CodeSheet({ open, onClose, onCode }: { open: boolean; onClose: () => void; onCode: (code: string) => void }) {
  const [text, setText] = useState("");
  const [bad, setBad] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const c = coachCode(text);
    if (!c) return setBad(true);
    setBad(false);
    setText("");
    onCode(c);
  };
  return (
    <Sheet open={open} onClose={onClose} title={t("setup.coach.enter")}>
      <form onSubmit={submit}>
        <label htmlFor="welcome-coach-code" className="block text-sm text-muted">
          {t("setup.coach.enterHint")}
        </label>
        <div className="mt-3 flex gap-2">
          <input
            id="welcome-coach-code"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="num min-w-0 flex-1 rounded-xl border border-line bg-raised px-3 py-2 uppercase tracking-widest"
            placeholder="ABCD-EFGH"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
          <Button submit disabled={!text.trim()}>
            {t("setup.coach.use")}
          </Button>
        </div>
        {bad && (
          <p role="alert" className="mt-2 text-sm text-warn">
            {t("trn.err.unknown")}
          </p>
        )}
      </form>
    </Sheet>
  );
}

/**
 * After signing in here (any method: Google, Apple or an emailed code, on the web, Android and iOS), bring the account
 * back and leave setup (Melvin, 2026-11-11: signing in left him on the sign-in sheet over the welcome screen).
 * The first sync pulls the account's profile, gyms and workouts; the account's profile wins on a first sync, so a set-up
 * account ends setup by itself (App shows the app once `profile.onboarded`), and this opens Today. An account with
 * workouts but no finished profile is treated as set up too. An account with nothing on it yet carries on into the
 * setup questions, signed in, so what they answer syncs. If the sync fails, the sheet stays with a note and Sync now.
 */
function useRestore(open: boolean, close: () => void, onStart: (signedIn?: boolean) => void): "idle" | "busy" | "failed" {
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");
  const last = useRef({ close, onStart });
  useEffect(() => {
    last.current = { close, onStart };
  });

  useEffect(() => {
    if (!open) return;
    let live = true;
    let failed = false;
    const finish = () => {
      const app = useApp.getState();
      if (!app.profile.onboarded && app.events.length > 0 && app.gyms.length > 0) app.setProfile({ onboarded: true });
      setState("idle");
      last.current.close();
      if (useApp.getState().profile.onboarded) go("today");
      else last.current.onStart(true);
    };
    const synced = () => !readSync().lastError && !!useAccount.getState().account;
    // Only a sign-in made while the sheet is open counts: a device already signed in restores through App's own sync.
    const off = useAccount.subscribe((now, before) => {
      if (now.account && !before.account) {
        // Came in through the website's Sign in link (#/account): point the app at Today now. The first sync can bring a
        // set-up profile back, and App then swaps this screen for the app before the sync's promise settles, so waiting
        // for it to call go("today") left the lifter on Settings › Account (Melvin, 2026-11-11).
        if (location.hash.startsWith("#/account")) replaceRoute("today");
        setState("busy");
        void syncNow().then(() => {
          if (!live) return;
          failed = !synced();
          if (failed) setState("failed");
          else finish();
        });
      } else if (!now.account && before.account) {
        failed = false;
        setState("idle");
      } else if (failed && before.busy && !now.busy && synced()) {
        // After a failed first sync, the panel's Sync now (or the app coming back online) tries again; a good one finishes.
        failed = false;
        finish();
      }
    });
    return () => {
      live = false;
      off();
    };
  }, [open]);
  return state;
}
