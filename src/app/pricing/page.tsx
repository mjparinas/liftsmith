import type { Metadata } from "next";

import { pricingMetadata, PricingView } from "@/components/site/PricingView";

// The English pricing page. The other languages are at /es/pricing/ and friends; the page itself is PricingView.

export const metadata: Metadata = pricingMetadata("en");

export default function Pricing() {
  return <PricingView lang="en" />;
}
