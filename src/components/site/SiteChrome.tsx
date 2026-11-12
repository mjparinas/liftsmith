// Shared frame for the public SEO pages (exercises, muscles, equipment, guides, blog, tools): header, footer,
// breadcrumbs and the calls to action. Calls to action are the point of these pages (Melvin, 2026-11-09:
// "emphasis on the call to actions"), so every page gets a header button, at least one inline prompt, a big
// banner with the store badges at the end, and a sticky bar on phones. Each placement has its own data-cta
// name, and the site beacon records it with the page path, so the admin panel shows which ones work.
import Link from "next/link";
import type { ReactNode } from "react";

import { BuildStamp } from "@/components/BuildStamp";
import { BRAND } from "@/lib/brand";
import { APP_PATH, SITE_URL } from "@/lib/site";
import { fill, localPath, SITE_LANG_NAME, SITE_LANGS, type SiteLang } from "@/lib/siteLang";
import { siteText } from "@/locales/site";

import { DocLang } from "./DocLang";
import { SiteMenu } from "./SiteMenu";
import { StoreBadges } from "./StoreBadges";

const APP_ONLY = /^\/(app|me)\//;

export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/** The app icon (public/icon.svg, drawn by scripts/make-icons.mjs), so the site header matches the favicon. */
export function BrandMark() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/icon.svg" alt="" aria-hidden width={32} height={32} className="size-8 rounded-lg" />;
}

function Logo({ lang }: { lang: SiteLang }) {
  return (
    <Link href={localPath(lang, "/")} className="flex items-center gap-2 text-xl font-bold tracking-tight">
      <BrandMark />
      {BRAND.name}
    </Link>
  );
}

export type NavLink = { href: string; label: string };

/**
 * The one header nav for every public page, the home page included (Melvin, 2026-11-11: the links used to change when you
 * left the home page). The home page's own sections are /#… links, so they work from any page. Wide screens show them
 * all; below lg they sit in the menu, beside Sign in and Start free.
 */
export function navFor(lang: SiteLang): NavLink[] {
  const n = siteText(lang).chrome.nav;
  // The home page and pricing are translated; the library, guides, blog and tools are English for now.
  return [
    { href: `${localPath(lang, "/")}#features`, label: n.features },
    { href: "/exercises/", label: n.exercises },
    { href: "/guides/", label: n.guides },
    { href: "/blog/", label: n.blog },
    { href: "/tools/", label: n.tools },
    { href: localPath(lang, "/pricing/"), label: n.pricing },
    { href: `${localPath(lang, "/")}#faq`, label: n.faq },
  ];
}

export const NAV: readonly NavLink[] = navFor("en");

export function SiteHeader({ lang = "en" }: { lang?: SiteLang }) {
  const t = siteText(lang).chrome;
  const nav = navFor(lang);
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/85 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <Logo lang={lang} />
        <nav aria-label={t.siteNav} className="flex items-center gap-0.5 text-sm font-semibold sm:gap-2">
          <ul className="hidden items-center gap-1 lg:flex">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="rounded-lg px-3 py-2 hover:bg-surface">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          {/* Below 400 px there's no room beside the logo, so Sign in moves into the menu (one or the other shows). */}
          <SignInLink label={t.signIn} className="hidden min-[400px]:inline-flex" />
          <Link
            href={APP_PATH}
            prefetch={false}
            data-cta="header"
            className="press btn-primary inline-flex min-h-11 items-center whitespace-nowrap rounded-xl px-3 sm:ml-1 sm:px-4"
          >
            {t.startFree}
          </Link>
          <SiteMenu links={nav} label={t.menu} navLabel={t.siteMenu} narrowOnly={{ href: `${APP_PATH}#/account`, label: t.signIn }} />
        </nav>
      </div>
    </header>
  );
}

/**
 * A quieter way in beside "Start free", for lifters who already have an account (Melvin, 2026-11-11). It opens the app on
 * sign-in (#/account: the welcome screen's sign-in sheet on a new browser), and signing in there lands on Today.
 */
export function SignInLink({ label = "Sign in", className = "inline-flex" }: { label?: string; className?: string }) {
  return (
    <Link
      href={`${APP_PATH}#/account`}
      prefetch={false}
      data-cta="header-signin"
      className={`${className} min-h-11 items-center whitespace-nowrap rounded-lg px-2 text-muted hover:bg-surface hover:text-ink sm:px-3`}
    >
      {label}
    </Link>
  );
}

/**
 * `lang` is the page's language; `path` (the English path) is set on a page that exists in every language, and adds the
 * language switcher.
 */
