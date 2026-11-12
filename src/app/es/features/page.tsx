import type { Metadata } from "next";

import { featuresMetadata, FeaturesPage } from "@/components/site/FeaturesView";

// The features page in this language (src/lib/siteLang.ts). English is src/app/features/page.tsx.

export const metadata: Metadata = featuresMetadata("es");

export default function Features() {
  return <FeaturesPage lang="es" />;
}
