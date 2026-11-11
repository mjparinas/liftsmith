"use client";

import { useEffect, useRef, useState } from "react";

import { imuProfile } from "@/lib/reps/imu";
import { parseWatchMotion, WatchRepCount } from "@/lib/reps/watchMotion";
import { onWatchMotion } from "@/lib/sessionNotify";
import type { Pattern } from "@/lib/types";

/**
 * Watch rep counting (Labs, `labWatchReps`): while `on` (the lab is on, a set is under way and the camera isn't
 * counting), the watch's motion batches are counted for this set, and each new count goes to `onCount`, which
 * fills in the reps for Log set, so logging stays one tap. `setKey` changes when a set is logged, which starts a
 * fresh count. Returns the reps counted this set, or null until the watch has sent anything.
 */
export function useWatchReps({
  on,
  exerciseId,
  pattern,
  setKey,
  onCount,
}: {
  on: boolean;
  exerciseId?: string;
  pattern?: Pattern;
  setKey: string;
  onCount: (reps: number) => void;
}): number | null {
  // The count, tagged with the set it belongs to, so a new set reads as nothing yet without clearing state.
  const [count, setCount] = useState<{ key: string; n: number } | null>(null);
  const report = useRef(onCount);
  useEffect(() => {
    report.current = onCount;
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
    });
  }, [live, key]); // eslint-disable-line react-hooks/exhaustive-deps
  return live && count?.key === key ? count.n : null;
}
