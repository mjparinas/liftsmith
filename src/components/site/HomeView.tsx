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
import { BRAND } from "@/lib/brand";
import { faqJsonLd } from "@/lib/faqs";
import { pageMeta } from "@/lib/pageMeta";
import { APP_PATH, CONTACT_EMAIL, SITE_URL } from "@/lib/site";
import { fill, localPath, usd, type SiteLang } from "@/lib/siteLang";
import { PRICES } from "@/lib/trial";
import { siteText } from "@/locales/site";
import { demoWords, exerciseNames, muscleLabels } from "@/locales/site/fromApp";
import { filledFaqs, siteVars } from "@/locales/site/vars";

// The public home page, in every site language (src/lib/siteLang.ts): / in English, /es/ and friends for the rest.
// The words live in src/locales/site; every name comes from BRAND (src/lib/brand.ts), so a rename is one line.
// Screenshots are real: scripts/site-screenshots.mjs drives the app and writes public/screens/ (English for now).
// Calls to action carry data-cta, which the site beacon counts.

const name = BRAND.name;

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

/** Each feature's id and screenshot, in the order of the text's feature list. */
const FEATURE_SHOTS = [
  { id: "plans", shot: "/screens/today.webp" },
  { id: "workout", shot: "/screens/workout.webp" },
  { id: "lockscreen", shot: "/screens/rest.webp" },
  { id: "recovery", shot: "/screens/recovery.webp" },
  { id: "progress", shot: "/screens/progress.webp" },
];

function Cta({ children, cta, className = "" }: { children: React.ReactNode; cta: string; className?: string }) {
  return (
    <Link
      href={APP_PATH}
      prefetch={false}
      data-cta={cta}
      className={`press inline-flex min-h-14 items-center justify-center rounded-2xl bg-accent px-7 text-lg font-semibold text-accent-ink shadow-[0_10px_40px_-10px_rgb(76_141_255/0.7)] ${className}`}
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
    <div
      className={`relative rounded-[2.4rem] border border-[#2a3442] bg-[#0b0f15] p-2 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8),0_0_0_1px_rgb(255_255_255/0.03)] ${className}`}
    >
      <Screenshot src={src} alt={alt} sizes="(min-width: 1024px) 300px, 70vw" className="h-auto w-full rounded-[2rem]" />
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-xs font-semibold tracking-[0.18em] text-accent uppercase">{children}</p>;
}

function Check() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden className="mt-0.5 shrink-0 text-good">
      <path fill="currentColor" d="M8.2 14.6 3.9 10.3l1.4-1.4 2.9 2.9 6.5-6.5 1.4 1.4z" />
    </svg>
  );
}

