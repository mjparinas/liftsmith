import type { Metadata } from "next";

import { IntervalTimer } from "@/components/site/IntervalTimer";
import { ToolPage } from "@/components/site/ToolPage";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";

export const metadata: Metadata = pageMeta({
  title: "Interval timer: EMOM, Tabata and custom rounds",
  description:
    "A free online interval timer for EMOM, Tabata and your own work and rest rounds, with a count-in, sounds before every change and no sign-up.",
  path: "/tools/interval-timer/",
});

export default function IntervalPage() {
  return (
    <ToolPage
      slug="interval-timer"
      name="Interval timer"
      intro="EMOM, Tabata or your own work and rest rounds, with a five-second count-in and a sound before every change. It keeps time even in a background tab."
      sticky="The timer that starts itself"
      mid={{
        title: "A rest timer that starts itself",
        body: `In ${BRAND.name} the rest timer starts the moment you log a set, counts down on your lock screen and watch, and the interval timer is one tap away.`,
        button: "Start free",
      }}
      end={{
        title: "Finish strong",
        body: `${BRAND.name} plans your lifting and adds conditioning finishers when you have time, with every set and round logged.`,
      }}
      faq={[
        [
          "What is an EMOM?",
          "Every minute on the minute: at the start of each minute you do a set, and you rest for whatever's left of it. Faster sets mean more rest. Ten rounds is ten minutes.",
        ],
        [
          "What is a Tabata workout?",
          "Eight rounds of 20 seconds of hard work and 10 seconds of rest, four minutes in all. It comes from Izumi Tabata's 1996 study of interval training.",
        ],
        [
          "Does the timer keep going if I switch tabs?",
          "Yes. It works out where you are from the start time, so a background tab or a sleeping screen doesn't throw it off. Sounds may wait until you come back, depending on your browser.",
        ],
        ["Does it cost anything?", "No. It's free, needs no account, and nothing you enter is stored or sent."],
      ]}
      reading={[
        { href: "/tools/heart-rate-zone-calculator/", label: "the heart rate zone calculator" },
        { href: "/tools/warm-up-calculator/", label: "the warm-up calculator" },
        { href: "/blog/", label: "the blog" },
      ]}
    >
      <IntervalTimer />
    </ToolPage>
  );
}
