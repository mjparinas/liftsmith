import type { Metadata } from "next";

import { InfoPage } from "@/components/site/InfoPage";
import { CtaBanner } from "@/components/site/SiteChrome";
import { NewsDayCard } from "@/components/site/WhatsNew";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";
import { WHATS_NEW } from "@/lib/whatsNew";

const name = BRAND.name;

export const metadata: Metadata = pageMeta({
  title: "What's new",
  description: `A day-by-day note on what's new and what we fixed in ${name}, in plain words.`,
  path: "/whats-new/",
});

export default function WhatsNew() {
  return (
    <InfoPage kind="whats-new" title="What's new" intro={`What changed in ${name} each day, including fixes. Newest first.`}>
      <div className="flex flex-col gap-5">
        {WHATS_NEW.map((d) => (
          <NewsDayCard key={d.day} entry={d} />
        ))}
      </div>
      <CtaBanner
        cta="whats-new-end"
        title={`See it in ${name}`}
        body="Every change here is already in the app. It's free to start and works offline."
      />
    </InfoPage>
  );
}
