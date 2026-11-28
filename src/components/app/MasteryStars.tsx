"use client";

import { useDeferredValue, useMemo } from "react";

import { t } from "@/lib/i18n";
import { MAX_STARS, setCounts, starsFor } from "@/lib/mastery";
import { useApp } from "@/lib/store";

import { Icon } from "./icons";

// The stars of lift mastery (mastery.ts), apart from Mastery.tsx so the workout screen doesn't load the Awards code.

/** Four stars, filled up to the lift's, read out as "Mastery: 2 of 4 stars". */
export function MasteryStars({ stars, size = 14 }: { stars: number; size?: number }) {
  return (
    <span role="img" aria-label={t("mst.label", { stars })} className="inline-flex items-center gap-0.5 text-gold">
      {Array.from({ length: MAX_STARS }, (_, i) => (
        <Icon key={i} name="star" size={size} strokeWidth={1.6} filled={i < stars} className={i < stars ? "" : "opacity-40"} />
      ))}
    </span>
  );
}

/**
 * A compact line of stars for a lift on the workout screen, or nothing before its first star. It counts this one lift
 * from the deferred events rather than the whole game, so Log set paints first.
 */
export function LiftStars({ exerciseId }: { exerciseId: string }) {
  const events = useDeferredValue(useApp((s) => s.events));
  const stars = useMemo(() => starsFor(setCounts(events, exerciseId).get(exerciseId) ?? 0), [events, exerciseId]);
  return stars ? <MasteryStars stars={stars} size={12} /> : null;
}
