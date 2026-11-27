import type { Article } from "../articles";

// Blog: Start timer on the watch for planks, wall sits and hangs (Melvin, 2026-11-27: "Enable timers for holding
// exercises (like planks) on the watch"; docs/decisions/set-timer.md "Started from the watch"). Only what ships, and no
// other app named (seo.test.ts).
export const BLOG_WATCH_TIMER: Article[] = [
  {
    slug: "plank-timer-on-your-watch",
    kind: "blog",
    title: "Time your planks from your watch",
    description:
      "Start timer on Wear OS, Apple Watch or Garmin counts a plank, wall sit or hang on your wrist, with taps so you never look, and logs the seconds you held.",
    date: "2026-11-27",
    tag: "Tracking",
    cta: "watch",
    body: [
      {
        p: "Holds are the one set where a phone gets in the way. You're face down in a [plank](/exercises/plank/), back flat on the wall in a [wall sit](/exercises/wall-sit/) or hanging from the bar in a [dead hang](/exercises/dead-hang/), and the timer is on a phone you can't reach. Now it's on your wrist: tap **Start timer** on the watch and it counts the hold for you.",
      },
      { h2: "How it works" },
      {
        p: 'On any timed set, the watch shows **Start timer** above Log set with the time your plan picked, like "Start timer · 0:40". On Garmin, press **START**. You get 5 seconds to get into position, then the countdown starts. A one-sided hold like a [side plank](/exercises/side-plank/) counts the first side, gives you 5 seconds to switch and counts the second.',
      },
      {
        p: "Your phone starts the same timer from the moment you tapped, so the workout screen, the lock screen and the watch all show the same clock. If the phone is asleep in your bag, it catches up when it wakes and still counts from your tap.",
      },
      { h2: "Taps, so you never look" },
      {
        p: "The watch taps your wrist as the hold goes: a light tick at 3, 2 and 1 seconds left, a nudge halfway through a hold of 20 seconds or more, and a tap when each part ends. You can keep your eyes on the floor and your arms where they belong.",
      },
      { cta: "watch" },
      { h2: "Logged as held" },
      {
        p: "When the countdown runs out the set logs itself and your rest starts, so a plank is one tap. Shaking at 28 seconds of 40? Tap **Log set** and the 28 seconds you held are saved, not the 40 you planned, whether you tap it on the watch, on the phone or on the lock screen. Your next target then comes from what you really did.",
      },
      { h2: "With your phone away" },
      {
        p: "It works in [workouts on your watch without your phone](/blog/workouts-on-your-watch-without-your-phone/) too: the plan your watch carries knows which sets are holds and how long, the watch runs the timer itself, and the seconds you held come home with the rest of the workout.",
      },
      {
        p: "It's free on Wear OS, Apple Watch and Garmin, like the rest of the watch apps. Read [what a smartwatch is good for in the gym](/blog/lifting-with-a-smartwatch/) for everything else the watch does.",
      },
    ],
    faq: [
      [
        "Which exercises get a timer on the watch?",
        "Every exercise you do for time: planks, side planks, wall sits, hangs, carries and other holds. Cardio counts up instead of down.",
      ],
      [
        "Can I stop a hold early?",
        "Yes. Tap Log set and the seconds you held are saved. Stop during the 5 seconds to get set and the set is logged as planned.",
      ],
      ["Do I need Pro for the watch timer?", "No. It's free on Wear OS, Apple Watch and Garmin."],
    ],
  },
];
