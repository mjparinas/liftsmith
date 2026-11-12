import type { Metadata } from "next";
import Link from "next/link";

import { InfoPage, Section } from "@/components/site/InfoPage";
import { CtaBanner, JsonLd } from "@/components/site/SiteChrome";
import { faqJsonLd } from "@/lib/faqs";
import { pageMeta } from "@/lib/pageMeta";
import { APP_PATH } from "@/lib/site";
import { fill, type SiteLang } from "@/lib/siteLang";
import { siteText } from "@/locales/site";
import { filledFaqs, siteVars } from "@/locales/site/vars";

// The page for coaches (trainer mode out of Labs, 2026-11-12; docs/decisions/trainer-mode.md), in every site language:
// /coaches/ in English, /es/coaches/ and friends. What coaching does, what a client shares and never shares, and what it
// costs. Its buttons open the app on Coaching (#/trainer), where a coach makes their invite.

export const COACH_APP = `${APP_PATH}#/trainer`;

export function coachesMetadata(lang: SiteLang): Metadata {
  const c = siteText(lang).coaches;
  const vars = siteVars(lang);
  return pageMeta({ title: fill(c.title, vars), description: fill(c.description, vars), path: "/coaches/", lang });
}

function Ticks({ items, mark, tone }: { items: string[]; mark: string; tone: string }) {
  return (
    <ul className="mt-3 !list-none space-y-2 !pl-0">
      {items.map((x) => (
        <li key={x} className="flex gap-2.5">
          <span aria-hidden className={`font-bold ${tone}`}>
            {mark}
          </span>
          {x}
        </li>
      ))}
    </ul>
  );
}

export function CoachesView({ lang }: { lang: SiteLang }) {
  const t = siteText(lang);
  const c = t.coaches;
  const vars = siteVars(lang);
  const faqs = filledFaqs(c.faqs, vars);
  return (
    <InfoPage kind="coaches" wide title={fill(c.h1, vars)} intro={fill(c.intro, vars)} lang={lang} path="/coaches/">
      <JsonLd data={faqJsonLd(faqs)} />
      <div>
        <Link
          href={COACH_APP}
          prefetch={false}
          data-cta="coaches-top"
          className="press btn-primary inline-flex min-h-14 items-center justify-center rounded-2xl px-7 text-lg font-semibold"
        >
          {c.cta}
        </Link>
      </div>

      <Section title={c.how.title} id="how">
        <ol className="grid gap-4 sm:grid-cols-2">
          {c.how.steps.map((s, i) => (
            <li key={s.title} className="card p-5">
              <p className="display text-2xl text-accent" aria-hidden>
                {i + 1}
              </p>
              <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title={c.see.title} id="privacy">
        <p className="text-muted">{c.see.body}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <section className="card p-5" aria-labelledby="coach-sees">
            <h3 id="coach-sees" className="text-lg font-semibold">
              {c.see.seesLabel}
            </h3>
            <Ticks items={c.see.sees} mark="✓" tone="text-good" />
          </section>
          <section className="card p-5" aria-labelledby="coach-never">
            <h3 id="coach-never" className="text-lg font-semibold">
              {c.see.neverLabel}
            </h3>
            <Ticks items={c.see.never} mark="✕" tone="text-muted" />
          </section>
        </div>
      </Section>

      <Section title={c.cost.title} id="cost">
        <p className="leading-relaxed">{fill(c.cost.body, vars)}</p>
        <p className="mt-3 text-muted">
          {c.cost.contactBefore}
          <Link href="/contact/" className="text-accent underline" hrefLang={lang === "en" ? undefined : "en"}>
            {c.cost.contactLink}
          </Link>
        </p>
      </Section>

      <Section title={c.faqTitle} id="faq">
        <div className="space-y-3">
          {faqs.map((f) => (
            <div key={f.q} className="card p-5">
              <h3 className="text-lg font-semibold">{f.q}</h3>
              <p className="mt-1.5 leading-relaxed text-muted">{f.a}</p>
            </div>
          ))}
        </div>
      </Section>

      <CtaBanner cta="coaches-end" title={c.endTitle} body={c.endBody} lang={lang} />
    </InfoPage>
  );
}
