"use client";

import { useEffect, useMemo } from "react";

import { useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import { pushWidget, recoveryPart, weekPart, widgetSnapshot } from "@/lib/widget";

import { useGame } from "./Achievements";
import { readDismissed, useInsights } from "./Insights";

/**
 * Keeps the home-screen widget in step with Today (widget.ts). The snapshot is rebuilt from the same
 * data as Today and sent to the native widget only when a line changes, so the widget never polls.
 */
export function useHomeWidget() {
  const { ready, profile, preview, readiness, active, events, stats } = useApp();
  const g = useGame();
  const notes = useInsights();
  const now = useNow(3600_000);
  const day = new Date(now).toDateString();
  const running = !!active;
  const hour = Math.floor(now / 3600_000);
  // The Recovery widget's ready times: rebuilt when a set is logged, and each hour so "ready Tue 6 PM" stays right.
  const rec = useMemo(
    () => (ready && profile.onboarded ? recoveryPart(events, now) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, profile.onboarded, events, hour],
  );
  const snap = useMemo(() => {
    if (!ready || !profile.onboarded) return null;
    const dismissed = readDismissed();
    const today = widgetSnapshot({
      plan: preview,
      readiness,
      active: running,
      streak: g.streak,
      goal: profile.daysPerWeek,
      notes: notes.filter((n) => !dismissed.includes(n.id)),
      now,
    });
    const week = weekPart({ sessions: stats.sessions, stretchDays: stats.stretchDays, profile, streak: g.streak, now });
    return { ...today, week, ...(rec ? { rec } : {}) };
    // `now` only matters for the day; rebuilding each hour is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, profile.onboarded, profile.daysPerWeek, profile.calendar, preview, readiness, running, g.streak, notes, day, stats, rec]);
  useEffect(() => {
    if (snap) void pushWidget(snap);
  }, [snap]);
}
