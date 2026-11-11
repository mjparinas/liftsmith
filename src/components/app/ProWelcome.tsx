"use client";

import { create } from "zustand";

import { t } from "@/lib/i18n";
import { confetti, haptic, sound } from "@/lib/juice";

import { Mascot } from "./Mascot";
import { ProFeatures } from "./Pro";
import { go } from "./router";
import { Button, Sheet } from "./ui";

// The thank-you after a purchase or trial start that unlocked Pro (Melvin, 2026-11-10): confetti, the
// celebrate haptic and the fanfare, then a sheet that thanks the lifter for taking their health seriously
// and lists what Pro unlocked. Never on Restore purchases (nothing new was bought). Confetti and the sound
// follow Lean mode and reduce motion, the buzz follows Settings › Vibration (all inside juice.ts). It lives
// outside the screens because a purchase moves on to another screen (or ends setup) straight away.

type Welcome = { open: boolean; trialDays: number | null };

export const useProWelcome = create<Welcome>(() => ({ open: false, trialDays: null }));

/** Celebrate a purchase or trial start that unlocked Pro. `trialDays` is set when it began a free trial. */
export function celebratePro(trialDays?: number | null) {
  haptic("celebrate");
  sound.fanfare();
  void confetti(true);
  useProWelcome.setState({ open: true, trialDays: trialDays ?? null });
}

export function ProWelcome() {
  const { open, trialDays } = useProWelcome();
  const close = () => useProWelcome.setState({ open: false });
  return (
    <Sheet open={open} onClose={close} title={trialDays ? t("pro.welcome.trialTitle") : t("pro.welcome.title")}>
      <div className="text-center">
        <Mascot mood="cheer" size={88} className="animate-spring-in" />
        <p className="mt-2 text-lg font-semibold">{t("pro.welcome.lead")}</p>
        <p className="mt-1 text-muted">{t("pro.welcome.body")}</p>
      </div>
      <p className="mt-5 text-xs font-semibold tracking-wider text-muted uppercase">{t("pro.welcome.unlocked")}</p>
      <ProFeatures compact />
      <p className="mt-4 text-sm text-muted">{t("pro.welcome.reward")}</p>
      {trialDays ? <p className="mt-4 text-sm text-muted">{t("pro.welcome.trialNote", { days: trialDays })}</p> : null}
      <Button
        className="mt-6 w-full"
        onClick={() => {
          close();
          go("today");
        }}
      >
        {t("pro.welcome.go")}
      </Button>
    </Sheet>
  );
}
