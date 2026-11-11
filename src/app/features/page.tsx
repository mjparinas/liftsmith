import type { Metadata } from "next";

import { LandingIndex } from "@/components/site/LandingIndex";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";

export const metadata: Metadata = pageMeta({
  title: `${BRAND.name} features`,
  description: `Rest timer, recovery map, sets per muscle, warm-ups, plate math, watch apps, heart rate, injury mode and more: what each ${BRAND.name} feature does.`,
  path: "/features/",
});

export default function FeaturesIndex() {
  return (
    <LandingIndex
      group="features"
      h1={`${BRAND.name} features`}
      intro="Each feature gets out of your way while you lift. Here is what each one does, and which parts are free."
    />
  );
}
