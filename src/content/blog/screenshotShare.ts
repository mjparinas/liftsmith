import type { Article } from "../articles";

// Blog: share cards when you take a screenshot, and an invite in every link (Melvin, 2026-11-15;
// docs/decisions/sharing.md and growth.md "An invite in every link"). Only what ships, and no other app named (seo.test.ts).
export const BLOG_SCREENSHOT_SHARE: Article[] = [
  {
    slug: "share-cards-when-you-screenshot",
    kind: "blog",
    title: "Take a screenshot, get a training card worth sharing",
    description:
      "Screenshot Liftsmith and training cards slide up: your month, year or all time, with your invite link on the card. Every shared link now carries it.",
    date: "2026-11-16",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "When people screenshot a training app, it's usually to show someone how it's going. A cropped screenshot of a list doesn't say much, though. So now, when you take a screenshot in Liftsmith, your screenshot is saved as normal and a sheet slides up with **cards made for sharing**: your training over the span you pick, drawn on the same dark card as your workout shares.",
      },
      { h2: "What's on the cards" },
      {
        ul: [
          "**Pick a span:** the last month, three months, six months, a year, or everything since your first workout.",
          "**Totals:** workouts, total lifted, new bests, how many weeks you trained, and how it compares with the span before.",
          "**Where your sets went:** a ring showing push, pull, legs and core, so you can see your balance at a glance.",
          "**Best lifts:** your top three new bests in that span.",
          "**The eye button** hides every weight, if you'd rather share the work than the numbers.",
        ],
      },
      { cta: "plan" },
      { h2: "Your invite link, on the card" },
      {
        p: "If you're in Friends, your invite link is printed at the bottom of the card and sent along with it. It reads **getliftsmith.com/invite/** and your code, so anyone can see what it is before they tap. A friend who joins with it follows you back, and once they finish three workouts you both get a month of Pro.",
      },
      {
        p: "This goes for everything you share now: routines, gyms, workout links, your profile and public card links all carry your invite. Invite codes last a year and renew while you use them, so a card you posted months ago still works.",
      },
      { h2: "Easy to wave away" },
      {
        ul: [
          "Swipe the sheet down, tap the ✕ or go back, and you're where you were.",
          "**Don't show this on screenshots** at the bottom turns it off. The switch to bring it back is in Settings › Your data and privacy › Sharing.",
          "It never opens during a workout, over another sheet, or twice in a row for a burst of screenshots.",
        ],
      },
      { h2: "On every device" },
      {
        p: "Screenshots open the sheet on Android 14 and up and on iPhone. Older Android phones and the web app can't tell a screenshot was taken, so there, and everywhere else too, **Share my training** on Progress opens the same cards. Lifters under 18 can share cards, but their cards never carry an invite link.",
      },
      {
        tip: "Three months is the sweet spot: long enough to show real progress, short enough that the bests are fresh.",
      },
    ],
    faq: [
      [
        "Is my screenshot still saved?",
        "Yes. Liftsmith only hears that you took one. The screenshot is saved as usual, and the sheet is an extra you can close.",
      ],
      [
        "What never goes on a card?",
        "Heart rate, body weight, body fat, measurements, cycle data, injuries and gyms. Weights only show while the eye is open.",
      ],
    ],
  },
];
