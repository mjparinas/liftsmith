import type { Article } from "../articles";

// Blog: rehab protocols in phases, moved by pain (2026-11-17, from the gap list: "Physio rehab protocols with pain
// tracking"; docs/decisions/trainer-mode.md "Rehab protocols"). Only what ships, and no other app named (seo.test.ts).
export const BLOG_REHAB_PHASES: Article[] = [
  {
    slug: "rehab-in-phases-moved-by-pain",
    kind: "blog",
    title: "Rehab in phases, moved by pain",
    description:
      "Every rehab program in Liftsmith now has three phases and a plain pain rule that says when a client is ready to move up or should go back one.",
    date: "2026-11-17",
    tag: "Coaching",
    cta: "coach",
    body: [
      {
        p: "Rehab rarely stays on one program. A knee that needed wall sits in week one needs split squats by week four and lunges and hops before it's back to sport. Most physios move patients through those stages by how the area responds, and pain is the signal they lean on most. Liftsmith now builds that into every rehab program: three phases, and a rule anyone can read that says when it's time to move.",
      },
      { cta: "coach" },
      { h2: "Three phases for each area" },
      {
        p: "Each of the six rehab programs (knee, lower back, shoulder, ankle, hip, and neck and upper back) now has three phases. Calm and move uses gentle holds and easy range to settle the area. Build strength moves to full movements, one side at a time, with more sets. Back to full use adds harder work like lunges and hops to get ready for normal training and sport. Every phase uses only body weight, a wall or the floor, so it works at home.",
      },
      {
        p: "When you assign a program from Coaching, you pick the phase to start in. Someone who's already a few weeks into recovery can start in Build strength.",
      },
      { h2: "The pain rule" },
      {
        p: "Clients already rate pain after each rehab exercise. The rule reads those ratings, plus one new one: how the area feels the day after a rehab workout, which Today asks for in one slider. A flare the next day is often what tells a physio the most.",
      },
      {
        ul: [
          "Ready to move up: six sessions in the phase, pain 2 or less after each of the last three, and no flare the next day.",
          "Go back a phase: pain 5 or more after two of the last three, or a flare the next day (5 or more, or two points worse than going in).",
          "Otherwise, stay in the phase, with the numbers behind it shown.",
        ],
      },
      {
        p: 'Every answer comes with its reason in a short line, like "Pain 2 or less after each of the last 3 sessions, and no flare the next day." Nothing is hidden behind a score.',
      },
      { h2: "The physio decides" },
      {
        p: "On the client's report, each program shows its phase and what the rule says. When it says ready or back, it goes to the top of What to do, and one tap sends the next phase. It replaces the old one on the client's phone, so their history and reminders carry on. The rule needs the client to share pain with you, which is their choice, as before.",
      },
      {
        p: "If you'd rather let a client move on their own, turn on Let them move phases on their own when you assign. Their Today then offers the next phase, or the one before, when the rule says so, and you still see which phase they're in from the workouts they do.",
      },
      { h2: "For clients" },
      {
        p: "Clients follow it free. Today shows the phase you're in beside the rehab, asks how the area feels the day after, and says when the rule thinks you're ready, with your physio's say kept in charge.",
      },
      {
        tip: "Liftsmith shows what clients log and what a simple rule makes of it. It doesn't diagnose or treat anything, and the physio's own assessment decides what's right.",
      },
    ],
  },
];
