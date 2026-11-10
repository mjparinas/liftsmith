"use client";

import { useEffect, useMemo } from "react";

import { useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import { pushWidget, widgetSnapshot } from "@/lib/widget";

import { useGame } from "./Achievements";
import { readDismissed, useInsights } from "./Insights";

/**
 * Keeps the home-screen widget in step with Today (widget.ts). The snapshot is rebuilt from the same
 * data as Today and sent to the native widget only when a line changes, so the widget never polls.
 */
export function useHomeWidget() {
  const { ready, profile, preview, readiness, active } = useApp();
  const g = useGame();
  const notes = useInsights();
  const now = useNow(3600_000);
  const day = new Date(now).toDateString();
  const running = !!active;
  const snap = useMemo(() => {
    if (!ready || !profile.onboarded) return null;
    const dismissed = readDismissed();
    return widgetSnapshot({
      plan: preview,
      readiness,
      active: running,
      streak: g.streak,
      goal: profile.daysPerWeek,
      notes: notes.filter((n) => !dismissed.includes(n.id)),
      now,
    });
    // `now` only matters for the day; rebuilding each hour is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, profile.onboarded, profile.daysPerWeek, preview, readiness, running, g.streak, notes, day]);
  useEffect(() => {
    if (snap) void pushWidget(snap);
  }, [snap]);
}
