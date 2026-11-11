"use client";

import type { CSSProperties } from "react";

import { Info } from "@/components/Info";
import { track } from "@/lib/analytics";
import { t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";
import { roundLoad } from "@/lib/loads";
import { speedMax, type WarmupSpeed } from "@/lib/reps/speedMax";
import type { Exercise, Gym, Unit } from "@/lib/types";
import { fromKg, toKg } from "@/lib/units";

import { loadText } from "../format";
import { Icon } from "../icons";
import { HUE } from "../theme";
import { Button } from "../ui";

// Today's max from warm-ups (Labs, `labSpeedMax`; src/lib/reps/speedMax.ts). While the camera counts the
// warm-ups, each one's fastest rep is kept here, by workout and exercise and in warm-up order; in the rest
// after the last warm-up, the card says what the speeds point to and offers the working weight in one tap.
// Kept in memory only: it's advice for the sets in front of the lifter, and an undone warm-up drops its speed.

const speeds = new Map<string, WarmupSpeed[]>();
const keyOf = (sessionId: string, exerciseId: string) => `${sessionId}:${exerciseId}`;

/** Records warm-up `index`'s weight and fastest rep for this workout's exercise. */
export function recordWarmupSpeed(sessionId: string, exerciseId: string, index: number, w: WarmupSpeed) {
  const list = speeds.get(keyOf(sessionId, exerciseId)) ?? [];
  list[index] = w;
  speeds.set(keyOf(sessionId, exerciseId), list);
}

/** Drops speeds from warm-up `done` on (an undone warm-up, or a fresh start). */
export function trimWarmupSpeeds(sessionId: string, exerciseId: string, done: number) {
  const list = speeds.get(keyOf(sessionId, exerciseId));
  if (list && list.length > done) list.length = done;
}

export function warmupSpeeds(sessionId: string, exerciseId: string): WarmupSpeed[] {
  return (speeds.get(keyOf(sessionId, exerciseId)) ?? []).filter(Boolean);
}

/** Forgets every recorded speed (tests). */
export function clearWarmupSpeeds() {
  speeds.clear();
}

/** A weight in the lifter's unit, rounded to a whole number, for the estimated max. */
function wholeKg(kg: number, unit: Unit) {
  return toKg(Math.round(fromKg(kg, unit)), unit);
}

/**
 * The card in the rest after the last warm-up. `planned` is the working set the plan wrote; `weight` is
 * what's dialled in now, so the button turns into a confirmation once the nudge is used.
 */
export function SpeedNudge({
  sessionId,
  ex,
  gym,
  planned,
  weight,
  reps,
  onUse,
}: {
  sessionId: string;
  ex: Exercise;
  gym: Gym;
  planned: { weight: number; reps: number; rir: number };
  weight: number;
  reps: number;
  onUse: (kg: number, reps: number) => void;
}) {
  const r = speedMax(warmupSpeeds(sessionId, ex.id), { pattern: ex.pattern, ...planned }, (kg) => roundLoad(kg, ex, gym).kg);
  if (!r) return null;
  const unit = gym.unit;
  const vars = {
    max: loadText(ex, wholeKg(r.max, unit), unit),
    pct: Math.round(Math.abs(r.diff) * 100),
    weight: loadText(ex, r.weight, unit),
  };
  const used = Math.abs(weight - r.weight) < 1e-6;
  return (
    <section className="card-tint animate-pop mt-5 p-4" style={{ "--tint": HUE.violet } as CSSProperties} data-testid="speed-nudge">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        <Icon name="bolt" size={14} className="text-accent" />
        {t("count.max.title")}
        <Info term="speedMax" />
      </div>
      <p className="mt-1.5 text-sm">{t(`count.max.${r.call}`, vars)}</p>
      {r.call !== "hold" &&
        (used ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-good" role="status">
            <Icon name="check" size={16} />
            {t("count.max.used", { weight: vars.weight })}
          </p>
        ) : (
          <Button
            kind="ghost"
            className="mt-3 w-full"
            onClick={() => {
              haptic("select");
              onUse(r.weight, reps);
              track("feature", { name: "speed_max", detail: r.call });
            }}
          >
            {t("count.max.use", { weight: vars.weight })}
          </Button>
        ))}
    </section>
  );
}
