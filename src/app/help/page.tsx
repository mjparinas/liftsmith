import type { Metadata } from "next";
import Link from "next/link";

import { InfoPage } from "@/components/site/InfoPage";
import { CtaBanner, JsonLd } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import { REPLY_TIME } from "@/lib/contact";
import { ALL_FAQS, faqJsonLd, HELP } from "@/lib/faqs";
import { pageMeta } from "@/lib/pageMeta";

const name = BRAND.name;

export const metadata: Metadata = pageMeta({
  title: "Help and questions",
  description: `Answers about getting started with ${name}: how workouts are planned, your data, accounts and sync, Pro and billing, and fixing common problems.`,
  path: "/help/",
});

export default function Help() {
  return (
    <InfoPage
      kind="help"
      title="Help and questions"
      intro={
        <>
          Can&apos;t find your answer? <Link href="/contact/">Write to us</Link> and a person replies within {REPLY_TIME}.
        </>
      }
    >
      <JsonLd data={faqJsonLd(ALL_FAQS)} />
      <nav aria-label="Help topics" className="-mt-4 flex flex-wrap gap-2">
        {HELP.map((g) => (
          <a
            key={g.id}
            href={`#${g.id}`}
            className="press inline-flex min-h-11 items-center rounded-full border border-line bg-raised px-4 text-sm font-semibold"
          >
            {g.title}
          </a>
        ))}
      </nav>
      {HELP.map((g) => (
        <section key={g.id} id={g.id} aria-labelledby={`${g.id}-h`} className="scroll-mt-20">
          <h2 id={`${g.id}-h`} className="text-2xl font-bold tracking-tight">
            {g.title}
          </h2>
          <div className="mt-4 space-y-3">
            {g.faqs.map((f) => (
              <details key={f.q} className="group card p-5 open:border-accent/40">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                  {f.q}
                  <span aria-hidden className="text-2xl text-muted transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
      <CtaBanner
        cta="help-end"
        title={`Try ${name} free`}
        body="Tell it about your gym and your first workout is ready, with every set, rep and weight planned."
      />
    </InfoPage>
  );
}
