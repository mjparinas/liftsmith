"use client";

import { createPortal } from "react-dom";

import { useToast } from "@/lib/toast";

/** Draws the toast from `toast()` above everything, sheets included, clear of the tab bar and the phone's bottom bar. */
export function Toaster() {
  const current = useToast();
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="toast-wrap pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-5" role="status" aria-live="polite">
      {current && (
        <p key={current.id} className="toast animate-rise max-w-sm px-4 py-2.5 text-center text-sm font-semibold" data-testid="toast">
          {current.text}
        </p>
      )}
    </div>,
    document.body,
  );
}