export function SiteFooter({ lang = "en", path }: { lang?: SiteLang; path?: string }) {
  const t = siteText(lang).chrome;
  const l = t.links;
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
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr]">
        <div>
          <p className="text-lg font-bold">{BRAND.name}</p>
          <p className="mt-2 max-w-sm text-sm text-muted">
            {t.tagline} {t.footerBlurb}
          </p>
          <StoreBadges className="mt-4" webLink={false} place="footer" lang={lang} />
        </div>
        {col(t.cols.product, [
          { href: APP_PATH, label: l.openApp },
          { href: "/features/", label: l.features },
          { href: "/apps/", label: l.whoFor },
          { href: localPath(lang, "/pricing/"), label: l.pricing },
          { href: "/whats-new/", label: l.whatsNew },
          { href: "/me/", label: l.dashboard },
        ])}
        {col(t.cols.learn, [
          { href: "/exercises/", label: l.exercises },
          { href: "/muscles/", label: l.muscles },
          { href: "/equipment/", label: l.equipment },
          { href: "/guides/", label: l.guides },
          { href: "/blog/", label: l.blog },
        ])}
        {col(t.cols.tools, [
          { href: "/tools/plate-calculator/", label: l.plates },
          { href: "/tools/one-rep-max-calculator/", label: l.oneRm },
          { href: "/tools/warm-up-calculator/", label: l.warmUp },
          { href: "/tools/rpe-chart/", label: l.rpe },
          { href: "/tools/strength-standards/", label: l.standards },
          { href: "/tools/dots-calculator/", label: l.dots },
          { href: "/tools/tdee-calculator/", label: l.tdee },
        ])}
        {col(t.cols.support, [
          { href: "/help/", label: l.help },
          { href: "/contact/", label: l.contact },
          { href: "/status/", label: l.status },
          { href: "/delete-account/", label: l.deleteAccount },
        ])}
        {col(t.cols.company, [
          { href: "/about/", label: l.about },
          { href: "/compare/", label: l.compare },
          { href: "/import/strong/", label: l.fromStrong },
          { href: "/import/hevy/", label: l.fromHevy },
          { href: "/privacy/", label: l.privacy },
          { href: "/terms/", label: l.terms },
          { href: "/trust/", label: l.trust },
          { href: "/accessibility/", label: l.accessibility },
        ])}
      </div>
      {path && <LanguageSwitcher lang={lang} path={path} label={t.language} />}
      <div className="mx-auto max-w-6xl space-y-1 px-4 pb-8 text-xs text-faint">
        <p>
          © {new Date().getFullYear()} {BRAND.name} · <BuildStamp />
        </p>
        {/* The store badge guidelines ask for this credit wherever the badges appear. */}
        <p>{t.trademarks}</p>
      </div>
    </footer>
  );
}

/** Links to the same page in every language, each named in its own language. */
function LanguageSwitcher({ lang, path, label }: { lang: SiteLang; path: string; label: string }) {
  return (
    <nav aria-label={label} className="mx-auto max-w-6xl px-4 pb-6">
      <ul className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
        <li aria-hidden className="mr-1 text-muted">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.5 2.7 3.6 5.7 3.6 9s-1.1 6.3-3.6 9c-2.5-2.7-3.6-5.7-3.6-9S9.5 5.7 12 3z" />
          </svg>
        </li>
        {SITE_LANGS.map((l) => (
          <li key={l}>
            <Link
              href={localPath(l, path)}
              hrefLang={l}
              lang={l}
              aria-current={l === lang ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-lg px-2.5 hover:bg-surface ${l === lang ? "font-semibold text-ink" : "text-muted hover:text-ink"}`}
            >
              {SITE_LANG_NAME[l]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export interface Crumb {
  href?: string;
  label: string;
}

/** Breadcrumbs plus their BreadcrumbList data. The last crumb is the current page. */
export function Crumbs({ items, lang = "en" }: { items: Crumb[]; lang?: SiteLang }) {
  const all: Crumb[] = [{ href: localPath(lang, "/"), label: BRAND.name }, ...items];
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
      <nav className="text-sm text-muted" aria-label={siteText(lang).chrome.breadcrumb}>
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
export function CtaButton({ cta, children = siteText().chrome.startFree, big }: { cta: string; children?: ReactNode; big?: boolean }) {
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
  button,
  lang = "en",
}: {
  cta: string;
  title: string;
  body: string;
  button?: string;
  lang?: SiteLang;
}) {
  const t = siteText(lang).chrome.banner;
  return (
    <section className="card-tint mt-12 p-6 md:p-10" style={{ ["--tint" as string]: "var(--color-violet)" }} aria-label={t.label}>
      <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-lg text-muted">{body}</p>
      <ul className="mt-4 grid gap-1.5 text-sm text-muted sm:grid-cols-2">
        {t.points.map((p) => (
          <li key={p}>✓ {p}</li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <CtaButton cta={cta} big>
          {button ?? t.button}
        </CtaButton>
        <StoreBadges webLink={false} place={`${cta}-badges`} lang={lang} />
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
export function StickyCta({ cta, text, lang = "en" }: { cta: string; text?: string; lang?: SiteLang }) {
  const t = siteText(lang).chrome;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-bg/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-lg md:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <p className="text-sm font-semibold">{text ?? fill(t.sticky, { name: BRAND.name })}</p>
        <Link
          href={APP_PATH}
          prefetch={false}
          data-cta={cta}
          className="press btn-primary inline-flex min-h-11 shrink-0 items-center rounded-xl px-4 font-semibold"
        >
          {t.startFree}
        </Link>
      </div>
    </div>
  );
}

/**
 * Wraps a page that isn't in English in an element carrying its language, because the root layout's <html lang> is
 * fixed at build time for the whole site. It also sets <html lang> once the page runs, so screen readers and the
 * browser's translate offer read it right, and puts it back on the way out (DocLang).
 */
export function LangRoot({ lang, children }: { lang: SiteLang; children: ReactNode }) {
  if (lang === "en") return <>{children}</>;
  return (
    <div lang={lang}>
      <DocLang lang={lang} />
      {children}
    </div>
  );
}

/**
 * Header, content, footer and the sticky bar. `kind` names the page type for the sticky bar's data-cta. `lang` and
 * `path` (the English path) are for pages that exist in every language.
 */
export function SitePage({
  kind,
  children,
  sticky,
  lang = "en",
  path,
}: {
  kind: string;
  children: ReactNode;
  sticky?: string;
  lang?: SiteLang;
  path?: string;
}) {
  return (
    <LangRoot lang={lang}>
      <SiteHeader lang={lang} />
      <main className="mx-auto max-w-5xl px-4 pt-8 pb-28 md:pb-16">{children}</main>
      <SiteFooter lang={lang} path={path} />
      <div className="h-16 md:hidden" aria-hidden />
      <StickyCta cta={`sticky-${kind}`} text={sticky} lang={lang} />
    </LangRoot>
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
