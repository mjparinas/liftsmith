import type { Metadata } from "next";

import { DotsCalculator } from "@/components/site/DotsCalculator";
import { ToolPage } from "@/components/site/ToolPage";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";

export const metadata: Metadata = pageMeta({
  title: "DOTS calculator: score your powerlifting total",
  description:
    "Work out your DOTS score from your squat, bench press and deadlift and your body weight, in kg or lb, to compare lifters of any size.",
  path: "/tools/dots-calculator/",
});

export default function DotsPage() {
  return (
    <ToolPage
      slug="dots-calculator"
      name="DOTS calculator"
      intro="Your squat, bench and deadlift total scored for body weight, so a light lifter and a heavy one can see who's stronger for their size."
      sticky="Your DOTS score, kept up to date"
      mid={{
        title: "Your DOTS score, from every set",
        body: `${BRAND.name} estimates your best squat, bench and deadlift from the sets you log and keeps your DOTS score current, no max-out day needed.`,
        button: "Start tracking free",
      }}
      end={{
        title: "Build a bigger total",
        body: `${BRAND.name} plans your training in blocks with reps in reserve targets and deloads, and moves each lift forward when you've earned it.`,
      }}
      faq={[
        [
          "What is a DOTS score?",
          "A way to compare powerlifting totals across body weights. Your total is multiplied by a coefficient that depends on your body weight, so a 60 kg lifter and a 110 kg lifter can be ranked on the same scale. Many powerlifting federations use it.",
        ],
        [
          "What is a good DOTS score?",
          "Roughly: 200 is a novice total, 300 intermediate, 400 advanced, and 500 or more elite. These levels are what lifters commonly use, not an official scale.",
        ],
        [
          "DOTS or Wilks?",
          "DOTS was published in 2019 as a fairer replacement for the older Wilks formula, using a larger set of recent meet results. Scores aren't interchangeable, so compare DOTS with DOTS.",
        ],
        [
          "Can I use estimated maxes instead of a meet total?",
          "For tracking your own progress, yes. Official rankings use lifts made in competition, under the federation's rules.",
        ],
      ]}
      more={
        <>
          <h2 className="text-2xl font-bold tracking-tight">How DOTS is worked out</h2>
          <p className="text-muted">
            DOTS divides 500 by a fourth-degree polynomial of your body weight in kilograms, with separate coefficients for men and women,
            and multiplies your total by the result. Body weight is limited to 40 to 210 kg for men and 40 to 150 kg for women. The
            coefficients are the published ones, checked against an open powerlifting results project. Pounds are converted to kilograms
            first.
          </p>
        </>
      }
      reading={[
        { href: "/tools/one-rep-max-calculator/", label: "the one-rep max calculator" },
        { href: "/blog/how-to-increase-your-squat/", label: "how to increase your squat" },
        { href: "/blog/how-to-increase-your-deadlift/", label: "how to increase your deadlift" },
      ]}
    >
      <DotsCalculator />
    </ToolPage>
  );
}
