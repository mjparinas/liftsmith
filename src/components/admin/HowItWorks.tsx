"use client";

// A long explanation folded behind a small "How this works" link (Melvin, 2026-11-15: the Gyms tab read like a
// manual). Closed by default; the text is still in the page for search and screen readers once opened.
import type { ReactNode } from "react";

export function HowItWorks({ children }: { children: ReactNode }) {
  return (
    <details className="group text-sm">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs text-muted underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="transition-transform group-open:rotate-90">
          ›
        </span>
        How this works
      </summary>
      <div className="mt-1 grid gap-2 text-muted">{children}</div>
    </details>
  );
}
