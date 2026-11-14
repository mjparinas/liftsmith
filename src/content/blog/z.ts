import type { Article } from "../articles";

// Blog, part twenty-six: small touches in the workout (Melvin, 2026-11-14, docs/decisions/workout-screen.md). Only
// what ships, and no other app named (seo.test.ts). Later touches add a section here.
export const BLOG_Z: Article[] = [
  {
    slug: "small-touches-in-the-workout",
    kind: "blog",
    title: "Small touches that keep you in the workout",
    description: "A gentle buzz 10 seconds before rest ends, and a gold flash with a card to share when you beat your best.",
    date: "2026-11-14",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Liftsmith tries to stay out of your way between sets. The rest timer starts itself, counts down on the lock screen and tells you when rest is over. Now it also gives you a heads-up before that happens.",
      },
      { h2: "A buzz 10 seconds before rest ends" },
      {
        p: "Ten seconds before the end of every rest, your phone gives a gentle double buzz. It's softer than the rest-over alert, so you can tell the two apart without looking. Use those seconds to chalk up, set your grip or walk back to the bench.",
      },
      {
        ul: [
          "On Android it comes from the workout notification, so you feel it with the phone locked or in your pocket.",
          "On iPhone it buzzes while the app is open. Liftsmith keeps the screen on during a workout, so that's most of the time.",
          "Your Wear OS watch, Apple Watch or Garmin watch taps your wrist too, phone locked or not.",
          "After +30 s, the heads-up moves with the new end of rest.",
        ],
      },
      { cta: "plan" },
      { h2: "Turning it off" },
      {
        p: "It's on for everyone whose rest-over alert vibrates. To turn it off, open Settings › Workout and switch off Buzz 10 seconds before rest ends. Turning off vibration or the rest-over alert turns it off as well.",
      },
      { h2: "A gold flash for a new personal best" },
      {
        p: "When a set beats your best on a lift, the phone gives a celebratory buzz, a gold banner drops in and the edges of the screen glow gold for a moment. On the rest screen that follows, Share this PR opens a card with the lift, the weight and reps, your estimated max and how much it went up. Post it straight from your rest, or wait for the end of the workout, where the same card waits with the rest.",
      },
      {
        tip: "Rest a little longer on your heaviest sets. The heads-up makes it easy to take the full rest without staring at the clock.",
      },
    ],
    faq: [["Does it make a sound?", "No. The heads-up is only a buzz. The sound, if you have it on, is saved for the end of rest."]],
  },
];
