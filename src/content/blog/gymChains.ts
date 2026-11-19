import type { Article } from "../articles";

// Blog: gym chains and all their locations (Melvin, 2026-11-19, docs/decisions/gyms.md "Gym chains"). Only what ships,
// and no other app named (seo.test.ts).
export const BLOG_GYM_CHAINS: Article[] = [
  {
    slug: "gym-chain-locations",
    kind: "blog",
    title: "Every location of your gym chain, in one place",
    description:
      "Gyms that belong to a chain now show its logo and a page with every one of its locations, so you can find your branch, check its hours and add it in a tap.",
    date: "2026-11-19",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Plenty of us train at a chain: one membership, a dozen branches, and a habit of dropping into whichever one is closest that day. Until now, each branch in the gym finder stood on its own. Now the branches of a chain know about each other.",
      },
      { h2: "What's new" },
      {
        ul: [
          "Every branch of a chain shows the chain's logo, even when that branch has no website of its own.",
          "Under the gym's name, Part of the chain, with a link to see all of its locations.",
          "In the app, the chain's page lists every branch nearest first, from where you last looked for gyms, and a tap opens a branch's page to add it with its equipment.",
          "On the website, each chain has its own page listing every branch by country and city, and there's a list of all the chains on the gyms page.",
        ],
      },
      { cta: "plan" },
      { h2: "How we know a gym is part of a chain" },
      {
        p: "Most chains are marked on the open map we take our gyms from: each branch carries the chain's brand. When a gym has no brand, we look at its name. A gym called after a chain we know, like the chain's name followed by a town, is that chain's branch. And a name that gyms in three or more cities share becomes a chain of its own, unless it's only everyday words such as Fitness Centre or Municipal Gym, which say what a place is rather than whose it is.",
      },
      {
        p: "The logo is the sharpest icon from the website most of the chain's branches link to. A franchise branch with a site of its own never stands in for the whole chain.",
      },
      { h2: "Claimed gyms stay as they are" },
      {
        p: "If a gym's owner or staff have claimed its page, nothing about it changes: it keeps its own logo and details. It's still listed among its chain's locations, so members can find it.",
      },
      {
        tip: "Train at two branches? Add both as gyms. Liftsmith plans each workout for the equipment at the one you're in that day.",
      },
    ],
    faq: [
      ["Does it cost anything?", "No. Chain pages are free, in the app and on the website."],
      [
        "My gym is in the wrong chain, or missing from one. What can I do?",
        "Use Report a problem on the gym's page and tell us. If it's your gym, claim the page and set its details yourself.",
      ],
    ],
  },
];
