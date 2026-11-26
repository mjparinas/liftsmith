"use client";

import { useEffect, useMemo } from "react";

import { queueStrava, stravaWorkout } from "@/lib/connections";
import { saveWorkout } from "@/lib/health";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { toast } from "@/lib/toast";
import { useNow } from "@/lib/useNow";
import {
  doneWatchWorkout,
  keepCarry,
  onWatchWorkout,
  parseWatchResult,
  pushCarry,
  readCarries,
  waitingWatchWorkouts,
  watchEvents,
} from "@/lib/watchWorkout";

import { buildCarry } from "./workout/watchCarry";

// Phone-free workouts on the watch (docs/decisions/watch-apps.md "Phone-free workouts"). Two jobs, both in the
// background: keep today's plan on the watches (sent only when it changes, like the home-screen widget), and save
// the workouts the watches ran on their own as they reach the phone.

/** Keeps the watches' copy of today's plan in step with Today. A phone workout keeps the last one in place. */
export function useWatchCarry() {
  const { ready, profile, preview, readiness, active, gyms } = useApp();
  const now = useNow(3600_000);
  const day = new Date(now).toDateString();
  const running = !!active;
  const gym = gyms.find((g) => g.id === (preview?.gymId ?? profile.activeGymId)) ?? gyms[0];
  const built = useMemo(
    () => (ready && profile.onboarded && !running ? buildCarry({ plan: preview, profile, gym, readiness, now }) : undefined),
    // `now` only matters for the day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, profile, preview, readiness, running, gym, day],
  );
  useEffect(() => {
    if (built === undefined) return;
    if (built) keepCarry(built.record);
    // Nothing a watch can run today (a rest day, cardio only): the watch takes the plan off.
    void pushCarry(built ? JSON.stringify(built.carry) : "{}");
  }, [built]);
}

/** One watch workout from the phone's queue: saved once, then the queue forgets it. Returns the sets saved. */
export function saveWatchWorkout(raw: unknown, now = Date.now()): number {
  const r = parseWatchResult(raw, now);
  const id = r?.id ?? (raw && typeof raw === "object" ? String((raw as { id?: unknown }).id ?? "") : "");
  const rec = r && readCarries().find((x) => x.id === r.c);
  const evs = r && rec ? watchEvents(rec, r) : null;
  let sets = 0;
  if (r && evs) {
    const s = useApp.getState();
    if (s.addWatchWorkout(evs)) {
      sets = evs.filter((e) => e.type === "set").length;
      const { events, profile } = useApp.getState();
      const end = evs.find((e) => e.type === "sessionEnd");
      const summary = stravaWorkout(events, `watch-${r.id}`, profile.unit);
      void saveWorkout({
        id: `watch-${r.id}`,
        start: r.start,
        end: r.end,
        bodyweightKg: profile.bodyweight,
        avgHr: end?.type === "sessionEnd" ? end.avgHr : undefined,
        title: summary?.name,
        notes: summary?.description,
      });
      queueStrava(`watch-${r.id}`);
    }
  }
  // Saved, seen before, or unreadable (a plan this phone no longer has can't be replayed): the queue lets it go.
  if (id) void doneWatchWorkout(id);
  return sets;
}

/** Saves the watch workouts waiting on the phone: when the app opens, comes back, or one arrives while it's open. */
export function useWatchWorkouts() {
  const ready = useApp((s) => s.ready && s.profile.onboarded);
  useEffect(() => {
    if (!ready) return;
    let busy = false;
    const take = async () => {
      if (busy) return;
      busy = true;
      try {
        for (const raw of await waitingWatchWorkouts()) {
          const n = saveWatchWorkout(raw);
          if (n > 0) toast(t("wcarry.saved", { count: n }));
        }
      } finally {
        busy = false;
      }
    };
    void take();
    const off = onWatchWorkout(() => void take());
    const back = () => document.visibilityState === "visible" && void take();
    document.addEventListener("visibilitychange", back);
    return () => {
      off();
      document.removeEventListener("visibilitychange", back);
    };
  }, [ready]);
}
