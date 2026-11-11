import type { Metadata } from "next";

import { ToolPage } from "@/components/site/ToolPage";
import { WarmupCalculator } from "@/components/site/WarmupCalculator";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";
import { WARMUP_REST } from "@/lib/warmup";

export const metadata: Metadata = pageMeta({
  title: "Warm-up calculator: warm-up sets for any working weight",
  description:
    "Enter your working weight and get the warm-up sets for the squat, bench press, deadlift, overhead press or row, with the plates for each side.",
  path: "/tools/warm-up-calculator/",
});

export default function WarmupPage() {
  return (
    <ToolPage
      slug="warm-up-calculator"
      name="Warm-up calculator"
      intro="The warm-up sets to do before your working weight: enough to get ready, not so many that they tire you. Pick a lift and enter the weight."
      sticky="Warm-ups planned for every lift"
      mid={{
        title: "Never work out a warm-up again",
        body: `${BRAND.name} adds the warm-up sets to every workout, with the plates drawn, and skips them when the muscle is already warm.`,
        button: "Plan my workout",
      }}
      end={{
        title: "Walk in, warm up, lift",
        body: `${BRAND.name} plans the warm-ups, the working sets and the rest between them, so all you do is lift.`,
      }}
      faq={[
        [
          "How many warm-up sets should I do?",
          "After the empty bar: one lighter set if your working weight is under about 50 kg (110 lb), two ramp sets from 50 kg, and three from 100 kg (220 lb), the last a single at about 85%.",
        ],
        [
          "How many reps in a warm-up set?",
          "Fewer as the weight climbs: around 5 at half your working weight, 2 or 3 at 70 to 80%, and a single near 85%. The point is to practise the movement and get used to the load, not to get tired.",
        ],
        [
          "How long should I rest between warm-up sets?",
          `About ${WARMUP_REST} seconds is enough for the light ones. Rest your normal time before the first working set.`,
        ],
        [
          "Do I need to warm up for every exercise?",
          "No. The first heavy lift for a muscle needs a ramp. A later lift for the same muscles needs at most one feeler set, and light accessory work usually needs none.",
        ],
      ]}
      more={
        <>
          <h2 className="text-2xl font-bold tracking-tight">How the warm-up is worked out</h2>
          <p className="text-muted">
            It starts with the empty bar for 10 easy reps (unless your working weight is barely more than the bar), then climbs in a few
            steps toward your working weight. Each step is a weight your plates can actually make, heavier than the last, and lighter than
            your working weight. The heavier the lift, the more steps, and the fewer reps in each, so the warm-up gets you ready without
            eating into your working sets.
          </p>
          <p className="text-muted">
            This is the same ramp the {BRAND.name} app uses. In the app it also knows which muscles are already warm from earlier in the
            workout, so a second pressing lift gets a single feeler set instead of a full ramp.
          </p>
        </>
      }
      reading={[
        { href: "/blog/how-to-warm-up-for-lifting/", label: "how to warm up for lifting" },
        { href: "/tools/plate-calculator/", label: "the plate calculator" },
        { href: "/blog/dynamic-vs-static-stretching/", label: "dynamic vs static stretching" },
      ]}
    >
      <WarmupCalculator />
    </ToolPage>
  );
}
