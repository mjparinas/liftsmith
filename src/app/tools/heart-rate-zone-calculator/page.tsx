import type { Metadata } from "next";

import { HeartRateZoneCalculator } from "@/components/site/HeartRateZoneCalculator";
import { ToolPage } from "@/components/site/ToolPage";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";

export const metadata: Metadata = pageMeta({
  title: "Heart rate zone calculator: your five zones",
  description:
    "Work out your maximum heart rate from your age and your five training zones, as a share of max or of heart rate reserve with your resting heart rate.",
  path: "/tools/heart-rate-zone-calculator/",
});

export default function HrZonesPage() {
  return (
    <ToolPage
      slug="heart-rate-zone-calculator"
      name="Heart rate zone calculator"
      intro="Your maximum heart rate and five training zones, from your age or your own maximum, with heart rate reserve if you know your resting heart rate."
      sticky="Heart rate on every set"
      mid={{
        title: "Live heart rate while you lift",
        body: `${BRAND.name} reads a chest strap or your watch during workouts, shows your heart rate on every set and can end rest early once you've recovered.`,
        button: "Start free",
      }}
      end={{
        title: "Rest as long as you need, not longer",
        body: `${BRAND.name} times your rest, reads your recovery from your heart rate and sleep, and adjusts the day's workout to match.`,
      }}
      faq={[
        [
          "How is maximum heart rate worked out?",
          "From age with the Tanaka formula, 208 − 0.7 × age, which is more accurate for adults than the older 220 − age. Formulas can be 10 bpm out either way, so if a hard effort has taken you higher, use that number instead.",
        ],
        [
          "What is heart rate reserve?",
          "The gap between your resting and maximum heart rate. Zones worked out from it (the Karvonen method) follow your fitness: as your resting heart rate drops, your zones shift.",
        ],
        [
          "What are the five zones for?",
          "Zone 1 is recovery and warm-ups, zone 2 easy cardio you could talk through, zone 3 steady harder work, zone 4 hard intervals, and zone 5 all-out efforts of a minute or two.",
        ],
        [
          "How does heart rate help with lifting?",
          "Between heavy sets, your heart rate dropping back to about the top of zone 2 is a good sign you're ready for the next one. It also shows how hard a circuit or conditioning finisher really was.",
        ],
      ]}
      more={
        <>
          <h2 className="text-2xl font-bold tracking-tight">The zones</h2>
          <p className="text-muted">
            Zones run from 50 to 60, 60 to 70, 70 to 80, 80 to 90 and 90 to 100% of maximum heart rate. With heart rate reserve, each
            percentage is of the gap between resting and maximum, added to your resting heart rate.
          </p>
        </>
      }
      reading={[
        { href: "/tools/interval-timer/", label: "the interval timer" },
        { href: "/tools/tdee-calculator/", label: "the TDEE calculator" },
        { href: "/blog/", label: "the blog" },
      ]}
    >
      <HeartRateZoneCalculator />
    </ToolPage>
  );
}
