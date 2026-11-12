import type { Metadata } from "next";

import { featuresMetadata, FeaturesPage } from "@/components/site/FeaturesView";

// The features page in English; the other languages are src/app/<lang>/features/page.tsx (src/lib/siteLang.ts).

export const metadata: Metadata = featuresMetadata("en");

export default function FeaturesIndex() {
  return <FeaturesPage />;
}
