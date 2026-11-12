import type { Metadata } from "next";

import { FeaturesView } from "@/components/site/FeaturesView";
import { SitePage } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";

export const metadata: Metadata = pageMeta({
  title: `${BRAND.name} features and what it works with`,
  description: `Every ${BRAND.name} feature, which are free, the newest ones, and a table of the watches, health apps, scales and services it works with on Android, iPhone and the web.`,
  path: "/features/",
});

export default function FeaturesIndex() {
  return (
    <SitePage kind="features-index">
      <FeaturesView />
    </SitePage>
  );
}
