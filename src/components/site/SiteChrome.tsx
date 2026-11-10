// Shared frame for the public SEO pages (exercises, muscles, equipment, guides, blog, tools): header, footer,
// breadcrumbs and the calls to action. Calls to action are the point of these pages (Melvin, 2026-11-09:
// "emphasis on the call to actions"), so every page gets a header button, at least one inline prompt, a big
// banner with the store badges at the end, and a sticky bar on phones. Each placement has its own data-cta
// name, and the site beacon records it with the page path, so the admin panel shows which ones work.
import Link from "next/link";
import type { ReactNode } from "react";

import { BRAND } from "@/lib/brand";
import { APP_PATH, SITE_URL } from "@/lib/site";

import { StoreBadges } from "./StoreBadges";

const APP_ONLY = /^\/(app|me)\//;

export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
      <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-accent text-accent-ink">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M2 10h2V7h3v10H4v-3H2zm20 0h-2V7h-3v10h3v-3h2zM8 11h8v2H8z" />
        </svg>
      </span>
      {BRAND.name}
    </Link>
  );
}

export const NAV = [
  { href: "/exercises/", label: "Exercises" },
  { href: "/guides/", label: "Guides" },
  { href: "/blog/", label: "Blog" },
  { href: "/tools/", label: "Tools" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/85 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Logo />
        <nav aria-label="Site" className="flex items-center gap-1 text-sm font-semibold sm:gap-2">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hidden rounded-lg px-3 py-2 hover:bg-surface md:inline">
              {n.label}
            </Link>
          ))}
          <Link
            href={APP_PATH}
            prefetch={false}
            data-cta="header"
            className="press btn-primary ml-1 inline-flex min-h-11 items-center rounded-xl px-4"
          >
            Start free
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  // The app (/app/) and the dashboard (/me/) are big client-only pages: never prefetch their code from a public page,
  // or every visitor downloads it whether they open it or not.
  const col = (title: string, links: { href: string; label: string }[]) => (
    <nav aria-label={title}>
      <p className="font-semibold">{title}</p>
      <ul className="mt-2 space-y-2 text-sm text-muted">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} prefetch={APP_ONLY.test(l.href) ? false : undefined} className="hover:text-ink">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
        <div>
          <p className="text-lg font-bold">{BRAND.name}</p>
          <p className="mt-2 max-w-sm text-sm text-muted">
            {BRAND.tagline} Adaptive strength training for Android, iPhone and the web. No ads, ever.
          </p>
          <StoreBadges className="mt-4" webLink={false} place="footer" />
        </div>
        {col("Product", [
          { href: APP_PATH, label: "Open the app" },
          { href: "/#features", label: "Features" },
          { href: "/#pricing", label: "Pricing" },
          { href: "/me/", label: "Your dashboard" },
        ])}
        {col("Learn", [
          { href: "/exercises/", label: "Exercise library" },
          { href: "/muscles/", label: "Exercises by muscle" },
          { href: "/equipment/", label: "Exercises by equipment" },
          { href: "/guides/", label: "Training guides" },
          { href: "/blog/", label: "Blog" },
        ])}
        {col("Tools", [
          { href: "/tools/plate-calculator/", label: "Plate calculator" },
          { href: "/tools/one-rep-max-calculator/", label: "One-rep max calculator" },
          { href: "/tools/tdee-calculator/", label: "TDEE calculator" },
        ])}
        {col("Company", [
          { href: "/compare/", label: "Compare apps" },
          { href: "/privacy/", label: "Privacy" },
          { href: "/trust/", label: "Trust centre" },
          { href: "/delete-account/", label: "Delete your account" },
          { href: "/#faq", label: "FAQ" },
        ])}
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted">
        © {new Date().getFullYear()} {BRAND.name}. Google Play and the Google Play logo are trademarks of Google LLC. Apple, the Apple logo
        and iPhone are trademarks of Apple Inc. App Store is a service mark of Apple Inc.
      </p>
    </footer>
  );
}

export interface Crumb {
  href?: string;
  label: string;
}

