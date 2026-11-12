import type { Metadata } from "next";
import Link from "next/link";

import { InfoPage, Section } from "@/components/site/InfoPage";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";

const name = BRAND.name;

export const metadata: Metadata = pageMeta({
  title: "Editorial standards",
  description: `How ${name} writes its guides, blog posts, exercise pages and app comparisons: who writes them, how we check them, how we stay fair and how to report a mistake.`,
  path: "/editorial-standards/",
});

export default function EditorialStandards() {
  return (
    <InfoPage
      kind="editorial-standards"
      title="Editorial standards"
      updated="November 11, 2026"
      intro={`How we write and check the guides, blog posts, exercise pages and app comparisons on this site.`}
    >
      <Section title="Who writes our content">
        <p>
          Articles are written for {name} by its maker, an independent developer (see <Link href="/about/">about us</Link>), with AI tools
          helping to draft and edit. Every page is checked against the rules below before it&apos;s published, and we&apos;re responsible
          for what it says.
        </p>
        <p>
          We&apos;re not doctors, physiotherapists or dietitians, and nothing here is medical advice. If you have an injury, a health
          condition or take medication, talk to a professional before changing how you train or eat.
        </p>
      </Section>
      <Section title="What we aim for">
        <ul>
          <li>
            <strong>Plain words.</strong> We explain training terms the first time we use them and keep to what you can act on today.
          </li>
          <li>
            <strong>Mainstream evidence.</strong> Our advice on sets, reps, rest, progression, protein and recovery follows widely accepted
            sports science. Where the research is mixed or a claim is weak, we say so instead of overstating it.
          </li>
          <li>
            <strong>Ranges, not magic numbers.</strong> People differ. We give sensible ranges and a way to adjust, rather than one answer
            for everyone.
          </li>
          <li>
            <strong>Caution with health claims.</strong> We avoid promises about fat loss, injury or disease, and point to a professional
            where it matters.
          </li>
        </ul>
      </Section>
      <Section title={`What we say about ${name}`}>
        <p>
          Many pages mention how {name} handles something. We only describe features that ship in the app today, checked against the
          app&apos;s own code, and we mark Pro features as Pro. If a feature is still on its way, we say so or leave it out.
        </p>
        <p>
          The starting weights on our exercise pages come from the same formula the app uses for a first session, so the page and the app
          agree.
        </p>
      </Section>
      <Section title="Comparisons with other apps">
        <ul>
          <li>We make {name}, and every comparison page says so. Read them with that in mind.</li>
          <li>
            Each fact about another app comes from that app&apos;s own website, store listing or help pages, with the date we last checked
            it. Our tests flag any fact older than 90 days so it gets checked again.
          </li>
          <li>We say where another app is a better fit, and we don&apos;t use other apps&apos; artwork, screenshots or videos.</li>
          <li>
            Other apps&apos; names are their owners&apos; trademarks. We name them only on comparison, alternatives and import pages, to
            describe them.
          </li>
        </ul>
      </Section>
      <Section title="No ads, no sponsors">
        <p>
          {name} makes money only from its subscription. We don&apos;t run ads, take payment for coverage, or use affiliate links, and no
          supplement or equipment brand pays for anything we write.
        </p>
      </Section>
      <Section title="Updates and corrections">
        <p>
          Every article shows the date it was published, and the date it was last updated when that&apos;s different. When we find a
          mistake, we fix it and update the date.
        </p>
        <p>
          Spotted something wrong or out of date? Tell us on the <Link href="/contact/">contact page</Link> and we&apos;ll look into it.
        </p>
      </Section>
    </InfoPage>
  );
}
