import type { Metadata } from "next";

import { RpeChart } from "@/components/site/RpeChart";
import { ToolPage } from "@/components/site/ToolPage";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";

export const metadata: Metadata = pageMeta({
  title: "RPE chart: weight for every rep count and RPE",
  description:
    "An RPE and RIR chart: enter your one-rep max and see the weight for 1 to 12 reps at RPE 6.5 to 10, or the percentage of your max for each.",
  path: "/tools/rpe-chart/",
});

export default function RpePage() {
  return (
    <ToolPage
      slug="rpe-chart"
      name="RPE chart"
      intro="How heavy should a set of 5 at RPE 8 be? Enter your one-rep max and read the weight off the chart, or switch to percentages."
      sticky="Every set's weight, worked out"
      mid={{
        title: "Skip the chart in the gym",
        body: `${BRAND.name} sets each set's weight from your reps in reserve target and adjusts it from how your last set went.`,
        button: "Plan my workout",
      }}
      end={{
        title: "Train by effort, without the math",
        body: `${BRAND.name} plans your sets by reps in reserve, steps the target down through each training block, and moves the weight when you've earned it.`,
      }}
      faq={[
        [
          "What does RPE mean in lifting?",
          "Rate of perceived exertion: how hard a set was on a 1 to 10 scale. In lifting, RPE 10 means you couldn't have done another rep, RPE 9 means one more was left, RPE 8 means two, and so on.",
        ],
        [
          "What's the difference between RPE and RIR?",
          "They measure the same thing from opposite ends. RIR is reps in reserve, the reps you had left. RPE is 10 minus RIR, so RPE 8 is 2 RIR. Many lifters find counting reps left easier than rating effort.",
        ],
        [
          "What RPE should I train at?",
          "Most working sets land between RPE 7 and 9 (1 to 3 reps left). That's hard enough to build strength and muscle, and leaves enough in the tank to recover for the next session. Save RPE 10 for the occasional test.",
        ],
        [
          "Why doesn't the chart match my real sets?",
          "The chart comes from one-rep max formulas, which fit most lifters on most lifts but not everyone. If you're better at high reps than the chart expects, trust your sets over the table.",
        ],
      ]}
      more={
        <>
          <h2 className="text-2xl font-bold tracking-tight">How to use an RPE chart</h2>
          <p className="text-muted">
            Find the row for the reps you&apos;re doing and the column for the effort you want. The cell is the weight. A set of 5 at RPE 8
            is really a 7-rep effort (5 done, 2 left), so it&apos;s the weight you could lift 7 times to failure.
          </p>
          <p className="text-muted">
            The numbers come from the same one-rep max estimate as our one-rep max calculator: an average of Brzycki, Epley and a newer
            weight-dependent equation up to 10 reps to failure, and Mayhew, Wathan and the newer equation above that. Half steps (RPE 8.5)
            mean &ldquo;maybe one more rep&rdquo;.
          </p>
        </>
      }
      reading={[
        { href: "/guides/reps-in-reserve/", label: "reps in reserve" },
        { href: "/tools/one-rep-max-calculator/", label: "the one-rep max calculator" },
        { href: "/blog/should-you-train-to-failure/", label: "should you train to failure?" },
      ]}
    >
      <RpeChart />
    </ToolPage>
  );
}
