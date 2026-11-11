import type { Metadata } from "next";
import Link from "next/link";

import { InfoPage, Section } from "@/components/site/InfoPage";
import { BRAND } from "@/lib/brand";
import { REPLY_TIME } from "@/lib/contact";
import { pageMeta } from "@/lib/pageMeta";
import { CONTACT_EMAIL } from "@/lib/site";

const name = BRAND.name;

export const metadata: Metadata = pageMeta({
  title: "Accessibility",
  description: `What ${name} does to be usable by every lifter, how we test it against WCAG 2.2 AA, and what we know still needs work.`,
  path: "/accessibility/",
});

// Keep in step with the Accessibility rules in AGENTS.md and what scripts/e2e-a11y.mjs checks.
export const A11Y_UPDATED = "10 November 2026";

export default function Accessibility() {
  return (
    <InfoPage
      kind="accessibility"
      title="Accessibility"
      updated={A11Y_UPDATED}
      intro={`We want ${name} to work for every lifter, whatever their eyesight, hands or the way they use their phone. Our goal is WCAG 2.2 level AA across the apps, the web app and this website.`}
    >
      <Section title="Settings in the app">
        <p>Settings › Accessibility has:</p>
        <ul>
          <li>
            <strong>Text size:</strong> match your phone (including Android&apos;s font size and iPhone&apos;s Dynamic Type), or pick from
            default up to 150%. Layouts wrap rather than scroll sideways at every size.
          </li>
          <li>
            <strong>Colour-blind safe colours:</strong> recovery and status colours chosen to stay apart with protanopia, deuteranopia and
            tritanopia.
          </li>
          <li>
            <strong>More contrast:</strong> follows your phone&apos;s setting, or can be switched on, with stronger text and borders and no
            glows.
          </li>
          <li>
            <strong>One-handed controls:</strong> for the left or right hand, putting Log set and the weight and rep buttons under your
            thumb during a workout.
          </li>
          <li>
            <strong>Less motion:</strong> Lean mode, and your phone&apos;s reduce motion setting, turn off animations, bursts and confetti.
          </li>
          <li>Light and dark appearance, and switches to turn off sounds and vibration.</li>
        </ul>
      </Section>
      <Section title="Built in everywhere">
        <ul>
          <li>Colour is never the only cue: the recovery map adds patterns and labels, and picked options show a tick.</li>
          <li>Every control has a tap target of at least 44 pixels, and number buttons repeat while held so there&apos;s less typing.</li>
          <li>
            Screen readers: the rest timer announces when rest starts, at ten seconds left and when it&apos;s over, rather than every
            second. Sheets are labelled dialogs that take focus and return it when they close.
          </li>
          <li>Everything works with a keyboard, with a visible focus ring, and every sheet closes with Escape or its Close button.</li>
          <li>Windows High Contrast and other forced colour modes keep buttons, cards and the recovery map readable.</li>
        </ul>
      </Section>
      <Section title="How we test">
        <ul>
          <li>
            Every change runs automated checks (axe, against WCAG 2.2 AA) on every screen of the app in dark and light, with colour-blind
            safe colours and more contrast, under forced colours, and on pages of this website.
          </li>
          <li>A keyboard-only run logs a whole workout at the largest text size on a narrow phone screen, without a pointer.</li>
          <li>Every colour is checked for contrast, and the status colours are simulated for three kinds of colour blindness.</li>
          <li>Layouts are tested on 13 phones and tablets, including the narrowest Android phones and iPhone SE.</li>
        </ul>
      </Section>
      <Section title="What we know isn't perfect yet">
        <ul>
          <li>
            The 3D exercise demos and the 3D recovery map are visual. The setup steps, cues and muscle names next to them say the same in
            text.
          </li>
          <li>Camera rep counting needs you to be seen by the camera; logging by tapping always works instead.</li>
          <li>Automated checks can&apos;t catch everything, and we haven&apos;t yet had the app tested by disabled lifters.</li>
        </ul>
      </Section>
      <Section title="Tell us about a problem">
        <p>
          If something in {name} is hard to use, please tell us on the <Link href="/contact/">contact page</Link> or at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. A person replies within {REPLY_TIME}, and we treat accessibility problems
          as bugs.
        </p>
      </Section>
    </InfoPage>
  );
}
