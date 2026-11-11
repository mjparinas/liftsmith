import type { Metadata } from "next";

import { StrengthStandards } from "@/components/site/StrengthStandards";
import { ToolPage } from "@/components/site/ToolPage";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";

export const metadata: Metadata = pageMeta({
  title: "Strength standards: how strong am I?",
  description:
    "See how your bench, squat, deadlift, press or row compares with trained lifters of your body weight, age and sex, from any set you've done.",
  path: "/tools/strength-standards/",
});

export default function StrengthStandardsPage() {
  return (
    <ToolPage
      slug="strength-standards"
      name="Strength standards"
      intro="How strong am I? Enter a recent set of a big lift and see where it stands against trained lifters like you: same body weight, adjusted for age and sex."
      sticky="Track your strength score"
      mid={{
        title: "Watch your standing climb",
        body: `${BRAND.name} scores every lift you log against the same standards, so you can see which lifts are ahead and which need work.`,
        button: "Start tracking free",
      }}
      end={{
        title: "Close the gaps in your strength",
        body: `${BRAND.name} sees which lifts lag behind and plans more work for those muscles, with the right weight for every set.`,
      }}
      faq={[
        [
          "What is a good bench press for my weight?",
          "A trained lifter who's been at it a year or two usually benches a little over their body weight for one rep if they're a man, and around two thirds of it if they're a woman. Pick Bench press above to see the numbers for your own weight and age.",
        ],
        [
          "Why does body weight matter?",
          "Heavier lifters can lift more in absolute terms, so comparing a 60 kg lifter's squat with a 100 kg lifter's isn't fair. The standards scale with your body weight.",
        ],
        [
          "Why adjust for age and sex?",
          "Strength peaks between about 23 and 40 and drops slowly after that, and women typically lift about three quarters of what men of the same weight lift on lower-body lifts and about two thirds on upper-body lifts. Adjusting compares you with lifters like you.",
        ],
        [
          "Is this a ranking of real lifters?",
          "No. It's an estimate from typical standards: a model of where trained lifters fall, not a database of real people's lifts. Use it to see which lifts are ahead and which lag, not as an exact rank.",
        ],
      ]}
      more={
        <>
          <h2 className="text-2xl font-bold tracking-tight">How the standards work</h2>
          <p className="text-muted">
            Your set becomes an estimated one-rep max, the same way as in our one-rep max calculator. That&apos;s compared with what a
            typical intermediate lifter of your body weight lifts on the same exercise, adjusted for age (a little under 23, about 1.2% a
            year after 40, more after 60) and sex. Trained lifters spread out around that standard, so the result is the share of them
            you&apos;re likely stronger than.
          </p>
          <p className="text-muted">
            The table shows the one-rep max at each step of that spread for you. The 50th percentile is the typical intermediate; the 90th
            is a strong lifter after several years of steady training.
          </p>
        </>
      }
      reading={[
        { href: "/tools/one-rep-max-calculator/", label: "the one-rep max calculator" },
        { href: "/blog/how-much-weight-should-i-lift/", label: "finding your starting weights" },
        { href: "/blog/strength-training-over-40/", label: "strength training over 40" },
      ]}
    >
      <StrengthStandards />
    </ToolPage>
  );
}
