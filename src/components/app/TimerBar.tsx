"use client";

import { useEffect, useRef } from "react";

import { calm } from "@/lib/juice";
import { liteDemos } from "@/lib/liteDemos";

/** Ms between redraws: every frame, 15 a second with battery saver, 4 a second with reduced motion or Lean mode. */
export function barStep(): number {
  if (calm()) return 250;
  if (liteDemos()) return 66;
  return 0;
}

/** How far a bar from `from` to `to` (wall-clock ms) is at `now`, 0 to 1. */
export function barFraction(now: number, from: number, to: number): number {
  if (to <= from) return 1;
  return Math.max(0, Math.min(1, (now - from) / (to - from)));
}

/**
 * The thin bar under a timer (a hold, a stretch), filling smoothly from `from` to `to` instead of a step at every
 * whole second (Melvin, 2026-11-27: "smoothly completes instead of big increments at the 1 second mark"). It draws
 * itself on animation frames straight into the bar's transform, so React renders nothing per frame, the browser stops
 * it while the app is hidden, and battery saver and reduced motion redraw less often. `paused` holds it at `at`.
 * `reverse` empties it instead (time left rather than time done).
 */
export function TimerBar({
  from,
  to,
  paused,
  at,
  reverse,
  className = "",
  fill,
}: {
  from: number;
  to: number;
  paused?: boolean;
  /** The moment to show while paused. */
  at?: number;
  reverse?: boolean;
  className?: string;
  /** Classes for the filled part (its colour). */
  fill: string;
}) {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const draw = (now: number) => {
      const f = barFraction(now, from, to);
      el.style.transform = `translateX(${((reverse ? 1 - f : f) - 1) * 100}%)`;
    };
    if (paused || typeof requestAnimationFrame !== "function") {
      draw(at ?? Date.now());
      return;
    }
    let frame = 0;
    let last = 0;
    const loop = () => {
      const now = Date.now();
      if (now - last >= barStep()) {
        last = now;
        draw(now);
      }
      if (now < to) frame = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frame);
  }, [from, to, paused, at, reverse]);
  return (
    <div className={`overflow-hidden rounded-full bg-line ${className}`} aria-hidden>
      <div ref={bar} className={`h-full w-full rounded-full ${fill}`} style={{ transform: `translateX(${reverse ? 0 : -100}%)` }} />
    </div>
  );
}
