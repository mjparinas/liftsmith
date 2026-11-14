"use client";

import { useRef, type TouchEvent } from "react";

// A sideways swipe on a month calendar changes month (Progress › History, Coaching › Schedule). Touches that start
// close to a screen edge belong to the phone's back gesture, and a mostly vertical drag is a scroll.

/** A horizontal swipe this long (px) changes month; touches this close to an edge belong to the phone's back gesture. */
const SWIPE = { distance: 48, edge: 24 };

/** Touch handlers for a month calendar: `shift(1)` on a swipe to the left, `shift(-1)` to the right. */
export function useMonthSwipe(shift: (by: number) => void) {
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: TouchEvent) => {
    const p = e.touches[0];
    touch.current = p && p.clientX > SWIPE.edge && p.clientX < window.innerWidth - SWIPE.edge ? { x: p.clientX, y: p.clientY } : null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touch.current;
    const p = e.changedTouches[0];
    touch.current = null;
    if (!start || !p) return;
    const dx = p.clientX - start.x;
    const dy = p.clientY - start.y;
    if (Math.abs(dx) >= SWIPE.distance && Math.abs(dx) > Math.abs(dy) * 1.5) shift(dx < 0 ? 1 : -1);
  };
  return { onTouchStart, onTouchEnd };
}
