import type { Article } from "../articles";

// Blog: automatic supersets and the other adaptive workout options (Melvin, 2026-11-17;
// docs/decisions/adaptive-options.md). Only what ships, and no other app named (seo.test.ts).
export const BLOG_AUTO_SUPERSETS: Article[] = [
  {
    slug: "automatic-supersets",
    kind: "blog",
    title: "Automatic supersets: more training in the same hour",
    description:
      "Turn on supersets and your adaptive plan pairs exercises that don't share muscles, with a shorter rest after each round, so more fits in your time.",
    date: "2026-11-17",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "A superset is two exercises done back to back: one set of the first, a quick switch, one set of the second, then rest. Pick two that don't work the same muscles and each one rests while you do the other. The work stays the same and the time spent sitting on a bench shrinks.",
      },
      { cta: "plan" },
      { h2: "One switch" },
      {
        p: "You could always link two exercises on Today yourself. Now the adaptive plan can do it for you. Turn on Pair exercises into supersets in Settings › Training › Adaptive workouts, and every adaptive workout is built with pairs:",
      },
      {
        ul: [
          "Opposite muscles first, like a press with a row or a curl with a triceps extension.",
          "Then upper body with lower body, like a pulldown with a leg press.",
          "Then core with anything, so a plank can fill the gap after leg work.",
          "Two exercises that both use a barbell pair less often, so you aren't changing plates between every set.",
        ],
      },
      {
        p: "Two exercises that share a muscle, even as a helper, never pair. The bench press and the overhead press both lean on the triceps, so they stay apart.",
      },
      { h2: "A rest timer that knows" },
      {
        p: "In a pair, each muscle already rested through the other exercise's set and the switch. So the rest after each round is shorter: your usual rest, less that time, in 15 second steps and never under a minute. The rest timer starts itself as always, and each paired exercise says why its rest is shorter, right under the target. If you set your own rest for an exercise, it keeps it.",
      },
      {
        p: "The time saved goes back into the workout. The plan fits an extra exercise or a few more sets into the length you picked, and still finishes on time.",
      },
      { h2: "Heavy lifts stay on their own" },
      {
        p: "Heavy barbell squats and deadlifts are better done fresh, with full rest. They stay on their own unless you turn off Keep heavy squats and deadlifts on their own, and on a strength goal every heavy barbell lift does. Don't like a pair? Tap the link between the two exercises on Today to split it, and that exercise gets its usual rest back.",
      },
      { h2: "Two more options" },
      {
        p: "The same section has Warm-up sets, on by default, for when you'd rather warm up your own way (it applies to programs and routines too), and Exercise variety, which moved here from the bottom of Training. Everything is a switch or a chip, so it's quick to change between workouts. It works the same on Android, iPhone and the web app.",
      },
      {
        tip: "Supersets work best when both stations are free. In a busy gym, a dumbbell or cable exercise next to your bench is easier to hold than a second barbell.",
      },
    ],
  },
];
