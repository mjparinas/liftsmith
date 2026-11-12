import type { Metadata } from "next";

import { ToolPage } from "@/components/site/ToolPage";
import { WilksCalculator } from "@/components/site/WilksCalculator";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";

export const metadata: Metadata = pageMeta({
  title: "Wilks calculator, with IPF GL points and DOTS",
  description:
    "Score your squat, bench press and deadlift total for body weight with the Wilks formula, IPF GL points (classic or equipped) and DOTS, in kg or lb.",
  path: "/tools/wilks-calculator/",
});

export default function WilksPage() {
  return (
    <ToolPage
      slug="wilks-calculator"
      name="Wilks calculator"
      intro="Your powerlifting total scored for body weight three ways, Wilks, IPF GL and DOTS, so you can compare lifters of any size and see how far the next level is."
      sticky="Your strength score, kept up to date"
      mid={{
        title: "All three scores, from every set you log",
        body: `${BRAND.name} estimates your best squat, bench and deadlift from your training and keeps Wilks, IPF GL and DOTS current, with the lift that's furthest behind.`,
        button: "Start tracking free",
      }}
      end={{
        title: "Build a bigger total",
        body: `${BRAND.name} plans each workout around reps in reserve, deloads when fatigue builds, and moves each lift forward when you've earned it.`,
      }}
      faq={[
        [
          "What is a Wilks score?",
          "A number that compares powerlifting totals across body weights. Your total is multiplied by a coefficient from a formula published by Robert Wilks, so a light lifter and a heavy lifter can be ranked together. It was the standard for decades and many lifters still quote it.",
        ],
        [
          "What are IPF GL points?",
          "The International Powerlifting Federation's own formula since 2020, sometimes called Goodlift points. It has separate versions for classic (raw) and equipped lifting, and for bench press only. About 100 points is a world-class total.",
        ],
        [
          "Which score should I use?",
          "Use the one your federation uses if you compete. For tracking your own progress, DOTS and IPF GL are the newer formulas, fitted on recent meet results. Compare a score only with the same formula.",
        ],
        [
          "What is a good Wilks score?",
          "Roughly, about 300 is a solid intermediate total, 400 advanced and 450 or more elite for men; women's scores run on the same scale. These are rough guides lifters use, not official levels.",
        ],
      ]}
      more={
        <>
          <h2 className="text-2xl font-bold tracking-tight">How the scores are worked out</h2>
          <p className="text-muted">
            Wilks divides 500 by a fifth-degree polynomial of body weight in kilograms, with separate coefficients for men and women, and
            multiplies your total by the result. IPF GL divides 100 by A − B·e^(−C·body weight), with the IPF&apos;s published A, B and C
            for each sex, gear and event. DOTS uses a fourth-degree polynomial. Pounds are converted to kilograms first. The coefficients
            are checked against an open powerlifting results project.
          </p>
        </>
      }
      reading={[
        { href: "/tools/dots-calculator/", label: "the DOTS calculator" },
        { href: "/tools/strength-standards/", label: "strength standards" },
        { href: "/tools/one-rep-max-calculator/", label: "the one-rep max calculator" },
      ]}
    >
      <WilksCalculator />
    </ToolPage>
  );
}
