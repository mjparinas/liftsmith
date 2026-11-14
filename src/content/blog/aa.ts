import type { Article } from "../articles";

// Blog, part twenty-seven: the lifecycle emails (Melvin, 2026-11-14, docs/decisions/reminders-and-lifecycle-messages.md).
// Only what ships, and no other app named (seo.test.ts).
export const BLOG_AA: Article[] = [
  {
    slug: "emails-that-keep-you-training",
    kind: "blog",
    title: "Emails that keep you training, and only the ones you want",
    description:
      "Getting-started tips with real screens, weekly and monthly recaps, new bests, friends who trained and a nudge back after a break, each with its own switch.",
    date: "2026-11-14",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Most of Liftsmith happens in the app, while you lift. A few things are easier to hear about in your inbox: how your week went, a new best, or a reminder that your plan is still there after a busy stretch. With an account, Liftsmith now sends a small set of emails like that, to the address you signed in with.",
      },
      { h2: "Your first eight days" },
      {
        p: "After you sign in, one short email a day shows you one thing the app does, with the real screen: the plan that's ready when you open the app, the reason next to each exercise, one-tap logging, the rule behind every weight, the rest timer on the lock screen, the recovery map, coach's notes, and PRs, levels and badges. Eight emails, then they stop.",
      },
      { h2: "Recaps, bests and friends" },
      {
        ul: [
          "Sunday evening: your week in numbers, with workouts, sets, weight lifted and new bests.",
          "On the 1st: last month's recap, with a card in the app ready to share.",
          "A new personal best on a lift, at most once a week.",
          "Thursday evening, if you use Friends: which friends trained this week.",
          "Before your first workout: what's planned for it and how long it takes.",
          "After two weeks or more without a workout: your plan is still there, and the next workout starts shorter and lighter.",
          "Two days before a Pro trial ends, if you're on one.",
        ],
      },
      { cta: "plan" },
      { h2: "Never more than one a day" },
      {
        p: "Liftsmith sends at most one email a day and nothing late at night. If a recap or a reminder lands on a day that had a getting-started tip, the tip moves to the next free day. Every email is in your app's language.",
      },
      { h2: "You choose" },
      {
        p: "Each kind of email has its own switch in Settings, Reminders, and every email has a one-click unsubscribe link at the bottom. Turning email off on one device turns it off everywhere you're signed in. Lifters under 18 start with email off, and never get the getting-started tips or offers.",
      },
      {
        tip: "Want the recap but not the tips? Leave Weekly and monthly recaps on and turn Getting started tips off. Nothing else changes.",
      },
    ],
    faq: [
      [
        "Which address do the emails go to?",
        "The one you signed in with. Google and Apple only give verified addresses, and email sign-in checks the code we send, so there's nothing to type or confirm.",
      ],
      [
        "Do you send my workouts to anyone?",
        "No. The app sends the server only the numbers the emails use, like how many workouts and sets you did this week and your newest best. They're used for your emails and nothing else.",
      ],
    ],
  },
];
