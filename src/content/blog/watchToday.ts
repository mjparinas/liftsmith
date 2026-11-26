import type { Article } from "../articles";

// Blog: today's workout on the watch face (Melvin picked it from the watch ideas, 2026-11-26; docs/decisions/watch-apps.md
// "Today on the watch face"). Only what ships, and no other app named (seo.test.ts).
export const BLOG_WATCH_TODAY: Article[] = [
  {
    slug: "todays-workout-on-your-watch-face",
    kind: "blog",
    title: "Today's workout on your watch face",
    description:
      "A Liftsmith tile and complication on Wear OS, a complication on Apple Watch and a glance on Garmin show today's workout, how long it takes and how ready you are.",
    date: "2026-11-26",
    tag: "Tracking",
    cta: "watch",
    body: [
      {
        p: "Liftsmith plans each day's workout from your equipment, your recovery and your training block, and Today on your phone says what it picked and why. Now your watch says it too, right on the watch face, so a glance at your wrist on the way to the gym tells you what's waiting.",
      },
      { h2: "What it shows" },
      {
        p: "One short line with the call and how long it takes, like **Push day · 45 min**, and how ready you are, like **Readiness 82**, when your health data says something. On a rest day it says so. If you follow a program, it shows that day's workout from the program instead. Once you start, the watch switches to the live workout as before: the set, the weight and reps, the rest countdown and Log set.",
      },
      { h2: "Wear OS: a tile and a complication" },
      {
        p: "Swipe across your watch faces to the tiles, tap **+** and add **Today's workout**. It shows the call, the minutes, your readiness and the short reason, with a **Start on phone** button that opens the workout on your phone, so heart rate and the rest buzz start with it. You can also add Liftsmith as a complication on any watch face that takes one; a tap opens the watch app.",
      },
      { h2: "Apple Watch: a complication" },
      {
        p: "Touch and hold your watch face, tap **Edit**, and pick Liftsmith for a complication slot. Round, corner, inline and rectangular slots all work, each showing as much as fits. A tap opens the watch app with today's call. Apple Watch can't start a workout on the iPhone from the wrist, so you still tap Start on your phone.",
      },
      { h2: "Garmin: a glance" },
      {
        p: "On Garmin watches with glances, add the Liftsmith glance to see the same line in the list under your watch face. Open the Liftsmith app on the watch once so it can keep the glance up to date in the background.",
      },
      { cta: "watch" },
      { h2: "Never yesterday's plan" },
      {
        p: "The watch knows which day each plan is for. After midnight it stops showing yesterday's and waits for your phone to send the new one, which happens the next time Liftsmith runs. Your phone only sends a new line when something changes, so nothing wakes your watch for nothing.",
      },
      {
        p: "It's free, like the rest of the watch apps. Read [what a smartwatch is good for in the gym](/blog/lifting-with-a-smartwatch/) for everything else the watch does during a workout.",
      },
    ],
    faq: [
      [
        "Do I need Pro for the watch tile or complication?",
        "No. They're free on Wear OS, Apple Watch and Garmin, like the rest of the watch apps.",
      ],
      [
        "Can I start the workout from my watch?",
        "On Wear OS, yes: Start on phone opens it on your phone. On Apple Watch and Garmin, tap Start on your phone and the watch follows.",
      ],
    ],
  },
];
