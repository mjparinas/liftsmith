import type { Article } from "../articles";

// Blog, part twenty-five: Check in at the gym (Melvin, 2026-11-14, docs/decisions/friends.md "Check in"). Only what
// ships, and no other app named (seo.test.ts).
export const BLOG_Y: Article[] = [
  {
    slug: "check-in-at-the-gym",
    kind: "blog",
    title: "Check in at the gym and let your friends know",
    description:
      "One tap on Today tells the friends you pick that you're at the gym. They get a notification and a note in the app until they close it.",
    date: "2026-11-14",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Training is easier when someone knows you showed up. Check in is a small button on Today, next to your gym and the week of your block. Tap it at the gym, pick the friends you want to tell, and they find out right away.",
      },
      { h2: "What your friends see" },
      {
        p: "Each friend gets a notification on their phone, like Sam is at Iron Den, training chest and triceps today. Your turn. When they open Liftsmith, the same note waits at the top of the screen until they close it. Tap it to open your profile. It's written in their language, from your gym's name and the muscles in today's plan, so there's nothing to type.",
      },
      { cta: "plan" },
      { h2: "Who it goes to" },
      {
        ul: [
          "Only friends: people you follow who follow you back in the Friends tab.",
          "Everyone is picked to start. Tap a name to leave someone out.",
          "Blocking or muting someone stops their check-ins reaching you.",
          "You can turn the notifications off in Friends with Friends checking in at the gym. The note still shows in the app.",
        ],
      },
      { h2: "18 and over" },
      {
        p: "Check in is for adults. Lifters under 18 don't see the button and don't get check-ins from anyone. Liftsmith goes by the age in your profile.",
      },
      {
        tip: "Check in before your warm-up. A friend who sees it on the way out the door is more likely to make it to the gym too.",
      },
    ],
    faq: [
      [
        "Can my friends reply?",
        "Not yet. Check in sends one note and nothing more. There's no chat between friends in Liftsmith at the moment.",
      ],
      [
        "Does it share my location?",
        "No. It sends the name you gave your gym in Liftsmith, if you named it, and the muscles in today's plan. It never sends where you are.",
      ],
    ],
  },
];
