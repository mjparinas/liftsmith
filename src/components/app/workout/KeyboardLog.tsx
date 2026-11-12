"use client";

import { useEffect, useRef } from "react";

import { t } from "@/lib/i18n";
import { useDesktop } from "@/lib/layout";
import { useApp } from "@/lib/store";

// Keyboard shortcuts for the workout on the desktop layout (docs/decisions/desktop-layout.md, stage 3; Melvin chose
// the workout as a focused panel on desktop): L logs the set (ending rest first, like the volume button), ↑ and ↓
// change the reps and Shift with ↑ or ↓ the weight. Never while typing in a box, while a sheet is open, or with
// Ctrl, Cmd or Alt held (the browser's own shortcuts). The keys are shown in one quiet line under Log set.

export interface Keys {
  onLog: () => void;
  weight?: { onUp: () => void; onDown: () => void } | null;
  reps?: { onUp: () => void; onDown: () => void } | null;
}

/** What a key press does, or null when it isn't ours. */
export function keyAction(e: Pick<KeyboardEvent, "key" | "shiftKey" | "ctrlKey" | "metaKey" | "altKey">, k: Keys): (() => void) | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  if (e.key === "l" || e.key === "L") return e.shiftKey ? null : k.onLog;
  const step = e.shiftKey ? k.weight : k.reps;
  if (e.key === "ArrowUp") return step?.onUp ?? null;
  if (e.key === "ArrowDown") return step?.onDown ?? null;
  return null;
}

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

export function KeyboardLog({ paused, ...keys }: Keys & { paused: boolean }) {
  const desktop = useDesktop();
  const latest = useRef(keys);
  useEffect(() => {
    latest.current = keys;
  });
  useEffect(() => {
    if (!desktop || paused) return;
    const on = (e: KeyboardEvent) => {
      if (e.repeat && (e.key === "l" || e.key === "L")) return; // a held L logs once
      if (typing(e.target) || document.querySelector("[role=dialog]")) return;
      const k = latest.current;
      const act = keyAction(e, {
        ...k,
        onLog: () => {
          const st = useApp.getState();
          if (!st.active) return;
          if (st.active.restUntil && st.active.restUntil > Date.now()) st.skipRest();
          k.onLog();
        },
      });
      if (!act) return;
      e.preventDefault();
      act();
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [desktop, paused]);
  if (!desktop) return null;
  return <p className="mt-2 text-center text-xs text-faint">{t("workout.keys")}</p>;
}
