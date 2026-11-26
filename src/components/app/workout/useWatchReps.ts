"use client";

import { useEffect, useRef, useState } from "react";

import { imuProfile } from "@/lib/reps/imu";
import type { SetSummary } from "@/lib/reps/types";
import { parseWatchMotion, WatchRepCount } from "@/lib/reps/watchMotion";
import { onWatchMotion } from "@/lib/sessionNotify";
import type { Pattern } from "@/lib/types";

/**
 * Watch rep counting (Labs, `labWatchReps`): while `on` (the lab is on, a set is under way and the camera isn't
 * counting), the watch's motion batches are counted for this set, and each new count goes to `onCount`, which
 * fills in the reps for Log set, so logging stays one tap. `setKey` changes when a set is logged, which starts a
 * fresh count. `onSummary`, when given, gets the set's rep-by-rep summary with each new count (wrist bar speed,
 * Labs). Returns the reps counted this set, or null until the watch has sent anything.
 */
export function useWatchReps({
  on,
  exerciseId,
  pattern,
  setKey,
  onCount,
  onSummary,
}: {
  on: boolean;
  exerciseId?: string;
  pattern?: Pattern;
  setKey: string;
  onCount: (reps: number) => void;
  onSummary?: (sum: SetSummary) => void;
}): number | null {
  // The count, tagged with the set it belongs to, so a new set reads as nothing yet without clearing state.
  const [count, setCount] = useState<{ key: string; n: number } | null>(null);
  const report = useRef(onCount);
  const summarize = useRef(onSummary);
  useEffect(() => {
    report.current = onCount;
    summarize.current = onSummary;
  });
  const profile = on && exerciseId && pattern ? imuProfile(exerciseId, pattern) : undefined;
  const live = !!profile;
  const key = `${exerciseId}:${setKey}`;
  useEffect(() => {
    if (!live || !profile) return;
    const counter = new WatchRepCount(profile);
    let last = -1;
    return onWatchMotion((batch) => {
      const samples = parseWatchMotion(batch);
      if (!samples.length) return;
      const n = counter.push(samples);
      if (n === last) return;
      last = n;
      setCount({ key, n });
      if (n > 0) report.current(n);
      const sum = n > 0 ? counter.summary() : undefined;
      if (sum) summarize.current?.(sum);
    });
  }, [live, key]); // eslint-disable-line react-hooks/exhaustive-deps
  return live && count?.key === key ? count.n : null;
}
