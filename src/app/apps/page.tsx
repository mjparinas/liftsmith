import type { Metadata } from "next";

import { LandingIndex } from "@/components/site/LandingIndex";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";

export const metadata: Metadata = pageMeta({
  title: `What ${BRAND.name} is built for`,
  description: `${BRAND.name} as a workout tracker, a strength or 5x5 app, for powerlifting, bodybuilding, home gyms, calisthenics and beginners. One page for each.`,
  path: "/apps/",
});

export default function AppsIndex() {
  return (
    <LandingIndex
      group="apps"
      h1={`What ${BRAND.name} is built for`}
      intro="One app that plans each workout from your equipment, your recovery and your block. Here is how it fits the way you train."
    />
  );
}
