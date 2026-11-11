"use client";

import { useEffect, useRef } from "react";

import { WARN_MS } from "@/lib/handsFree";
import { t } from "@/lib/i18n";

/**
 * Hands-free sets (Labs): logs the set once `left` (milliseconds until it's due, handsFree.ts) runs out, and
 * says so over the last few seconds, so another rep keeps the set going. Nothing to tap.
 */
export function HandsFree({ left, onLog }: { left: number; onLog: () => void }) {
  const log = useRef(onLog);
  useEffect(() => {
    log.current = onLog;
  });
  const due = left <= 0;
  useEffect(() => {
    if (due) log.current();
  }, [due]);
  if (due || left > WARN_MS) return null;
  return (
    <p className="mb-2 text-center text-sm text-muted" role="status" data-testid="hands-free">
      {t("lab.handsFree.soon", { s: Math.ceil(left / 1000) })}
    </p>
  );
}
