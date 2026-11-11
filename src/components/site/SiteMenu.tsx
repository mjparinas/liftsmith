"use client";

// The site header's menu on screens too narrow for every link (below lg). A <details> so it opens without script;
// script only closes it after a tap on a link (a same-page anchor like /#faq doesn't navigate), on Escape and on a tap outside.
import Link from "next/link";
import { useEffect, useRef } from "react";

import type { NavLink } from "./SiteChrome";

export function SiteMenu({
  links,
  label = "Menu",
  navLabel = "Site menu",
  narrowOnly,
}: {
  links: readonly NavLink[];
  label?: string;
  navLabel?: string;
  /** A link the header shows beside the menu on wider screens (Sign in), listed here only below 400 px. */
  narrowOnly?: NavLink;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const close = () => {
      if (ref.current) ref.current.open = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !ref.current?.open) return;
      close();
      ref.current.querySelector("summary")?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, []);

  const close = () => {
    if (ref.current) ref.current.open = false;
  };

  return (
    <details ref={ref} className="group relative lg:hidden">
      <summary
        aria-label={label}
        className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink [&::-webkit-details-marker]:hidden"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" className="group-open:hidden" />
          <path d="M6 6l12 12M18 6L6 18" className="hidden group-open:block" />
        </svg>
      </summary>
      <nav aria-label={navLabel} className="card absolute right-0 top-full z-40 mt-2 w-56 p-2 shadow-xl">
        <ul>
          {links.map((n) => (
            <li key={n.href}>
              <Link href={n.href} onClick={close} className="flex min-h-11 items-center rounded-lg px-3 text-base hover:bg-surface">
                {n.label}
              </Link>
            </li>
          ))}
          {narrowOnly && (
            <li className="min-[400px]:hidden">
              <Link
                href={narrowOnly.href}
                prefetch={false}
                data-cta="menu-signin"
                onClick={close}
                className="flex min-h-11 items-center rounded-lg px-3 text-base text-muted hover:bg-surface hover:text-ink"
              >
                {narrowOnly.label}
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </details>
  );
}
