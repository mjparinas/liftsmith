import type { Article } from "../articles";

// Blog: the number on the app icon (Melvin, 2026-11-19, docs/decisions/reminders-and-lifecycle-messages.md "App icon
// badge"). Only what ships, and no other app named (seo.test.ts).
export const BLOG_ICON_BADGE: Article[] = [
  {
    slug: "app-icon-badge",
    kind: "blog",
    title: "A number on the app icon, and red counts that say where",
    description:
      "Liftsmith's icon now shows how many messages, likes, comments and follow requests are waiting, and red counts in the app show where each one is.",
    date: "2026-11-19",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "When your coach sends a message or a friend comments on your squat, you shouldn't have to open the app to find out. Liftsmith's icon now carries a small number: everything waiting for you in Friends and in coaching, added up.",
      },
      { h2: "What it counts" },
      {
        ul: [
          "New likes, comments, mentions and cheers on your workouts.",
          "New followers and follow requests waiting for an answer.",
          "Unread messages from your coach, or from your clients if you coach.",
        ],
      },
      { cta: "plan" },
      { h2: "Red counts that point the way" },
      {
        p: "Open the app and the same numbers show in red where they live: on the Friends tab, and on your coach's badge at the top of Today. Read them and the counts go, and the number on the icon goes with them, so the icon and the app always agree.",
      },
      {
        tip: "Rather keep the icon clean? Settings › Reminders has one switch, Number on the app icon. The red counts inside the app stay, so you still see where things are.",
      },
      { h2: "Where it works" },
      {
        p: "On Android and iPhone, the number arrives with each notification, even with the app closed. The web app shows it too once you've installed it from Chrome, Edge or Safari; in a plain browser tab, the red counts in the app do the job.",
      },
    ],
    faq: [
      ["Does it cost anything?", "No. It's free, like Friends and messaging your coach."],
      [
        "Why don't I see a number?",
        "It needs notifications allowed for Liftsmith in your phone's settings, and the switch in Settings › Reminders on. Some Android launchers show a dot instead of a number.",
      ],
    ],
  },
];
