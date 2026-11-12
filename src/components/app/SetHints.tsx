"use client";

import { t } from "@/lib/i18n";
import { TIMED } from "@/lib/progression";
import { implementsFor, perSide } from "@/lib/sides";
import type { Exercise } from "@/lib/types";

import { Icon } from "./icons";

/**
 * The lines under a move's name that say how its numbers count, on the workout screen, its how-to sheet
 * and the exercise page: the weight is per dumbbell for a pair (Melvin, 2026-11-12: "make it clear
 * especially for dumbbell exercises that it's the weight per arm"), and the reps per side (below).
 */
export function SetHints({ ex, className = "" }: { ex: Pick<Exercise, "id" | "cardio" | "load">; className?: string }) {
  const pair = !ex.cardio && ex.load === "dumbbell" && implementsFor(ex) === 2;
  const side = !ex.cardio && perSide(ex.id);
  if (!pair && !side) return null;
  return (
    <div className={`space-y-1 ${className}`}>
      {pair && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-accent" data-testid="hand-hint">
          <Icon name="dumbbell" size={16} className="shrink-0" />
          {t("fmt.perHand")}
        </p>
      )}
      <SideHint ex={ex} />
    </div>
  );
}

/**
 * "Reps are per side. Do them on both sides." under the name of a move done one side at a time (split
 * squats, one-arm rows, side planks), on the workout screen, its how-to sheet and the exercise page,
 * so nobody does 8 reps in total when the plan meant 8 on each side (Melvin, 2026-11-12).
 */
export function SideHint({ ex, className = "" }: { ex: Pick<Exercise, "id" | "cardio">; className?: string }) {
  if (ex.cardio || !perSide(ex.id)) return null;
  return (
    <p className={`flex items-center gap-1.5 text-sm font-medium text-accent ${className}`} data-testid="side-hint">
      <Icon name="sides" size={16} className="shrink-0" />
      {t(TIMED.has(ex.id) ? "fmt.sideHold" : "fmt.sideReps")}
    </p>
  );
}
