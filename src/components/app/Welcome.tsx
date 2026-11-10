"use client";

import { useState, type CSSProperties } from "react";

import { LiftDemo } from "@/components/demo/LiftDemo";
import { BRAND } from "@/lib/brand";
import { t } from "@/lib/i18n";
import { calm } from "@/lib/juice";
import type { MessageKey } from "@/locales/en";

import { AccountPanel } from "./Account";
import { Icon, type IconName } from "./icons";
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
export function Welcome({ onStart }: { onStart: () => void }) {
  const [signIn, setSignIn] = useState(false);
  return (
    <main className="aurora safe-top safe-bottom mx-auto flex min-h-dvh max-w-lg flex-col px-5">
      <div className="animate-rise flex flex-1 flex-col justify-center py-3">
        {/* The 3D lifter squatting (the exercise demo engine, bare: no frame or readout). Reduced motion holds a still pose;
            phones without GPU WebGL get the 2D figure, as everywhere else. Decoration only, so hidden from screen readers. */}
        <div className="keep-colours pointer-events-none relative -mx-5 h-[14rem]" aria-hidden>
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
        <p className="mb-4 text-sm text-muted">{t("account.lead")}</p>
        <AccountPanel onSignedIn={() => setSignIn(false)} />
      </Sheet>
    </main>
  );
}
