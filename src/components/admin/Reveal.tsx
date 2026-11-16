"use client";

// Brings an opened account, install or message into view. The detail panels open at the top of their tab (or,
// on a phone, under the Inbox list), so clicking Open on a row far down the page used to change nothing you
// could see and looked like a dead link (Melvin, 2026-11-16). Each new id scrolls the panel to the top of the
// window and moves focus there, so keyboard and screen reader users land on it too
// (not in the Inbox, whose j and k keys open the next message from the list).
import { useEffect, useRef, type ReactNode } from "react";

export function Reveal({ children, label, focus = true }: { children: ReactNode; label: string; focus?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    // On a wide window the header (title and tabs) stays pinned, so the panel stops just under it.
    const head = document.querySelector<HTMLElement>("[data-admin-header]");
    const under = head && getComputedStyle(head).position === "sticky" ? head.offsetHeight : 0;
    // Its top already on screen (a shared link, a reload, the Inbox's side-by-side reader): leave the page be.
    if (top < under || top > innerHeight - 120) {
      const still = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
      scrollTo({ top: Math.max(0, scrollY + top - under - 16), behavior: still ? "auto" : "smooth" });
    }
    if (focus) el.focus({ preventScroll: true });
  }, [focus]);
  return (
    <div ref={ref} tabIndex={-1} role="region" aria-label={label} className="outline-none" data-reveal>
      {children}
    </div>
  );
}
