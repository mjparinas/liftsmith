import type { Metadata } from "next";

import { FfmiCalculator } from "@/components/site/FfmiCalculator";
import { ToolPage } from "@/components/site/ToolPage";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";

export const metadata: Metadata = pageMeta({
  title: "FFMI calculator: fat-free mass index",
  description:
    "Work out your fat-free mass index from your weight, height and body fat, normalized to 1.8 m, with bands for men and women and how much lean mass reaches the next one.",
  path: "/tools/ffmi-calculator/",
});

export default function FfmiPage() {
  return (
    <ToolPage
      slug="ffmi-calculator"
      name="FFMI calculator"
      intro="Fat-free mass index: how much muscle you carry for your height, which BMI can't tell you, and how much lean mass reaches the next band."
      sticky="Watch your lean mass grow"
      mid={{
        title: "Your FFMI, from your own weigh-ins",
        body: `${BRAND.name} works out your FFMI from your latest weigh-in and body fat, and tells you how much lean mass reaches the next band.`,
        button: "Start free",
      }}
      end={{
        title: "Build the muscle, then keep it",
        body: `${BRAND.name} plans your training in blocks, adds weight and reps when you've earned them, and deloads before fatigue costs you.`,
      }}
      faq={[
        [
          "What is a good FFMI?",
          "For men, about 18 to 20 is average, 20 to 22 above average, 22 to 23 excellent and 23 to 25 superior. Women's bands run about 4 lower. These are rough guides lifters use.",
        ],
        [
          "What is the natural FFMI limit?",
          "A 1995 study by Kouri and colleagues found that drug-free lifters rarely went above a normalized FFMI of 25, while many who used steroids did. A few people pass it naturally, so it's a guide, not a test.",
        ],
        [
          "What does normalized FFMI mean?",
          "Taller people carry more lean mass for their height, so the normalized figure adds 6.1 × (1.8 − your height in metres). That makes lifters of different heights comparable.",
        ],
        [
          "Why FFMI instead of BMI?",
          "BMI can't tell muscle from fat, so muscular lifters often read as overweight. FFMI only counts lean mass, so it shows muscle.",
        ],
      ]}
      more={
        <>
          <h2 className="text-2xl font-bold tracking-tight">How it&apos;s worked out</h2>
          <p className="text-muted">
            Lean mass is your weight × (1 − body fat ÷ 100). FFMI is lean mass in kilograms divided by height in metres squared, and
            normalized FFMI adds 6.1 × (1.8 − height). Pounds and inches are converted first. It&apos;s only as good as your body fat
            number, so measure that the same way each time.
          </p>
        </>
      }
      reading={[
        { href: "/tools/body-fat-calculator/", label: "the body fat calculator" },
        { href: "/tools/macro-calculator/", label: "the macro calculator" },
        { href: "/tools/strength-standards/", label: "strength standards" },
      ]}
    >
      <FfmiCalculator />
    </ToolPage>
  );
}
