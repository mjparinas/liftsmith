"use client";

import { useMemo, type CSSProperties } from "react";

import { SECTION_LABEL } from "@/components/titles";
import { clockTime, date, inSentence, list, t } from "@/lib/i18n";
import { nextUp } from "@/lib/nextUp";
import { useApp } from "@/lib/store";
import { MUSCLE_LABEL, type Muscle } from "@/lib/types";
import { useNow } from "@/lib/useNow";

import { Icon } from "./icons";
import { HUE } from "./theme";

/**
 * "What's next" on the workout summary (polish pass, Melvin 2026-11-10): the next training day and why
 * the next plan will look the way it does, from the recovery model run forward to that day.
 */
export function NextUpCard({ sessionId }: { sessionId: string }) {
  const { events, profile } = useApp();
  const now = useNow(60_000);
  const n = useMemo(() => nextUp(events, sessionId, profile, now), [events, sessionId, profile, now]);
  if (!n) return null;
  const d = new Date(n.at);
  // Mid-sentence muscle names in lower case ("Chest and quads will be fresh"), the first one capitalised.
  const muscles = (ms: readonly Muscle[]) => {
    const text = list(ms.map((m) => inSentence(MUSCLE_LABEL[m], true)));
    return text.charAt(0).toLocaleUpperCase() + text.slice(1);
  };
  const lines: string[] = [];
  const slow = n.waiting[0];
  if (slow) lines.push(t("pol.next.waiting", { muscle: MUSCLE_LABEL[slow.muscle], hours: slow.hours }));
  if (n.ready.length) lines.push(t("pol.next.ready", { muscles: muscles(n.ready.slice(0, 3)) }));
  if (n.fresh.length) lines.push(t("pol.next.fresh", { muscles: muscles(n.fresh) }));
  return (
    <section
      className="card-tint animate-rise mt-4 flex items-start gap-3 p-4 text-left"
      style={{ "--tint": HUE.cyan } as CSSProperties}
      data-testid="next-up"
    >
      <span
        aria-hidden
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
        style={{ background: `color-mix(in srgb, ${HUE.cyan} 18%, transparent)`, color: HUE.cyan }}
      >
        <Icon name="calendar" size={20} />
      </span>
      <div className="min-w-0">
        <h2 className={SECTION_LABEL}>{t("pol.next.title")}</h2>
        <p className="mt-0.5 font-semibold">
          {t("pol.next.when", { day: date(d, { weekday: "long" }), time: clockTime(d.getHours(), d.getMinutes()) })}
        </p>
        {lines.map((l) => (
          <p key={l} className="mt-1 text-sm text-muted">
            {l}
          </p>
        ))}
      </div>
    </section>
  );
}
