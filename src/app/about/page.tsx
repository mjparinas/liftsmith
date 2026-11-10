import type { Metadata } from "next";
import Link from "next/link";

import { InfoPage, Section } from "@/components/site/InfoPage";
import { CtaBanner } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";

const name = BRAND.name;

export const metadata: Metadata = {
  title: "About us",
  description: `Why ${name} exists, who makes it and what we believe: adaptive strength training that plans every set, explains why, and gets out of the way while you lift.`,
  alternates: { canonical: "/about/" },
};

/** What the product stands for, from the decisions that shape it (AGENTS.md product rules). */
const BELIEFS: { title: string; body: string }[] = [
  {
    title: "Focus on the lift, not the app",
    body: "One tap logs a set as planned, the next set is already filled in and the rest timer starts itself. Anything optional waits until between sets.",
  },
  {
    title: "Say why",
    body: "Every exercise, set count, rep target and weight comes with a short reason built from your own training, so you can trust the plan or change it.",
  },
  {
    title: "Tell you what to do, not just what happened",
    body: "We don't add charts for the sake of charts. Coach's notes point out what's worth acting on, like a stalled lift or building fatigue, with a one-tap fix.",
  },
  {
    title: "No ads, and we never sell data",
    body: "The subscription is the only way we make money. Your workouts stay on your phone unless you sign in to sync them, and the free plan stays genuinely useful.",
  },
  {
    title: "Work for every lifter",
    body: "Any equipment, from a full gym to bodyweight only. Larger text, colour-blind safe colours, one-handed controls and a screen reader friendly workout screen.",
  },
  {
    title: "Your data comes with you",
    body: "Export a CSV or a full backup any time, import your history from other apps, and delete your account in a couple of taps.",
  },
];

export default function About() {
  return (
    <InfoPage
      kind="about"
      title={`About ${name}`}
      intro={`${name} is an adaptive strength training app for Android, iPhone and the web. It plans each workout from your equipment, your recovery and your training block, then gets out of the way while you lift.`}
    >
      <Section title="Why we made it">
        <p>
          Most training apps are either a blank logbook, where you do all the planning, or a fixed program that doesn&apos;t notice when you
          slept badly, missed reps or only have 30 minutes. We wanted the middle: a plan that adapts like a good coach would, explains
          itself in plain words, and never slows you down between sets.
        </p>
      </Section>
      <Section title="Who makes it">
        <p>
          {name} is made by Melvin, an independent developer. It isn&apos;t part of a gym chain, a supplement brand or an equipment maker,
          so nothing in it is there to sell you something else.
        </p>
      </Section>
      <section aria-labelledby="beliefs-h">
        <h2 id="beliefs-h" className="text-2xl font-bold tracking-tight">
          What we believe
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {BELIEFS.map((b) => (
            <li key={b.title} className="card flex flex-col gap-2 p-5">
              <h3 className="text-lg font-bold">{b.title}</h3>
              <p className="leading-relaxed text-muted">{b.body}</p>
            </li>
          ))}
        </ul>
      </section>
      <Section title="Tell us what you think">
        <p>
          If something could be better, we&apos;d love to hear it on the <Link href="/contact/">contact page</Link>, and the{" "}
          <Link href="/whats-new/">what&apos;s new page</Link> shows what we&apos;ve changed lately.
        </p>
      </Section>
      <CtaBanner cta="about-end" title="Try your first workout" body="Free to start, no account needed, and it works offline." />
    </InfoPage>
  );
}
