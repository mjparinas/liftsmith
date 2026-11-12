"use client";

import { useEffect, useRef } from "react";

import { useApp } from "@/lib/store";
import { onVolumePress } from "@/lib/volumeKeys";

// Volume up logs a set (Labs, phones only, src/lib/volumeKeys.ts). Draws nothing: while it's mounted and
// nothing covers the workout, a press of volume up on the phone or the earbuds does what Log set does.
// Pressed during rest, the next set is done, the same as voice logging treats it. Started again for each
// set (`setKey`), because the voice coach and voice logging can end iOS's audio session in between.
export function VolumeLog({ setKey, onLog, paused }: { setKey: string; onLog: () => void; paused: boolean }) {
  const latest = useRef(onLog);
  useEffect(() => {
    latest.current = onLog;
  });
  useEffect(() => {
    if (paused) return;
    return onVolumePress(() => {
      const st = useApp.getState();
      if (!st.active) return;
      if (st.active.restUntil && st.active.restUntil > Date.now()) st.skipRest();
      latest.current();
    });
  }, [paused, setKey]);
  return null;
}
