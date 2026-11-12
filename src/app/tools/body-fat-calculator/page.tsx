import type { Metadata } from "next";

import { BodyFatCalculator } from "@/components/site/BodyFatCalculator";
import { ToolPage } from "@/components/site/ToolPage";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";

export const metadata: Metadata = pageMeta({
  title: "Body fat calculator: the tape measure method",
  description:
    "Estimate your body fat percentage from your waist, neck, hips and height with the US Navy method, in centimetres or inches, with the usual categories.",
  path: "/tools/body-fat-calculator/",
});

export default function BodyFatPage() {
  return (
    <ToolPage
      slug="body-fat-calculator"
      name="Body fat calculator"
      intro="Your body fat percentage from a tape measure and your height, with the US Navy method: no scale, calipers or scan needed."
      sticky="Track body fat with your lifts"
      mid={{
        title: "Your measurements, turned into a trend",
        body: `Log your waist and neck in ${BRAND.name} and one tap saves today's body fat, which keeps your calories, FFMI and coach's notes accurate.`,
        button: "Start free",
      }}
      end={{
        title: "Lose fat, keep the muscle",
        body: `${BRAND.name} plans your training around recovery and progress, and its coach notices when your waist or body fat moves the wrong way.`,
      }}
      faq={[
        [
          "How accurate is the tape measure method?",
          "For most people it lands within 3 to 4 percentage points of a DEXA scan. It tends to read very muscular lifters a little high, because a thick neck and a muscular waist look like fat to the formula. Used the same way each time, it's good for tracking change.",
        ],
        [
          "Where do I measure?",
          "Waist at the belly button, relaxed, after breathing out. Neck just below the Adam's apple, with the tape sloping down slightly at the front. Women also measure the hips at the widest point. Take each one three times and use the middle number.",
        ],
        [
          "What's a healthy body fat percentage?",
          "The American Council on Exercise puts average at about 18 to 24% for men and 25 to 31% for women, fit at 14 to 17% and 21 to 24%, and athletes lower still. Essential fat is about 2 to 5% for men and 10 to 13% for women.",
        ],
        [
          "How often should I measure?",
          "Once a week or two, at the same time of day and before you eat. Day-to-day changes are mostly water.",
        ],
      ]}
      more={
        <>
          <h2 className="text-2xl font-bold tracking-tight">The formula</h2>
          <p className="text-muted">
            The method was published by Hodgdon and Beckett for the US Navy in 1984. For men, body fat is 495 ÷ (1.0324 − 0.19077 ×
            log(waist − neck) + 0.15456 × log(height)) − 450, in centimetres. For women it uses waist + hips − neck, with its own constants.
            Inches are converted to centimetres first.
          </p>
        </>
      }
      reading={[
        { href: "/tools/ffmi-calculator/", label: "the FFMI calculator" },
        { href: "/tools/tdee-calculator/", label: "the TDEE calculator" },
        { href: "/tools/macro-calculator/", label: "the macro calculator" },
      ]}
    >
      <BodyFatCalculator />
    </ToolPage>
  );
}
