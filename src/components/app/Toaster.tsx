"use client";

import { createPortal } from "react-dom";

import { clearToast, useToast } from "@/lib/toast";

/** Draws the toast from `toast()` above everything, sheets included, clear of the tab bar and the phone's bottom bar. */
export function Toaster() {
  const current = useToast();
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="toast-wrap pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-5" role="status" aria-live="polite">
      {current && (
        <p
          key={current.id}
          className={`toast animate-rise flex max-w-sm items-center gap-3 px-4 text-center text-sm font-semibold ${current.action ? "pointer-events-auto py-1" : "py-2.5"}`}
          data-testid="toast"
        >
          <span>{current.text}</span>
          {current.action && (
            <button
              type="button"
              className="press min-h-11 shrink-0 px-2 text-accent underline"
              onClick={() => {
                current.action?.run();
                clearToast();
              }}
            >
              {current.action.label}
            </button>
          )}
        </p>
      )}
    </div>,
    document.body,
  );
}
