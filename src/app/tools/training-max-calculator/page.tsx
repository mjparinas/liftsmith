import type { Metadata } from "next";

import { ToolPage } from "@/components/site/ToolPage";
import { TrainingMaxCalculator } from "@/components/site/TrainingMaxCalculator";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";

export const metadata: Metadata = pageMeta({
  title: "Training max calculator: four-week waves",
  description:
    "Work out your training max and every main set for four-week waves on the squat, bench, deadlift and press: fives, threes, five-three-one and a light week.",
  path: "/tools/training-max-calculator/",
});

export default function TrainingMaxPage() {
  return (
    <ToolPage
      slug="training-max-calculator"
      name="Training max calculator"
      intro="Your training max and every main set for four-week waves on the squat, bench press, deadlift and overhead press, rounded to plates you can load."
      sticky="Waves that move themselves"
      mid={{
        title: "The whole program, run for you",
        body: `${BRAND.name}'s free Training max waves program works out these sets each week, logs your last-set reps and raises your training max when you've earned it.`,
        button: "Start free",
      }}
      end={{
        title: "Slow, steady, strong",
        body: `${BRAND.name} runs fixed programs like this one for free, with plates drawn for every set and a rest timer that starts itself.`,
      }}
      faq={[
        [
          "What is a training max?",
          "A number a bit under your real one-rep max, usually 90% of it, that all the week's percentages come from. Starting lighter than your best leaves room to progress for months.",
        ],
        [
          "How do the four weeks work?",
          "Week 1 is three sets of five at 65, 75 and 85% of the training max. Week 2 is threes at 70, 80 and 90%. Week 3 is five, three and one at 75, 85 and 95%. The last set of each of those weeks is for as many clean reps as you can. Week 4 is light, at 40 to 60%.",
        ],
        [
          "When do I raise the training max?",
          "After each four weeks: about 2.5 kg (5 lb) on the bench and press and 5 kg (10 lb) on the squat and deadlift. If you miss the reps on the last sets, drop it to 90% of where it was.",
        ],
        [
          "Where does this come from?",
          "The waves follow a popular program by Jim Wendler; its name belongs to its owner. This calculator and our program are our own take on the idea.",
        ],
      ]}
      reading={[
        { href: "/tools/one-rep-max-calculator/", label: "the one-rep max calculator" },
        { href: "/tools/plate-calculator/", label: "the plate calculator" },
        { href: "/tools/warm-up-calculator/", label: "the warm-up calculator" },
      ]}
    >
      <TrainingMaxCalculator />
    </ToolPage>
  );
}
