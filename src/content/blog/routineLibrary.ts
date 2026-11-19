import type { Article } from "../articles";

// Blog: the public routine library (Melvin, 2026-11-19, gap item 6; docs/decisions/routine-library.md). Only what
// ships, and no other app named (seo.test.ts).
export const BLOG_ROUTINE_LIBRARY: Article[] = [
  {
    slug: "routine-library",
    kind: "blog",
    title: "A routine library: find, save and rate routines other lifters made",
    description:
      "Search routines other lifters published by goal and by what your gym has, save one in a tap, rate it, and publish your own with its own page.",
    date: "2026-11-19",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Some of the best routines never make it into a book. They're the push day a friend has run for a year, or the 30-minute full body someone built for a hotel gym. Liftsmith now has a routine library, so lifters can share those and everyone else can find them.",
      },
      { h2: "Find one that fits" },
      {
        ul: [
          "Search by words, like squat, glutes or hotel.",
          "Pick a goal: strength, muscle, fitness, fat loss or sport.",
          "Turn on Fits my gym to see only routines your active gym has everything for.",
          "Sort by the most saved, or by the newest.",
        ],
      },
      {
        p: "Each routine shows its exercises, sets, about how long it takes and what it needs. Save it and it lands in your routines, ready to start or change.",
      },
      { cta: "plan" },
      { h2: "Stars from people who tried it" },
      {
        p: "Only lifters who saved a routine can rate it, one to five stars, and the stars show once three people have rated it. You can't rate your own. That keeps the numbers honest.",
      },
      { h2: "Publish your own" },
      {
        p: "Open one of your routines and tap Publish to the routine library. Give it a title, a goal and a level, a few words if you like, and choose whether your name shows. Only the exercises, sets, supersets and parts go out, never your weights or notes. You can update it or take it out any time.",
      },
      {
        p: "Every published routine also gets its own page on the website, with the full list of exercises, so you can share a link with anyone.",
      },
      {
        tip: "Publishing the same routine again updates the one you already published, so the link you shared keeps working.",
      },
      { h2: "Kept tidy" },
      {
        p: "Titles and descriptions go through the same filter as the rest of the community, links are not allowed, and anyone can report a routine. Three reports hide it until the team has a look.",
      },
    ],
    faq: [
      ["Does it cost anything?", "No. Browsing, saving, rating and publishing are all free."],
      ["Who can publish?", "Anyone 18 or older with a free account. Younger lifters can still browse, save and rate."],
      ["Can people see my weights?", "No. Only the exercises, sets, supersets and parts of the routine are published."],
    ],
  },
];
