"use client";

// The admin panel's frame, in the app's own look (Melvin, 2026-11-17: "make the liftsmith admin skinned
// similarly to the main app"): the app icon and wordmark, the soft top light (.aurora), the app's stroke icons
// and section labels, and on a wide window a sidebar like the web app's desktop layout. One nav in the page:
// a sidebar from lg up, rows of chips that wrap above it (every section stays in view, Melvin 2026-11-12).
import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/app/icons";
import { BuildStamp } from "@/components/BuildStamp";
import { SCREEN_TITLE, SECTION_LABEL } from "@/components/titles";

/** Each section's icon, from the app's one icon set. */
export const TAB_ICONS: Record<string, IconName> = {
  Overview: "today",
  "To Do": "check",
  Inbox: "mail",
  Reports: "flag",
  Gyms: "gym",
  Traffic: "chart",
  Acquisition: "target",
  Funnel: "funnel",
  Retention: "repeat",
  Engagement: "flame",
  Devices: "phone",
  Revenue: "dollar",
  Codes: "ticket",
  Users: "people",
  Installs: "layers",
  Flags: "toggle",
  Automations: "sparkle",
  System: "server",
  Log: "list",
};

/** The sections in groups, in the tab order: a label over each group in the sidebar. */
export const TAB_GROUPS: readonly { label: string; tabs: readonly string[] }[] = [
  { label: "Work", tabs: ["Overview", "To Do", "Inbox", "Reports", "Gyms"] },
  { label: "Numbers", tabs: ["Traffic", "Acquisition", "Funnel", "Retention", "Engagement", "Devices", "Revenue", "Codes"] },
  { label: "People", tabs: ["Users", "Installs"] },
  { label: "Running", tabs: ["Flags", "Automations", "System", "Log"] },
];

/** The app icon (public/icon.svg), the same file as the favicon and the site header's mark. */
export function AdminMark({ size = 32 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/icon.svg" alt="" aria-hidden width={size} height={size} className="shrink-0 rounded-lg" />;
}

/** "Liftsmith admin" as the wordmark: the icon, the name and an Admin pill. Read aloud as "Liftsmith admin". */
export function AdminBrand({ as: Tag = "h1" }: { as?: "h1" | "div" }) {
  return (
    <Tag className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-ink">
      <AdminMark />
      <span>
        Liftsmith{" "}
        <span className="ml-0.5 rounded-full border border-accent/40 bg-accent/14 px-2 py-0.5 align-middle text-xs font-bold uppercase tracking-[0.12em] text-accent">
          admin
        </span>
      </span>
    </Tag>
  );
}

/** One section button: an icon and a name, lit while open, with a count when something waits there. */
function NavItem({ tab, on, badge, onClick }: { tab: string; on: boolean; badge?: number; onClick: () => void }) {
  return (
    <li className="lg:w-full">
      <button
        type="button"
        aria-current={on ? "page" : undefined}
        onClick={onClick}
        className={`press flex min-h-9 items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors duration-200 lg:min-h-0 lg:w-full lg:py-[0.4rem] lg:gap-3 lg:text-left ${
          on ? "bg-accent/14 text-ink" : "text-muted hover:bg-raised hover:text-ink"
        }`}
      >
        <span className={on ? "text-accent" : ""}>
          <Icon name={TAB_ICONS[tab] ?? "more"} size={18} strokeWidth={on ? 2.4 : 2} />
        </span>
        <span className="lg:flex-1">{tab}</span>
        {badge ? (
          <span className="btn-primary rounded-full px-1.5 text-xs font-bold tabular-nums" aria-label={`${badge} waiting`}>
            {badge}
          </span>
        ) : null}
      </button>
    </li>
  );
}

/**
 * The frame around every tab. On a phone: the wordmark and who's signed in, then the sections as chips that
 * wrap, then the bar with the section's title, search and period. From lg up the wordmark, sections and sign-out
 * sit in a fixed sidebar, and the bar (data-admin-header) stays pinned at the top.
 */
export function AdminShell({
  tab,
  onTab,
  badges = {},
  staff,
  onSignOut,
  tools,
  children,
}: {
  tab: string;
  onTab?: (t: string) => void;
  badges?: Partial<Record<string, number>>;
  staff?: { email: string; role: string };
  onSignOut?: () => void;
  /** The search box, period chips and any header buttons, beside the title. */
  tools?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="admin aurora min-h-dvh">
      <aside className="flex flex-wrap items-center gap-x-3 gap-y-3 px-4 pt-4 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-60 lg:flex-col lg:flex-nowrap lg:items-stretch lg:gap-4 lg:overflow-y-auto lg:border-r lg:border-line/70 lg:bg-bg/92 lg:px-3 lg:py-5 lg:backdrop-blur-xl">
        <div className="order-1 lg:px-2">
          <AdminBrand />
        </div>
        <div className="order-2 ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted lg:order-3 lg:ml-0 lg:mt-auto lg:flex-col lg:items-stretch lg:gap-2 lg:border-t lg:border-line/70 lg:px-2 lg:pt-4">
          {staff && (
            <span className="min-w-0 break-all">
              {staff.email} <span className="rounded-full bg-raised px-1.5 py-0.5 text-[0.7rem] font-semibold">{staff.role}</span>
            </span>
          )}
          {onSignOut && (
            <button type="button" className="text-left text-muted underline hover:text-ink" onClick={onSignOut}>
              Sign out
            </button>
          )}
          <BuildStamp className="hidden lg:block" />
        </div>
        <nav className="order-3 flex w-full flex-wrap gap-1 lg:order-2 lg:block" aria-label="Sections">
          {TAB_GROUPS.map((g) => (
            <div key={g.label} className="contents lg:mb-3 lg:block">
              <div className={`${SECTION_LABEL} hidden px-3 pb-1.5 lg:block`} aria-hidden>
                {g.label}
              </div>
              <ul className="contents lg:flex lg:flex-col lg:gap-0.5">
                {g.tabs.map((t) => (
                  <NavItem key={t} tab={t} on={tab === t} badge={badges[t]} onClick={() => onTab?.(t)} />
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 pb-16">
          <header
            data-admin-header
            className="z-20 -mx-4 border-b border-line/70 bg-bg/85 px-4 pb-3 pt-3 backdrop-blur-xl md:sticky md:top-0 lg:pt-5"
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="mr-auto flex min-w-0 items-center gap-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/14 text-accent" aria-hidden>
                  <Icon name={TAB_ICONS[tab] ?? "more"} size={20} />
                </span>
                <h2 className={SCREEN_TITLE}>{tab}</h2>
                <BuildStamp className="ml-1 text-xs text-muted lg:hidden" />
              </div>
              {tools}
            </div>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}

/** The sign-in and two-step pages: the wordmark over one card, in the middle of the soft top light. */
export function AdminAuthCard({ title, sub, children }: { title: string; sub?: ReactNode; children: ReactNode }) {
  return (
    <main className="admin aurora flex min-h-dvh flex-col items-center px-5 py-16">
      <div className="w-full max-w-md">
        <AdminBrand as="div" />
        <div className="card mt-6 p-6">
          <h1 className="text-xl font-extrabold leading-tight tracking-tight">{title}</h1>
          {sub && <div className="mt-1 text-sm text-muted">{sub}</div>}
          <div className="mt-5">{children}</div>
        </div>
        <BuildStamp className="mt-4 block text-center text-xs text-muted" />
      </div>
    </main>
  );
}
