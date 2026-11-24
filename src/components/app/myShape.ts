"use client";

// The lifter's own figure (bodyShape.ts) for every 3D figure in the app, behind Body › Health's
// "Shape the figure like me" switch (profile.shapeFigure): Health, the recovery map and the exercise demos.
// Undefined while the switch is off or there's nothing to shape from, so each figure keeps its average build.
import { useMemo } from "react";

import { bodyFor } from "@/components/demo/LiftDemo";
import { canShape, shapeBody, statsFrom, statsKey, type BodyStats } from "@/lib/bodyShape";
import type { Body } from "@/lib/demo/rig";
import { useApp } from "@/lib/store";
import { bodyCompOn } from "@/lib/teen";

/** The lifter's numbers and whether there's enough of them to shape a figure. */
export function useMyStats(): { stats: BodyStats; shapeable: boolean; key: string } {
  const profile = useApp((s) => s.profile);
  const events = useApp((s) => s.events);
  return useMemo(() => {
    const stats = statsFrom(profile, events);
    return { stats, shapeable: canShape(stats), key: statsKey(stats) };
  }, [profile, events]);
}

/** The figure shaped like the lifter, or undefined for the average one. */
export function useMyShape(): Body | undefined {
  // Under 18, the shaped figure waits until body composition is turned on (teen.ts).
  const on = useApp((s) => !!s.profile.shapeFigure && bodyCompOn(s.profile));
  const sex = useApp((s) => s.profile.sex);
  const { stats, shapeable, key } = useMyStats();
  // Keyed by the weigh-in / tape numbers, not the events array: a logged set must not hand the demo a
  // new Body reference (that rebuilt the whole figure and flickered after a personal best).
  return useMemo(() => (on && shapeable ? shapeBody(bodyFor(sex), stats) : undefined), [on, sex, shapeable, key]); // eslint-disable-line react-hooks/exhaustive-deps
}
