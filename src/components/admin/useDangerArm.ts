"use client";

// Shared two-tap arming for Operate danger actions (Reports, Community). Esc clears.
// Account delete / maintenance still use typed confirms — heavier stakes stay heavier.
import { useEffect, useState } from "react";

export type Armed = { id: string; action: string };

/** Arm a danger action on the first call; run `doIt` on the matching second call. Esc cancels. */
export function useDangerArm() {
  const [armed, setArmed] = useState<Armed | null>(null);
  useEffect(() => {
    if (!armed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setArmed(null);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [armed]);
  const isArmed = (id: string, action: string) => armed?.id === id && armed.action === action;
  /** Returns true when the action was sent (not merely armed). */
  const request = (id: string, action: string, needsConfirm: boolean, doIt: () => void): boolean => {
    if (needsConfirm && !isArmed(id, action)) {
      setArmed({ id, action });
      return false;
    }
    setArmed(null);
    doIt();
    return true;
  };
  return { armed, setArmed, isArmed, request };
}
