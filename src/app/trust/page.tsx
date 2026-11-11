import type { Metadata } from "next";

import { Crumbs, SitePage } from "@/components/site/SiteChrome";
import { TrustCentre } from "@/components/site/TrustCentre";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";

export const metadata: Metadata = pageMeta({
  title: "Trust centre",
  description: `The privacy and security controls that protect your training and health data in ${BRAND.name}, in plain words.`,
  path: "/trust/",
});

export default function TrustPage() {
  return (
    <SitePage kind="trust">
      <Crumbs items={[{ label: "Trust centre" }]} />
      <TrustCentre />
    </SitePage>
  );
}
