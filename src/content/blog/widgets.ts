import type { Article } from "../articles";

// Blog: the This week and Recovery widgets (Melvin chose both, 2026-11-15; docs/decisions/voice-and-system-shortcuts.md
// "This week and Recovery widgets"). Only what ships, and no other app named (seo.test.ts).
export const BLOG_WIDGETS: Article[] = [
  {
    slug: "home-screen-widgets-this-week-and-recovery",
    kind: "blog",
    title: "New home-screen widgets: your week and your recovery at a glance",
    description:
      "Two new Liftsmith widgets sit beside Today: This week shows your streak and what keeps it going, and Recovery shows which muscles are ready to train.",
    date: "2026-11-15",
    tag: "Tracking",
    cta: "recovery",
    body: [
      {
        p: "The quickest way to stay consistent is to see what to do before you even open an app. Liftsmith's Today widget already puts the day's workout and Start on your home screen. Now two more widgets sit beside it, and each answers one question at a glance.",
      },
      { h2: "This week: am I on track?" },
      {
        p: "The This week widget shows the seven days of your week, from Monday or Sunday, whichever you picked. A filled dot is a day you trained, a ring is a day you planned to, and a small dot is a rest day. Above the strip it says how far along you are, like **2 of 4 this week**, and your streak. Under it, one line says what to do about it: how many more days keep your streak going, or that the goal is already met and anything more is a bonus.",
      },
      {
        p: "A rest day you didn't plan to train never shows as missed. Rest is part of training, and a widget that scolds you every time you look at your phone isn't one you keep.",
      },
      { h2: "Recovery: what's ready to train?" },
      {
        p: "The Recovery widget splits your body into six areas (chest, shoulders, back, arms, core and legs) and lists which are ready to train and which are still recovering, with when each one will be ready: **Legs · ready Tue 6 PM**. It uses the same recovery model as the recovery map in the app, which tracks how hard each muscle worked and how long it takes to bounce back.",
      },
      {
        p: "It keeps itself current without the app. Liftsmith works out each area's ready time when you log a set, and the widget moves an area to **Ready to train** when that time comes. Tap it to open the full recovery map.",
      },
      { cta: "recovery" },
      { h2: "Kind to your battery" },
      {
        p: "None of the widgets check for updates on a timer. They redraw when the app has something new to say, and otherwise only when the phone is already awake: just after midnight, and for Recovery, when an area becomes ready. No wake-ups in your pocket.",
      },
      { h2: "How to add them" },
      {
        p: "Touch and hold an empty spot on your home screen, tap **Widgets**, find Liftsmith and drag **This week** or **Recovery** where you want it. Both resize: smaller shows the essentials, bigger adds the line underneath and Start.",
      },
      {
        p: "Both widgets are free. Read [how long muscles take to recover](/blog/how-long-do-muscles-take-to-recover/) for the thinking behind the ready times.",
      },
    ],
    faq: [
      [
        "Do the widgets drain my battery?",
        "No. They never poll. They redraw when the app sends something new, and otherwise only when the phone is already awake.",
      ],
      [
        "Does the Recovery widget update with the app closed?",
        "Yes. The app works out when each area will be ready, and the widget moves it to ready when that time comes.",
      ],
    ],
  },
];
