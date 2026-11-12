import type { Metadata } from "next";

import { pricingMetadata, PricingView } from "@/components/site/PricingView";

// The pricing page in this language (src/lib/siteLang.ts). English is src/app/pricing/page.tsx.

export const metadata: Metadata = pricingMetadata("es");

export default function Pricing() {
  return <PricingView lang="es" />;
}
