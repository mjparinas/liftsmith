import type { Metadata } from "next";
import Link from "next/link";

import { DemoPicker } from "@/components/site/DemoPicker";
import { HeroLift } from "@/components/site/HeroLift";
import { perSide } from "@/components/site/heroPlates";
import { DEMO_LIFTS, HERO_PROGRAM } from "@/components/site/heroProgram";
import { Screenshot } from "@/components/site/Screenshot";
import { LangRoot, SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { StoreBadges } from "@/components/site/StoreBadges";
import { visibleQuotes } from "@/content/testimonials";
import { appJsonLd, appOffers } from "@/lib/appSchema";
import { BRAND } from "@/lib/brand";
import { faqJsonLd } from "@/lib/faqs";
import { pageMeta } from "@/lib/pageMeta";
import { APP_PATH, CONTACT_EMAIL, SITE_URL } from "@/lib/site";
import { fill, localPath, usd, type SiteLang } from "@/lib/siteLang";
import { siteText } from "@/locales/site";
import { demoWords, exerciseNames, muscleLabels } from "@/locales/site/fromApp";
import { filledFaqs, siteVars } from "@/locales/site/vars";

// The public home page, in every site language (src/lib/siteLang.ts): / in English, /es/ and friends for the rest.
// The words live in src/locales/site; every name comes from BRAND (src/lib/brand.ts), so a rename is one line.
// Screenshots are real: scripts/site-screenshots.mjs drives the app and writes public/screens/ (English for now).
// Calls to action carry data-cta, which the site beacon counts.
// Kept short on purpose: hero proof, three differentiators, then pricing — the rest lives on /features/.

const name = BRAND.name;

/** The exercise guides the home page links to: the most searched lifts, each with a guide in every site language. */
export const HOME_GUIDES = ["bench-press", "back-squat", "deadlift", "overhead-press", "pull-up", "db-row"] as const;

export function homeMetadata(lang: SiteLang): Metadata {
  const h = siteText(lang).home;
  const vars = siteVars(lang);
  return pageMeta({
    title: fill(h.title, vars),
    absoluteTitle: true,
    shareTitle: fill(h.shareTitle, vars),
    description: fill(h.description, vars),
    path: "/",
    lang,
  });
}

/** Homepage differentiators only (plans, plates, lock-screen rest). Recovery and progress stay in the locale for /features/. */
const FEATURE_SHOTS = [
  { id: "plans", shot: "/screens/today.webp", index: 0 },
  { id: "workout", shot: "/screens/workout.webp", index: 1 },
  { id: "lockscreen", shot: "/screens/rest.webp", index: 2 },
] as const;

/** Soft depth without a coloured halo (craft floor: zero-offset coloured glow is decoration). */
const CTA_SHADOW = "shadow-[0_8px_24px_-12px_rgb(0_0_0/0.55)]";

function Cta({ children, cta, className = "" }: { children: React.ReactNode; cta: string; className?: string }) {
  return (
    <Link
      href={APP_PATH}
      prefetch={false}
      data-cta={cta}
      className={`press inline-flex min-h-14 items-center justify-center rounded-2xl bg-accent px-7 text-lg font-semibold text-accent-ink ${CTA_SHADOW} ${className}`}
    >
      {children}
    </Link>
  );
}

function Ghost({ href, children, cta }: { href: string; children: React.ReactNode; cta?: string }) {
  return (
    <a
      href={href}
      data-cta={cta}
      className="press inline-flex min-h-14 items-center justify-center rounded-2xl border border-line bg-surface px-6 text-lg font-semibold"
    >
      {children}
    </a>
  );
}

function Phone({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative rounded-[2.4rem] border border-line bg-bg p-2 shadow-[0_20px_50px_-24px_rgb(0_0_0/0.75)] ${className}`}>
      <Screenshot src={src} alt={alt} sizes="(min-width: 1024px) 300px, 70vw" className="h-auto w-full rounded-[2rem]" />
    </div>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden className="mt-0.5 shrink-0 text-good">
      <path fill="currentColor" d="M8.2 14.6 3.9 10.3l1.4-1.4 2.9 2.9 6.5-6.5 1.4 1.4z" />
    </svg>
  );
}

function HeroActions({
  cta,
  checks,
  demos,
  vars,
}: {
  cta: string;
  checks: readonly string[];
  demos: string;
  vars: ReturnType<typeof siteVars>;
}) {
  return (
    <>
      <Cta cta="hero">{cta}</Cta>
      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
        {checks.map((c) => (
          <li key={c} className="flex gap-1.5">
            <Check />
            {fill(c, vars)}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted">
        <a href="#demos" data-cta="hero-demos" className="font-semibold text-ink underline underline-offset-4">
          {demos}
        </a>
      </p>
    </>
  );
}

export function HomeView({ lang }: { lang: SiteLang }) {
  const t = siteText(lang);
  const h = t.home;
  const p = h.pricing;
  const hero = t.hero;
  const vars = siteVars(lang);
  const guideNames = exerciseNames(lang, HOME_GUIDES);
  const labels = muscleLabels(lang);
  const features = FEATURE_SHOTS.map((shot) => ({ ...h.features.items[shot.index]!, ...shot }));
  // Real quotes only on the homepage — samples stay out of the social-proof frame (critique P2).
  const quotes = visibleQuotes().filter((q) => !q.sample);
  const url = `${SITE_URL}${localPath(lang, "/")}`;
  const faqs = filledFaqs(t.faqs, vars);
  const jsonLd = [
    appJsonLd({ url, description: fill(h.description, vars), lang, offers: appOffers(`${SITE_URL}${localPath(lang, "/pricing/")}`) }),
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name,
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
      email: CONTACT_EMAIL,
    },
    { "@context": "https://schema.org", "@type": "WebSite", name, url: SITE_URL },
    faqJsonLd(faqs),
  ];

  return (
    <LangRoot lang={lang}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader lang={lang} />
      <main className="overflow-x-clip">
        {/* Hero: brand voice + product proof + one convert path */}
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 h-[640px] bg-[radial-gradient(ellipse_at_70%_30%,rgb(76_141_255/0.1),transparent_60%)]"
          />
          <div className="relative mx-auto grid max-w-6xl gap-x-12 gap-y-8 px-4 pt-10 pb-14 lg:grid-cols-[1fr_1.05fr] lg:grid-rows-[auto_1fr] lg:pt-16">
            <div className="order-1 lg:col-start-1 lg:row-start-1 lg:self-end">
              <h1 className="text-[2.6rem] leading-[1.05] font-bold tracking-tight text-balance sm:text-6xl">
                {h.h1a} <span className="text-accent">{h.h1b}</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted sm:text-xl">{fill(h.lede, vars)}</p>
            </div>
            {/* Phones: CTA before the figure (order-2) so convert stays in the first viewport. */}
            <div className="order-2 lg:order-none lg:col-start-1 lg:row-start-2">
              <HeroActions cta={h.cta} checks={h.checks} demos={h.demosButton} vars={vars} />
            </div>
            <div className="order-3 lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
              <HeroLift
                labels={labels}
                plates={HERO_PROGRAM.map((s) => perSide(s.kg))}
                words={hero}
                names={exerciseNames(
                  lang,
                  HERO_PROGRAM.map((s) => s.id),
                )}
                locale={lang === "en" ? "en-US" : lang}
              />
            </div>
          </div>
        </section>

        {/* Proof line: minutes, one tap, no ads — skip the exercise count vanity metric */}
        <section aria-label={h.glance} className="border-y border-line">
          <dl className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-center gap-x-10 gap-y-3 px-4 py-6 text-center sm:justify-between">
            {h.facts.slice(1).map((f) => (
              <div key={f.label} className="min-w-[7rem]">
                <dt className="sr-only">{f.label}</dt>
                <dd className="num text-2xl font-bold sm:text-3xl">{fill(f.value, vars)}</dd>
                <dd className="mt-0.5 text-sm text-muted">{f.label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* How it works */}
        <section aria-labelledby="how" className="mx-auto max-w-6xl px-4 py-20">
          <h2 id="how" className="text-3xl font-bold tracking-tight sm:text-4xl">
            {h.how.title}
          </h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
            {h.how.steps.map((s, i) => (
              <li key={s.title}>
                <h3 className="text-lg font-semibold tracking-tight">
                  <span className="text-accent">{i + 1}.</span> {s.title}
                </h3>
                <p className="mt-2 text-muted">{s.body}</p>
                {i === 0 && (
                  <a href="/gyms/" className="mt-3 inline-block font-semibold text-accent underline-offset-4 hover:underline">
                    {h.how.findGym} ›
                  </a>
                )}
              </li>
            ))}
          </ol>
          <div className="mt-10">
            <Cta cta="how" className="w-full sm:w-auto">
              {h.how.cta}
            </Cta>
          </div>
        </section>

        {/* Three differentiators with real screenshots */}
        <section id="features" aria-labelledby="features-h" className="scroll-mt-20 border-t border-line">
          <div className="mx-auto max-w-6xl px-4 pt-20">
            <h2 id="features-h" className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              {h.features.title}
            </h2>
          </div>
          {features.map((f, i) => (
            <article
              key={f.id}
              id={f.id}
              aria-labelledby={`${f.id}-h`}
              className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:gap-16"
            >
              <div className={i % 2 ? "md:order-2" : ""}>
                <h3 id={`${f.id}-h`} className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {f.title}
                </h3>
                <p className="mt-4 text-lg text-muted">{fill(f.body, vars)}</p>
                <ul className="mt-5 space-y-2.5">
                  {f.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <Check />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={APP_PATH}
                  prefetch={false}
                  data-cta={`feature-${f.id}`}
                  className="mt-6 inline-flex min-h-11 items-center gap-1 font-semibold text-accent hover:underline"
                >
                  {f.cta} <span aria-hidden>→</span>
                </Link>
              </div>
              <div className="relative mx-auto w-full max-w-[300px]">
                <Phone src={f.shot} alt={f.alt} />
              </div>
            </article>
          ))}
          <div className="mx-auto max-w-6xl px-4 pt-2 pb-16">
            <Link
              href="/features/"
              data-cta="home-all-features"
              className="inline-flex min-h-11 items-center gap-1 font-semibold text-accent underline-offset-4 hover:underline"
            >
              {h.more.all} <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        {/* Mid-page call to action */}
        <section aria-labelledby="mid" className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
          <div className="rounded-3xl border border-line bg-surface p-8 sm:p-12">
            <div className="grid items-center gap-6 md:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 id="mid" className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {h.mid.title}
                </h2>
                <p className="mt-3 text-muted">{h.mid.body}</p>
              </div>
              <div className="flex md:justify-end">
                <Cta cta="mid" className="w-full md:w-auto">
                  {h.mid.cta}
                </Cta>
              </div>
            </div>
          </div>
        </section>

        {/* 3D demo tease — one lift, drag to look around; full controls live in the app */}
        <section id="demos" aria-labelledby="demos-h" className="scroll-mt-20 border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 id="demos-h" className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
              {h.demos.title}
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-muted">{h.demos.body}</p>
            <div className="mt-10">
              <DemoPicker
                teaser
                labels={labels}
                names={lang === "en" ? undefined : exerciseNames(lang, DEMO_LIFTS)}
                words={lang === "en" ? undefined : demoWords(lang)}
                picker={h.demos.picker}
              />
            </div>
            <div className="mt-10">
              <Cta cta="demos">{h.demos.cta}</Cta>
            </div>
          </div>
        </section>

        {/* Juice, one card — not a six-up feature wall */}
        <section aria-labelledby="juice" className="border-t border-line">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-20 md:grid-cols-[1fr_260px]">
            <div>
              <h2 id="juice" className="text-2xl font-bold tracking-tight sm:text-3xl">
                {h.juice.title}
              </h2>
              <p className="mt-3 max-w-xl text-muted">{h.juice.body}</p>
              <Link
                href={APP_PATH}
                prefetch={false}
                data-cta="juice"
                className="mt-5 inline-flex min-h-11 items-center gap-1 font-semibold text-accent underline-offset-4 hover:underline"
              >
                {h.juice.cta} <span aria-hidden>→</span>
              </Link>
            </div>
            <Phone src="/screens/done.webp" alt={h.juice.alt} className="mx-auto w-full max-w-[260px]" />
          </div>
        </section>

        {/* Free guides: compact SEO bridges into exercise and tool pages */}
        <section aria-labelledby="learn" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 id="learn" className="text-3xl font-bold tracking-tight sm:text-4xl">
              {h.learn.title}
            </h2>
            <p className="mt-3 max-w-2xl text-muted">{h.learn.body}</p>
            <div className="mt-8 grid gap-8 md:grid-cols-[2fr_1fr]">
              <nav aria-label={h.learn.exercises}>
                <h3 className="text-lg font-semibold">{h.learn.exercises}</h3>
                <ul className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  {HOME_GUIDES.map((id) => (
                    <li key={id}>
                      <Link
                        href={localPath(lang, `/exercises/${id}/`)}
                        className="inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline"
                      >
                        {guideNames[id] ?? id}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/exercises/"
                  data-cta="home-exercises"
                  className="mt-3 inline-flex min-h-11 items-center gap-1 font-semibold underline-offset-4 hover:underline"
                >
                  {t.chrome.links.exercises} <span aria-hidden>→</span>
                </Link>
              </nav>
              <nav aria-label={h.learn.tools}>
                <h3 className="text-lg font-semibold">{h.learn.tools}</h3>
                <ul className="mt-3 space-y-1">
                  {[
                    { href: localPath(lang, "/tools/workout-generator/"), label: t.chrome.links.generator },
                    { href: localPath(lang, "/tools/plate-calculator/"), label: t.chrome.links.plates },
                    { href: localPath(lang, "/tools/one-rep-max-calculator/"), label: t.chrome.links.oneRm },
                    { href: localPath(lang, "/programs/"), label: t.chrome.links.programs },
                    { href: localPath(lang, "/muscles/"), label: t.chrome.links.muscles },
                  ].map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </section>

        {/* Until real quotes exist: a beta ask, not a fake review wall */}
        <section aria-labelledby="quotes" className="border-t border-line bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 id="quotes" className="text-3xl font-bold tracking-tight sm:text-4xl">
              {h.quotes.title}
            </h2>
            <p className="mt-3 max-w-2xl text-muted">{fill(h.quotes.lookingRest, vars)}</p>
            {quotes.length > 0 ? (
              <ul className="mt-10 grid gap-4 md:grid-cols-3">
                {quotes.map((q, i) => (
                  <li key={i} className="rounded-2xl border border-line bg-surface p-6">
                    <blockquote className="text-lg">&ldquo;{q.quote}&rdquo;</blockquote>
                    <p className="mt-4 text-sm">
                      <b>{q.name}</b> <span className="text-muted">· {q.about}</span>
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-8">
              <Cta cta="beta">{h.quotes.cta}</Cta>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" aria-labelledby="pricing-h" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20">
          <div className="text-center">
            <h2 id="pricing-h" className="text-3xl font-bold tracking-tight sm:text-4xl">
              {p.title}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">{fill(p.body, vars)}</p>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
            <div className="flex flex-col rounded-[20px] border border-line bg-surface p-7">
              <h3 className="text-xl font-semibold">{p.free}</h3>
              <p className="mt-3">
                <span className="num text-4xl font-bold min-[360px]:text-5xl">{usd(lang, 0)}</span>{" "}
                <span className="text-muted">{p.forever}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {t.plans.free.map((x) => (
                  <li key={x} className="flex items-start gap-2.5">
                    <Check />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={APP_PATH}
                prefetch={false}
                data-cta="pricing-free"
                className="press mt-8 inline-flex min-h-14 items-center justify-center rounded-2xl border border-line bg-raised text-lg font-semibold"
              >
                {p.startFree}
              </Link>
            </div>
            <div className="relative flex flex-col rounded-[20px] border-2 border-accent bg-surface p-7">
              <span className="absolute -top-3.5 left-7 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-ink uppercase">
                {fill(p.daysFree, vars)}
              </span>
              <h3 className="text-xl font-semibold">Pro</h3>
              <p className="mt-3">
                <span className="num text-4xl font-bold min-[360px]:text-5xl">{vars.annual}</span>{" "}
                <span className="text-muted">{p.perYear}</span>
              </p>
              <p className="mt-1 text-sm text-muted">{fill(p.priceNote, vars)}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {t.plans.pro.map((x) => (
                  <li key={x} className="flex items-start gap-2.5">
                    <Check />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
              <Cta cta="pricing-pro" className="mt-8 w-full">
                {fill(p.trialCta, vars)}
              </Cta>
              <p className="mt-3 text-center text-xs text-muted">{p.billed}</p>
            </div>
          </div>
          <div className="mx-auto mt-6 flex max-w-4xl flex-col items-start gap-4 rounded-3xl border border-dashed border-line p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted">
              <b className="text-ink">{p.coachLead}</b> {p.coachRest}
            </p>
            <Ghost href={localPath(lang, "/coaches/")} cta="pricing-coach">
              {p.coachCta}
            </Ghost>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-h" className="scroll-mt-20 mx-auto max-w-3xl px-4 py-20">
          <h2 id="faq-h" className="text-3xl font-bold tracking-tight sm:text-4xl">
            {h.faq.title}
          </h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-line bg-surface p-5 open:border-accent/40">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                  {f.q}
                  <span aria-hidden className="text-2xl text-muted transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Last call to action */}
        <section aria-labelledby="final" className="relative overflow-hidden border-t border-line">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgb(76_141_255/0.12),transparent_60%)]"
          />
          <div className="relative mx-auto max-w-3xl px-4 py-24 text-center">
            <h2 id="final" className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              {h.final.title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted">{fill(h.final.body, vars)}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Cta cta="final">{h.final.cta}</Cta>
              <Ghost href="#pricing" cta="final-pricing">
                {h.final.pricing}
              </Ghost>
            </div>
            <StoreBadges className="mt-8 justify-center" place="final" lang={lang} />
          </div>
        </section>
      </main>
      <SiteFooter lang={lang} path="/" />
    </LangRoot>
  );
}
