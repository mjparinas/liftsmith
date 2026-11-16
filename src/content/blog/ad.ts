import type { Article } from "../articles";

// Blog, part thirty: ratings and reviews for coaches, personal trainers and physios (Melvin, 2026-11-15,
// docs/decisions/coach-reviews.md). Only what ships, and no other app named (seo.test.ts).
export const BLOG_AD: Article[] = [
  {
    slug: "coach-ratings-and-reviews",
    kind: "blog",
    title: "Coach ratings and reviews from clients who trained with them",
    description:
      "Clients can now rate their coach after four weeks or two sessions. Ratings show after three reviews, next to how their clients are training.",
    date: "2026-11-15",
    tag: "Coaching",
    cta: "coach",
    body: [
      {
        p: "Picking a coach is a leap of faith. Star ratings help, but most review sites can't tell whether the person writing ever trained with the coach. In Liftsmith, only a coach's own clients can rate them, and only after they've worked together long enough to know.",
      },
      { h2: "Who can leave a review" },
      {
        ul: [
          "A client of that coach, personal trainer or physio in the app.",
          "After four weeks together, or sooner once they've had two paid or booked sessions.",
          "Adults only: clients under 18 can't leave public reviews.",
          "One review per coach, which the client can change or delete at any time.",
        ],
      },
      {
        p: "Rating takes one tap on a star under your coach on Coaching, plus an optional line about what it was like. Your first name and last initial show with it.",
      },
      { cta: "coach" },
      { h2: "Fair to new coaches" },
      {
        p: "A coach's rating stays hidden until they have three reviews, so one unhappy client can't sink someone who's just starting out. The coach sees every review from the first one, so they can thank a client or answer a concern, with one public reply to each.",
      },
      { h2: "Results, not just stars" },
      {
        p: "Next to the stars, once a coach has three or more clients, Liftsmith shows how many of them trained in the last two weeks, counted from their logged workouts. It's a plain measure of whether a coach keeps people training, and it can't be written by a friend.",
      },
      { h2: "Where reviews show" },
      {
        p: "Ratings and the latest reviews show on a coach's invite, before you agree to train with them, and on the trainer directory for their city on the website, with the stars search engines read.",
      },
      { h2: "Keeping it honest" },
      {
        p: "Reviews and replies go through the same word and link filter as Friends. Anyone can report a review or a reply, and one that three people report is hidden until we look at it.",
      },
      {
        tip: "Coaches: once a client has trained with you for a month, ask them for a review. Three honest reviews are what turns your rating on.",
      },
    ],
    faq: [
      [
        "Can a coach delete a bad review?",
        "No. A coach can reply once, publicly, and report a review that breaks the rules. Only the client who wrote it, or our moderators, can take it down.",
      ],
      [
        "What happens to my review if I stop training with my coach?",
        "It stays up, and you can still delete it. You can't change it once you're no longer their client.",
      ],
      ["Does it cost anything?", "No. Being a client is free, and so is leaving a review. Coaches see their reviews on any plan."],
    ],
  },
];
