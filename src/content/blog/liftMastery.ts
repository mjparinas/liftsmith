import type { Article } from "../articles";

// Blog: lift mastery stars and the unlocks they bring (Melvin, 2026-11-27: "add more things that the user can unlock
// through exercises"; docs/decisions/lift-mastery.md). Only what ships, and no other app named (seo.test.ts).
export const BLOG_LIFT_MASTERY: Article[] = [
  {
    slug: "lift-mastery-stars",
    kind: "blog",
    title: "Lift mastery: stars for every exercise, and what they unlock",
    description:
      "Every exercise earns up to four mastery stars from the sets you log. Stars and sets unlock 3D figure colours, share card frames and titles for your profile.",
    date: "2026-11-27",
    tag: "Tracking",
    cta: "log",
    body: [
      {
        p: "Some rewards come from big days: a new best, a heavy single, a plate on each side for the first time. Most of getting strong is quieter than that. It's the hundredth set of [back squats](/exercises/back-squat/) on a Tuesday when nothing special happens. Lift mastery is for those sets.",
      },
      { h2: "Four stars for every exercise" },
      {
        p: "Every exercise earns up to four mastery stars from the sets you log of it: the first at 25 sets, then 100, 300 and 1,000. Every working set counts once, bonus drop sets and rest-pause sets too. Warm-up sets don't, and neither do sets in a rehab part, which are for getting better, not for training the lift.",
      },
      {
        p: "Your stars show on the exercise's own page, with a bar and the number of sets to the next one, and next to the exercise's name during a workout, so you see them without a tap. When a workout earns a star, the end-of-workout screen says which lift went up.",
      },
      {
        tip: "Nothing is stored or counted twice: mastery is worked out from the sets you've logged, so imported history counts and a deleted workout takes its sets with it.",
      },
      { h2: "Colours for the 3D figure" },
      {
        p: "The 3D figure that shows every exercise starts as a blue hologram. Train enough and it can wear something else: Cobalt for 500 pushing sets, Aqua for 500 pulling sets, Violet for 500 leg sets and Rose for 300 core sets, counted from each exercise's main muscle. Mint comes with three lifts at two stars, Gold with your first three-star lift and Platinum with your first four-star lift. Pick one in the locker and every figure in the app follows it.",
      },
      { h2: "Frames for your share cards" },
      {
        p: "Personal bests and plate clubs now unlock frames for the cards you share. The bench press plate club gives Iron, squat's gives Chrome and deadlift's gives Ember, and the personal bests badge gives Silver, Gold and Platinum as it climbs. A frame goes around every card: a [best or max you share](/blog/share-your-max-and-bests/), a finished workout or a season recap.",
      },
      { h2: "Titles for your profile" },
      {
        p: 'A title is a few fixed words under your name on your Friends profile and its public page. Some come from badges, like Early bird, Weekend warrior, Comeback kid, Centurion and Record breaker. Three of them name the lift that earned them: "Deadlift devotee" at two stars, "Deadlift specialist" at three and "Deadlift master" at four. You pick which one shows, or none.',
      },
      {
        p: "Titles are never typed, so there's nothing to moderate and nothing anyone can fake: the server only accepts the titles the app knows, and your app works out which ones you've earned from your own workouts.",
      },
      { cta: "log" },
      { h2: "All free" },
      {
        p: "Mastery stars, figure colours, frames and titles are free, on Android, iPhone and the web. They live in the locker on the Awards tab, which opens after your fifth workout, alongside [training seasons](/blog/training-seasons/). Nothing here comes from a crate, so every one of them has a sure path: the sets you log.",
      },
    ],
    faq: [
      ["How many sets is each mastery star?", "25 sets of an exercise for the first star, then 100, 300 and 1,000."],
      [
        "Do warm-up sets count toward mastery?",
        "No. Every working set counts once, drop sets and rest-pause sets too, but warm-ups and sets in a rehab part don't.",
      ],
      ["Do I need Pro for mastery or the unlocks?", "No. Stars, figure colours, share card frames and titles are all free."],
      ["Can I hide my title?", "Yes. Pick No title in the locker and nothing shows under your name."],
    ],
  },
];
