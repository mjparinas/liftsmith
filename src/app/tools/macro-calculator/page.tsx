import type { Metadata } from "next";

import { MacroCalculator } from "@/components/site/MacroCalculator";
import { ToolPage } from "@/components/site/ToolPage";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";

export const metadata: Metadata = pageMeta({
  title: "Macro calculator for lifters: protein, fat and carbs",
  description:
    "Work out calories and macros to lose fat, maintain or build muscle from your age, sex, height, weight and activity, with protein set for lifters.",
  path: "/tools/macro-calculator/",
});

export default function MacroPage() {
  return (
    <ToolPage
      slug="macro-calculator"
      name="Macro calculator"
      intro="Calories for your goal from your TDEE, split into protein, fat and carbs for someone who lifts, with the reason behind each number."
      sticky="Macros that follow your weigh-ins"
      mid={{
        title: "Macros that keep up with you",
        body: `In ${BRAND.name} your calories and macros follow your weigh-ins and training days, and the coach tells you when protein runs short.`,
        button: "Start free",
      }}
      end={{
        title: "Train for the goal you eat for",
        body: `${BRAND.name} plans each workout from your recovery and your training block, so a cut keeps its strength and a bulk turns into muscle.`,
      }}
      faq={[
        [
          "How much protein do I need to build muscle?",
          "Most research on lifters lands between 1.6 and 2.2 g per kg of body weight a day (about 0.7 to 1 g per pound). This calculator uses 1.8 g to maintain or build and 2.2 g on a cut, where more protein helps keep muscle.",
        ],
        [
          "How are fat and carbs set?",
          "Fat gets a quarter of your calories but never under 0.6 g per kg, which keeps hormones healthy. Carbs fill the rest, because they fuel hard sets. If you prefer more fat and fewer carbs, swap them gram for calories: 1 g of fat is 9 calories, 1 g of carbs is 4.",
        ],
        [
          "How many calories to lose fat or build muscle?",
          "About 500 under your TDEE loses roughly 0.5 kg (1 lb) a week, never going under your BMR. About 250 over builds muscle with little fat. Weigh yourself a few times a week and adjust if the trend doesn't match.",
        ],
        [
          "Do I need to hit my macros exactly?",
          "No. Hit your protein and land near your calories most days; the split between fat and carbs matters much less.",
        ],
      ]}
      more={
        <>
          <h2 className="text-2xl font-bold tracking-tight">How it&apos;s worked out</h2>
          <p className="text-muted">
            TDEE comes from the Mifflin-St Jeor equation times an activity factor, the same as the TDEE calculator. Your goal sets the
            calories: 500 under (never below BMR), equal, or 250 over. Protein is set first per kilogram of body weight, then fat, and carbs
            take what&apos;s left.
          </p>
        </>
      }
      reading={[
        { href: "/tools/tdee-calculator/", label: "the TDEE calculator" },
        { href: "/tools/body-fat-calculator/", label: "the body fat calculator" },
        { href: "/tools/ffmi-calculator/", label: "the FFMI calculator" },
      ]}
    >
      <MacroCalculator />
    </ToolPage>
  );
}
