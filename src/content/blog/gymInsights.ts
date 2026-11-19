import type { Article } from "../articles";

// Blog: insights for gym owners (Melvin, 2026-11-19, gap item 8; docs/decisions/gyms.md "Owner insights"). Only what
// ships, and no other app named (seo.test.ts).
export const BLOG_GYM_INSIGHTS: Article[] = [
  {
    slug: "gym-owner-insights",
    kind: "blog",
    title: "See how members use your gym",
    description:
      "Gym owners on Liftsmith now see how many lifters train there, the busy and quiet hours, the equipment members use and what to do next.",
    date: "2026-11-19",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "If you run a gym, you can feel when it's busy, but it's hard to know what members actually do on the floor. Which hours are packed? Does anyone use the leg press you bought last spring? Is the broken cable machine still putting people off? Your gym's page in Liftsmith now answers those questions, and leads with the one thing worth doing about them.",
      },
      { h2: "What you see" },
      {
        ul: [
          "How many lifters trained at your gym in the last four weeks, and how that compares with the four weeks before.",
          "Workouts in those four weeks, and how long a typical one lasts.",
          "Busy hours: a bar for every hour of the day, with the busiest day and time named.",
          "Equipment used: the kinds of equipment members trained with, as a share of workouts.",
          "Open problem reports from lifters, counted at the top.",
        ],
      },
      { h2: "One thing to do, not a wall of charts" },
      {
        p: "Every view starts with a single next step, the first that applies. Open equipment problems come first, because lifters' plans work around broken equipment until you tap Fixed. Then equipment in your setup nobody used in four weeks, worth checking or showing off in an announcement. Then a drop in workouts, with a nudge toward an announcement or a new class. Otherwise, your quietest weekday hour, so you can tell members when the racks are free and spread the evening rush.",
      },
      { cta: "plan" },
      { h2: "Private by design" },
      {
        p: "When a lifter finishes a workout at a gym they added from the map, the app sends four things: the weekday and hour it started, how long it lasted, and the kinds of equipment used, like barbell or leg press. Never a name, a weight, a rep or an exercise. Who it was is kept only as a one-way code, so a lifter counts once, and visits are cleared after ten weeks.",
      },
      {
        p: "You only ever see totals and percentages, and the hours and equipment stay hidden until five different lifters have trained at your gym in four weeks, so nobody can be picked out. Lifters can turn off Count my gym visits in Settings › Your data and privacy at any time, and under-18s are never counted.",
      },
      { h2: "How to get it" },
      {
        p: "Claim your gym's page in the app (find it in Find gyms near you, then Is this your gym? Claim it), then open Manage this gym's page. Insights sit just under your results, for the owner and any staff you invite, on Android, iPhone and the web.",
      },
      {
        tip: "Put up the free poster where members check in. Every lifter who adds your gym from it counts toward your insights.",
      },
    ],
    faq: [
      ["Does it cost anything?", "No. Insights are free for every official gym."],
      [
        "Can I see which members trained, or when?",
        "No. You see totals and shares only, and nothing about hours or equipment until five lifters have trained there.",
      ],
      [
        "I'm a lifter. How do I stop being counted?",
        "Turn off Count my gym visits in Settings › Your data and privacy. Nothing more is sent from then on.",
      ],
    ],
  },
];
