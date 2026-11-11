"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { LiftDemo } from "@/components/demo/LiftDemo";
import { useAccount } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { t } from "@/lib/i18n";
import { calm } from "@/lib/juice";
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
 */
export function Welcome({ onStart }: { onStart: (signedIn?: boolean) => void }) {
  // The website's "Sign in" link opens the app at #/account: on the welcome screen that's the sign-in sheet.
  const [signIn, setSignIn] = useState(() => typeof location !== "undefined" && location.hash.startsWith("#/account"));
  const restoring = useRestore(signIn, () => setSignIn(false), onStart);
  return (
    <main className="aurora safe-top safe-bottom mx-auto flex min-h-dvh max-w-lg flex-col px-5">
      <div className="animate-rise flex flex-1 flex-col justify-center py-3">
        {/* The 3D lifter squatting (the exercise demo engine, bare: no frame or readout). Reduced motion holds a still pose;
            phones without GPU WebGL get the 2D figure, as everywhere else. Decoration only, so hidden from screen readers;
            it takes taps only for the easter egg (five quick taps and it dances, lib/demo/dance.ts). */}
        <div className="keep-colours relative -mx-5 h-[14rem]" aria-hidden>
          <LiftDemo exerciseId="back-squat" className="h-full" fps={30} still={calm()} bare />
        </div>
        <p className="text-gradient mt-2 text-center text-sm font-bold uppercase tracking-[0.16em]">{BRAND.name}</p>
        <h1 className="mt-2 text-center text-3xl font-extrabold tracking-tight">{t("setup.welcome.title")}</h1>
        <p className="mt-3 text-center text-muted">{t("setup.welcome.lead")}</p>
        <ul className="stagger mt-6 space-y-2.5">
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
      <div className="space-y-2 pb-2">
        <Button className="w-full py-4 text-lg" onClick={onStart}>
          {t("setup.welcome.start")}
        </Button>
        {/* A lifter with an account signs in instead: sync brings their profile back and setup ends. */}
        <Button kind="quiet" className="w-full" onClick={() => setSignIn(true)}>
          {t("setup.welcome.signIn")}
        </Button>
      </div>
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