export function HomeView({ lang }: { lang: SiteLang }) {
  const t = siteText(lang);
  const h = t.home;
  const p = h.pricing;
  const hero = t.hero;
  const vars = siteVars(lang);
  const labels = muscleLabels(lang);
  const features = h.features.items.map((f, i) => ({ ...f, ...FEATURE_SHOTS[i]! }));
  const faqs = filledFaqs(t.faqs, vars);
  const quotes = visibleQuotes();
  const url = `${SITE_URL}${localPath(lang, "/")}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "MobileApplication",
      name,
      operatingSystem: "Android, iOS, Web",
      applicationCategory: "HealthApplication",
      description: fill(h.description, vars),
      url,
      inLanguage: lang,
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
        { "@type": "Offer", price: PRICES.monthly.price.replace("$", ""), priceCurrency: "USD", name: "Pro monthly" },
        { "@type": "Offer", price: PRICES.annual.price.replace("$", ""), priceCurrency: "USD", name: "Pro yearly" },
      ],
    },
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
        {/* Hero */}
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 h-[640px] bg-[radial-gradient(ellipse_at_70%_30%,rgb(76_141_255/0.18),transparent_60%)]"
          />
          {/* Phones: headline, then the lifter, then the buttons. Wide screens: text left, lifter right. */}
          <div className="relative mx-auto grid max-w-6xl gap-x-12 gap-y-8 px-4 pt-10 pb-14 lg:grid-cols-[1fr_1.05fr] lg:grid-rows-[auto_1fr] lg:pt-16">
            <div className="lg:self-end">
              <Eyebrow>{h.eyebrow}</Eyebrow>
              <h1 className="mt-4 text-[2.6rem] leading-[1.05] font-bold tracking-tight text-balance sm:text-6xl">
                {h.h1a} <span className="bg-gradient-to-r from-accent to-holo bg-clip-text text-transparent">{h.h1b}</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted sm:text-xl">{fill(h.lede, vars)}</p>
            </div>
            <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
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
            <div>
              <div className="flex flex-wrap gap-3">
                <Cta cta="hero">{h.cta}</Cta>
                <Ghost href="#demos" cta="hero-demos">
                  {h.demosButton}
                </Ghost>
              </div>
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                {h.checks.map((c) => (
                  <li key={c} className="flex gap-1.5">
                    <Check />
                    {fill(c, vars)}
                  </li>
                ))}
              </ul>
              <StoreBadges className="mt-7" place="hero" lang={lang} />
            </div>
          </div>
        </section>

        {/* Facts strip: things that are true of the app, not user counts we don't have yet */}
        <section aria-label={h.glance} className="border-y border-line bg-surface/50">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 text-center sm:grid-cols-4">
            {h.facts.map((f) => (
              <div key={f.label}>
                <dt className="sr-only">{f.label}</dt>
                <dd className="num text-3xl font-bold sm:text-4xl">{fill(f.value, vars)}</dd>
                <dd className="mt-1 text-sm text-muted">{f.label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* How it works */}
        <section aria-labelledby="how" className="mx-auto max-w-6xl px-4 py-20">
          <Eyebrow>{h.how.eyebrow}</Eyebrow>
          <h2 id="how" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {h.how.title}
          </h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {h.how.steps.map((s, i) => (
              <li key={s.title} className="card relative overflow-hidden p-6">
                <span aria-hidden className="num absolute -top-4 right-3 text-8xl font-black text-white/[0.04]">
                  {i + 1}
                </span>
                <span className="grid size-10 place-items-center rounded-full bg-accent/15 font-bold text-accent" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-muted">{s.body}</p>
                {i === 0 && (
                  <a href="/gyms/" className="mt-3 inline-block font-semibold text-accent hover:underline">
                    {h.how.findGym} ›
                  </a>
                )}
              </li>
            ))}
          </ol>
          <div className="mt-8 flex justify-center">
            <Cta cta="how">{h.how.cta}</Cta>
          </div>
        </section>

        {/* Features, each with a real screenshot */}
        <section id="features" aria-labelledby="features-h" className="scroll-mt-20 border-t border-line">
          <div className="mx-auto max-w-6xl px-4 pt-20">
            <Eyebrow>{h.features.eyebrow}</Eyebrow>
            <h2 id="features-h" className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
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
                <Eyebrow>{f.eyebrow}</Eyebrow>
                <h3 id={`${f.id}-h`} className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                  {f.title}
                </h3>
                <p className="mt-4 text-lg text-muted">{fill(f.body, vars)}</p>
                <ul className="mt-5 space-y-2.5">
                  {f.points.map((p) => (
                    <li key={p} className="flex gap-2.5">
                      <Check />
                      {p}
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
                <div aria-hidden className="absolute inset-0 -z-10 scale-110 rounded-full bg-accent/10 blur-3xl" />
                <Phone src={f.shot} alt={f.alt} />
              </div>
            </article>
          ))}
        </section>

        {/* Mid-page call to action */}
        <section aria-labelledby="mid" className="mx-auto max-w-6xl px-4 py-10">
          <div className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-[#10213f] to-surface p-8 sm:p-12">
            <div className="grid items-center gap-6 md:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 id="mid" className="text-2xl font-bold sm:text-3xl">
                  {h.mid.title}
                </h2>
                <p className="mt-2 text-muted">{h.mid.body}</p>
              </div>
              <div className="flex md:justify-end">
                <Cta cta="mid">{h.mid.cta}</Cta>
              </div>
            </div>
          </div>
        </section>

        {/* 3D demos */}
        <section id="demos" aria-labelledby="demos-h" className="scroll-mt-20 border-t border-line bg-[#05080c]">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <Eyebrow>{h.demos.eyebrow}</Eyebrow>
            <h2 id="demos-h" className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
              {h.demos.title}
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-muted">{h.demos.body}</p>
            <div className="mt-10">
              <DemoPicker
                labels={labels}
                names={lang === "en" ? undefined : exerciseNames(lang, DEMO_LIFTS)}
                words={lang === "en" ? undefined : demoWords(lang)}
                picker={h.demos.picker}
              />
            </div>
            <div className="mt-10 flex justify-center">
              <Cta cta="demos">{h.demos.cta}</Cta>
            </div>
          </div>
        </section>

        {/* More features */}
        <section aria-labelledby="more" className="mx-auto max-w-6xl px-4 py-20">
          <Eyebrow>{h.more.eyebrow}</Eyebrow>
          <h2 id="more" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {h.more.title}
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {h.more.items.map((m) => (
              <div key={m.title} className="card p-6">
                <h3 className="text-lg font-semibold">{m.title}</h3>
                <p className="mt-2 text-muted">{fill(m.body, vars)}</p>
              </div>
            ))}
          </div>
          <Link
            href="/features/"
            data-cta="home-all-features"
            className="mt-6 inline-flex min-h-11 items-center gap-1 font-semibold text-accent hover:underline"
          >
            {h.more.all} <span aria-hidden>→</span>
          </Link>
          <div className="mt-10 grid items-center gap-8 rounded-3xl border border-line bg-surface p-6 sm:p-10 md:grid-cols-[1fr_260px]">
            <div>
              <Eyebrow>{h.juice.eyebrow}</Eyebrow>
              <h3 className="mt-3 text-2xl font-bold sm:text-3xl">{h.juice.title}</h3>
              <p className="mt-3 text-muted">{h.juice.body}</p>
              <Link
                href={APP_PATH}
                prefetch={false}
                data-cta="juice"
                className="mt-5 inline-flex min-h-11 items-center gap-1 font-semibold text-accent hover:underline"
              >
                {h.juice.cta} <span aria-hidden>→</span>
              </Link>
            </div>
            <Phone src="/screens/done.webp" alt={h.juice.alt} className="mx-auto w-full max-w-[260px]" />
          </div>
        </section>

        {/* Testimonials */}
        <section aria-labelledby="quotes" className="border-t border-line bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <Eyebrow>{h.quotes.eyebrow}</Eyebrow>
            <h2 id="quotes" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {h.quotes.title}
            </h2>
            {quotes.length > 0 ? (
              <ul className="mt-10 grid gap-4 md:grid-cols-3">
                {quotes.map((q, i) => (
                  <li key={i} className="card flex flex-col gap-4 p-6">
                    {q.sample && (
                      <span className="self-start rounded-full bg-warn/15 px-3 py-1 text-xs font-bold text-warn">{h.quotes.sample}</span>
                    )}
                    <p aria-hidden className="text-gold">
                      ★★★★★
                    </p>
                    <blockquote className="text-lg">&ldquo;{q.quote}&rdquo;</blockquote>
                    <p className="mt-auto text-sm">
                      <b>{q.name}</b> <span className="text-muted">· {q.about}</span>
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-8 flex flex-col items-start gap-4 rounded-3xl border border-dashed border-line p-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted">
                <b className="text-ink">{h.quotes.looking}</b> {fill(h.quotes.lookingRest, vars)}
              </p>
              <Cta cta="beta" className="shrink-0">
                {h.quotes.cta}
              </Cta>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" aria-labelledby="pricing-h" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20">
          <div className="text-center">
            <Eyebrow>{p.eyebrow}</Eyebrow>
            <h2 id="pricing-h" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {p.title}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">{fill(p.body, vars)}</p>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
            <div className="card flex flex-col p-7">
              <h3 className="text-xl font-semibold">{p.free}</h3>
              <p className="mt-3">
                <span className="num text-4xl font-bold min-[360px]:text-5xl">{usd(lang, 0)}</span>{" "}
                <span className="text-muted">{p.forever}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {t.plans.free.map((x) => (
                  <li key={x} className="flex gap-2.5">
                    <Check />
                    {x}
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
            <div className="relative flex flex-col rounded-[20px] border-2 border-accent bg-gradient-to-b from-[#112244] to-surface p-7 shadow-[0_20px_60px_-20px_rgb(76_141_255/0.5)]">
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
                  <li key={x} className="flex gap-2.5">
                    <Check />
                    {x}
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
          <Eyebrow>{h.faq.eyebrow}</Eyebrow>
          <h2 id="faq-h" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {h.faq.title}
          </h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group card p-5 open:border-accent/40">
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
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgb(76_141_255/0.22),transparent_60%)]"
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