/** Breadcrumbs plus their BreadcrumbList data. The last crumb is the current page. */
export function Crumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ href: "/", label: BRAND.name }, ...items];
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE_URL}${c.href}` } : {}),
    })),
  };
  return (
    <>
      <JsonLd data={data} />
      <nav className="text-sm text-muted" aria-label="Breadcrumb">
        <ol className="flex flex-wrap gap-x-1.5">
          {all.map((c, i) => (
            <li key={i} className="flex gap-x-1.5">
              {i > 0 && <span aria-hidden>›</span>}
              {c.href && i < all.length - 1 ? (
                <Link href={c.href} className="hover:text-ink">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={i === all.length - 1 ? "page" : undefined}>{c.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

/** The main button into the app. */
export function CtaButton({ cta, children = "Start free", big }: { cta: string; children?: ReactNode; big?: boolean }) {
  return (
    <Link
      href={APP_PATH}
      prefetch={false}
      data-cta={cta}
      className={`press btn-primary inline-flex items-center justify-center rounded-2xl font-semibold ${big ? "min-h-14 px-7 text-lg" : "min-h-12 px-6"}`}
    >
      {children}
    </Link>
  );
}

/** The big end-of-page call to action, with the store badges. */
export function CtaBanner({
  cta,
  title,
  body,
  button = "Start free in your browser",
}: {
  cta: string;
  title: string;
  body: string;
  button?: string;
}) {
  return (
    <section className="card-tint mt-12 p-6 md:p-10" style={{ ["--tint" as string]: "var(--color-violet)" }} aria-label="Get the app">
      <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-lg text-muted">{body}</p>
      <ul className="mt-4 grid gap-1.5 text-sm text-muted sm:grid-cols-2">
        <li>✓ Free to start, no account needed</li>
        <li>✓ Plans every set, rep and weight for you</li>
        <li>✓ Works offline, on Android, iPhone and the web</li>
        <li>✓ No ads, ever</li>
      </ul>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <CtaButton cta={cta} big>
          {button}
        </CtaButton>
        <StoreBadges webLink={false} place={`${cta}-badges`} />
      </div>
    </section>
  );
}

/** A slim prompt inside the content. */
export function CtaInline({ cta, title, body, button = "Try it free" }: { cta: string; title: string; body: string; button?: string }) {
  return (
    <aside className="card-tint my-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between" aria-label="Try the app">
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-sm text-muted">{body}</p>
      </div>
      <div className="shrink-0">
        <CtaButton cta={cta}>{button}</CtaButton>
      </div>
    </aside>
  );
}

/** A bar pinned to the bottom of the screen on phones, so the next step is always one tap away. */
export function StickyCta({ cta, text = `Get your plan in ${BRAND.name}` }: { cta: string; text?: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-bg/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-lg md:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <p className="text-sm font-semibold">{text}</p>
        <Link
          href={APP_PATH}
          prefetch={false}
          data-cta={cta}
          className="press btn-primary inline-flex min-h-11 shrink-0 items-center rounded-xl px-4 font-semibold"
        >
          Start free
        </Link>
      </div>
    </div>
  );
}

/** Header, content, footer and the sticky bar. `kind` names the page type for the sticky bar's data-cta. */
export function SitePage({ kind, children, sticky }: { kind: string; children: ReactNode; sticky?: string }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pt-8 pb-28 md:pb-16">{children}</main>
      <SiteFooter />
      <div className="h-16 md:hidden" aria-hidden />
      <StickyCta cta={`sticky-${kind}`} text={sticky} />
    </>
  );
}

/** A grid of linked cards. */
export function LinkGrid({ items }: { items: { href: string; title: string; body?: string; meta?: string }[] }) {
  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <li key={i.href}>
          <Link href={i.href} className="card press block h-full p-4 hover:border-accent/60">
            <span className="font-semibold">{i.title}</span>
            {i.meta && <span className="mt-0.5 block text-xs text-muted">{i.meta}</span>}
            {i.body && <span className="mt-1.5 block text-sm text-muted">{i.body}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
