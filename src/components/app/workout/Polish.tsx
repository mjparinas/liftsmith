"use client";

import { useEffect, useRef, useState } from "react";

import { platform } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { haptic, isNative, sound } from "@/lib/juice";
import { hrReady } from "@/lib/restReady";
import { useApp, type Active } from "@/lib/store";
import { loadTips, saveTips, tipFor, type TipId } from "@/lib/tips";
import type { MessageKey } from "@/locales/en";

import { Icon } from "../icons";

// The polish pass on the workout screen (Melvin, 2026-11-10): Undo for the last Log set, the heart
// rate "ready" line and one tip per workout on the rest card. None of them adds a tap during a set.

/** "Undo" above Log set, for as long as the last Log set can be taken back. */
export function UndoChip({ now, warmup }: { now: number; warmup: boolean }) {
  const s = useApp();
  const u = s.undoable;
  if (!u || now > u.until || u.prev.sessionId !== s.active?.sessionId) return null;
  return (
    <button
      type="button"
      onClick={() => {
        haptic("tick");
        sound.back();
        s.undoLast();
      }}
      aria-label={warmup ? t("pol.undoWarm") : t("pol.undoLabel")}
      className="press animate-rise inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-surface/90 px-4 text-sm font-semibold text-muted backdrop-blur hover:text-ink"
      data-testid="undo-set"
    >
      <Icon name="undo" size={16} />
      {t("pol.undo")}
    </button>
  );
}

/**
 * Heart-rate-ready rest: once the heart rate is back near where the last set started, one line says so
 * (with a light tick, once). It never ends the rest by itself, unless the heart-rate rest timer lab cut
 * it (Workout.tsx), and then it says so and by how much.
 */
export function HrReadyLine({ active, setStart, now }: { active: Active; setStart: number | undefined; now: number }) {
  const cut = active.hrCut && active.hrCut.restStart === active.restStart ? active.hrCut : null;
  const r = cut ?? (setStart && active.restStart ? hrReady(active, setStart, active.restStart, now) : null);
  const told = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (r && told.current !== active.restStart) {
      told.current = active.restStart;
      haptic("select");
    }
  }, [r, active.restStart]);
  if (!r) return null;
  return (
    <p
      className="animate-rise mt-3 flex items-start gap-2 rounded-xl bg-heart/10 px-3 py-2 text-sm text-ink"
      data-testid={cut ? "hr-cut" : "hr-ready"}
    >
      <Icon name="heart" size={16} filled strokeWidth={1.5} className="mt-0.5 shrink-0 text-heart" />
      <span>
        {cut ? t("lab.hrRest.cut", { bpm: cut.bpm, start: cut.start, saved: cut.saved }) : t("pol.ready", { bpm: r.bpm, start: r.start })}
      </span>
    </p>
  );
}

const TIP_KEY: Record<TipId, MessageKey> = {
  undo: "pol.tip.undo",
  reorder: "pol.tip.reorder",
  superset: "pol.tip.superset",
  swap: "pol.tip.swap",
  handsFree: "pol.tip.handsFree",
  voice: "pol.tip.voice",
  oneHand: "pol.tip.oneHand",
};

/** One tip per workout at most, on the rest card, each one shown once (tips.ts). */
export function TipCard({ active, setsLogged }: { active: Active; setsLogged: number }) {
  const { profile } = useApp();
  const upcoming = active.plan.items.length - active.index - 1;
  // Picked when the rest card appears (it mounts for each rest), and saved straight away: shown once.
  const [tip, setTip] = useState<TipId | null>(() => {
    const r = tipFor(loadTips(), active.sessionId, {
      native: isNative(),
      voice: !!profile.delight?.voice,
      oneHanded: !!profile.a11y?.hand && profile.a11y.hand !== "off",
      upcoming,
      setsLogged,
    });
    saveTips(r.state);
    return r.tip;
  });
  if (!tip) return null;
  return (
    <div
      className="animate-rise mt-4 flex w-full items-start gap-2.5 rounded-2xl border border-line bg-raised/70 p-3 text-left"
      data-testid="tip"
    >
      <Icon name="lightbulb" size={18} className="mt-0.5 shrink-0 text-violet" />
      <p className="flex-1 text-sm text-muted">
        <span className="font-semibold text-ink">{t("pol.tip")}</span> {t(TIP_KEY[tip])}
      </p>
      <button
        type="button"
        onClick={() => {
          haptic("tick");
          saveTips({ ...loadTips(), hidden: true });
          setTip(null);
        }}
        className="press -my-1.5 min-h-11 shrink-0 rounded-full px-2 text-sm font-semibold text-accent"
      >
        {t("pol.tip.gotIt")}
      </button>
    </div>
  );
}

/** The phone feels the last three seconds of rest: a light tick each second. Android's service does it natively. */
export function countdownTick(vibrate: boolean) {
  if (vibrate && platform() !== "android") haptic("select", true);
}
