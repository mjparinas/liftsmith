import type { Metadata } from "next";
import Link from "next/link";

import { HelpTopicChips } from "@/components/site/HelpTopicChips";
import { InfoPage } from "@/components/site/InfoPage";
import { CtaBanner } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import { REPLY_TIME } from "@/lib/contact";
import { faqAnchor, HELP, helpPath } from "@/lib/faqs";
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
      <HelpTopicChips />
      {HELP.map((t) => (
        <section key={t.id} id={t.id} aria-labelledby={`${t.id}-h`} className="scroll-mt-20">
          <h2 id={`${t.id}-h`} className="text-2xl font-bold tracking-tight">
            <Link href={helpPath(t)} className="hover:text-accent">
              {t.title}
            </Link>
          </h2>
          <p className="mt-2 text-muted">{t.blurb}</p>
          <ul className="mt-4 space-y-2">
            {t.faqs.map((f) => (
              <li key={f.q}>
                <Link
                  href={`${helpPath(t)}#${faqAnchor(f.q)}`}
                  className="press card flex min-h-11 items-center justify-between gap-4 p-4 font-semibold"
                >
                  {f.q}
                  <span aria-hidden className="text-muted">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
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
