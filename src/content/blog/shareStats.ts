import type { Article } from "../articles";

// Blog: a share button on every max, heaviest set and best (Melvin, 2026-11-27; docs/decisions/sharing.md "Share one
// stat"). Only what ships, and no other app named (seo.test.ts).
export const BLOG_SHARE_STATS: Article[] = [
  {
    slug: "share-your-max-and-bests",
    kind: "blog",
    title: "Share your max, your heaviest set or any personal best",
    description:
      "A small share button now sits beside every estimated max, heaviest set and personal best in Liftsmith. One tap makes a card of that number, ready to post.",
    date: "2026-11-27",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Some numbers are worth showing off: the first time your estimated bench max passes a round number, a heaviest set you've chased for months, a best for ten reps that finally moved. Liftsmith already made a card at the end of a workout. Now **every one of those numbers has its own share button**, right where you see it.",
      },
      { h2: "Where the button is" },
      {
        ul: [
          "**Estimated one-rep max:** beside each lift on Progress, and on the estimated max tile of every exercise's page.",
          "**Heaviest set and bests for each rep count:** every row of the bests table on an exercise's page, from your heaviest single to your best for 15 reps.",
          "**Recent personal bests:** beside each new best on Progress.",
          "**Badges and your level:** on Awards, as before.",
        ],
      },
      {
        p: "It's a small, quiet icon, so the screen still reads like a page of training and not a page of buttons. Tapping the row itself still opens what it always did.",
      },
      { cta: "plan" },
      { h2: "What's on the card" },
      {
        p: "The card is drawn in the app's own look: the dark navy card, the blue-to-violet number, the 3D figure doing the lift, the Liftsmith logo at the top and the website at the foot. An estimated max says which set it came from and carries your heaviest set beside it. A best says what it is (heaviest set, or heaviest for 5+ reps) and the day you lifted it.",
      },
      {
        ul: [
          "Pick a square post or a tall story.",
          "**Show weights** is on by default. Turn it off and the card shows reps or workouts instead of kilos or pounds.",
          "**Show my name** is off by default.",
          "Your invite link can be printed on the card, so a friend who joins with it follows you back.",
        ],
      },
      { h2: "On Android, iPhone and the web" },
      {
        p: "In the Android and iPhone apps the card goes to your phone's own share sheet, so you can post it, message it or save it to your photos. In the web app it opens your browser's share menu where there is one, and downloads the picture where there isn't. Heart rate, body weight and places never appear on any card.",
      },
    ],
  },
];
