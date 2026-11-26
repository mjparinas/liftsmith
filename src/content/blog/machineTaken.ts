import type { Article } from "../articles";

// Blog: Machine taken, one tap on the watch or the phone (Melvin, 2026-11-26, watch ideas 2;
// docs/decisions/watch-apps.md "Machine taken"). Only what ships, and no other app named (seo.test.ts).
export const BLOG_MACHINE_TAKEN: Article[] = [
  {
    slug: "machine-taken-swap-from-your-watch",
    kind: "blog",
    title: "Machine taken? Swap it from your watch in one tap",
    description:
      "Someone's on the lat pulldown. Tap Machine taken on your watch or phone and Liftsmith swaps in the best lift for your gym, with its weight and why.",
    date: "2026-11-26",
    tag: "Workouts",
    cta: "watch",
    body: [
      {
        p: "Busy gyms have a way of putting someone on the one machine you need, right when you need it. You could stand and wait, or scroll a list of swaps between sets. Now there's a third way: tap **Machine taken** on your watch and keep training.",
      },
      { h2: "What happens when you tap it" },
      {
        ul: [
          "Liftsmith looks for lifts that work the same main muscles at the gym you're in, leaving out anything that needs the busy equipment, anything already in today's workout and anything your injuries or pregnancy settings rule out.",
          "Of the closest matches it picks the one your plan would pick most often: your favourites first, then the familiar staples, never something you keep swapping away from.",
          "The watch shows the new lift with its weight and reps, worked out from your own history, and a short line saying why it's there: in for the lift that was taken.",
        ],
      },
      {
        p: "Before you tap, the line under the button already says what it swaps to, so there are no surprises.",
      },
      { cta: "watch" },
      { h2: "On every watch, and on the phone" },
      {
        p: "Machine taken is on Wear OS and Apple Watch as a button under Log set, and on Garmin watches as the UP button (the hint at the bottom says so). On the phone and the web, **Change the plan** during a workout leads with the same pick as a single **Swap to** button, with its weight and why, and the other options under it.",
      },
      {
        tip: "Phone in your bag with the app asleep? The tap still works: the phone worked the swap out ahead of time, so the watch and lock screen move to the new lift at once, and the app makes the same swap the next time it opens.",
      },
      { h2: "It learns, gently" },
      {
        p: "A Machine taken swap counts like any other swap, so a lift you often can't get to is picked a little less often in future plans. A star on a favourite keeps it coming back, and **Settings › Workout › Plan details › Picked less often** resets any lift you want back.",
      },
    ],
    faq: [
      [
        "Is it free?",
        "Working around taken equipment is part of Pro, on the watch and the phone alike. Free lifters can still swap any exercise by hand from the workout screen.",
      ],
      [
        "Do the sets I already did count?",
        "Yes. Sets you logged stay with the first lift, and the swap takes only the sets that are left.",
      ],
    ],
  },
];
