import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { HelpTopicChips } from "@/components/site/HelpTopicChips";
import { InfoPage } from "@/components/site/InfoPage";
import { CtaBanner, JsonLd } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import { REPLY_TIME } from "@/lib/contact";
import { faqAnchor, faqJsonLd, HELP, HELP_BY_ID, helpPath } from "@/lib/faqs";
import { pageMeta } from "@/lib/pageMeta";

export const dynamicParams = false;
export const generateStaticParams = () => HELP.map((t) => ({ topic: t.id }));

type Props = { params: Promise<{ topic: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = HELP_BY_ID.get((await params).topic);
  if (!t) return {};
  return pageMeta({ title: `${t.title}: help and questions`, description: t.blurb, path: helpPath(t) });
}

export default async function HelpTopicPage({ params }: Props) {
  const t = HELP_BY_ID.get((await params).topic);
  if (!t) notFound();
  return (
    <InfoPage
      kind="help-topic"
      title={t.title}
      crumbs={[{ href: "/help/", label: "Help" }]}
      intro={
        <>
          Can&apos;t find your answer? <Link href="/contact/">Write to us</Link> and a person replies within {REPLY_TIME}.
        </>
      }
    >
      <JsonLd data={faqJsonLd(t.faqs)} />
      <HelpTopicChips current={t.id} />
      {t.faqs.map((f) => {
        const id = faqAnchor(f.q);
        return (
          <section key={id} id={id} aria-labelledby={`${id}-h`} className="scroll-mt-20">
            <h2 id={`${id}-h`} className="text-2xl font-bold tracking-tight">
              {f.q}
            </h2>
            <p className="mt-3 leading-relaxed text-muted">{f.a}</p>
          </section>
        );
      })}
      <CtaBanner
        cta="help-topic-end"
        title={`Try ${BRAND.name} free`}
        body="Tell it about your gym and your first workout is ready, with every set, rep and weight planned."
      />
    </InfoPage>
  );
}
