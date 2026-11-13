import type { Article } from "../articles";

// Blog, part twenty-one: pick weights (Melvin, 2026-11-13: "each exercise should maintain a probability of being
// picked … custom to each user"; docs/decisions/pick-weights.md). How the adaptive plan chooses exercises now:
// popular lifts first, likes up, swaps down. Only what ships, and no other app named (seo.test.ts).
export const BLOG_U: Article[] = [
  {
    slug: "workouts-that-learn-the-lifts-you-like",
    kind: "blog",
    title: "Workouts that learn the lifts you like",
    description:
      "Liftsmith's adaptive plan now favours the lifts most people train, picks the ones you star more often and the ones you swap away less.",
    date: "2026-11-13",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Liftsmith's library has grown to about a thousand exercises. That's great when you want a swap for a busy machine or a move for a home gym, but it was too much choice for the daily plan: it could hand you a paused snatch-grip deadlift on a day you just wanted to bench and row. So we've changed how the adaptive plan picks exercises. Every exercise now has its own chance of being picked, it starts from how popular the lift is, and it moves with what you do.",
      },
      { h2: "Popular lifts come first" },
      {
        p: "Most good training is built on a short list of lifts: bench press with a barbell or dumbbells, squats, deadlifts and sumo deadlifts, rows, overhead and military presses, curls of every kind, shrugs, lunges, pulldowns and pull-ups, leg presses and the classic machine work. Those are now the staples, and the plan picks them most often. Well-known variations, like a dumbbell fly, a T-bar row or a hack squat, come up some of the time. The unusual moves still turn up now and then for variety, but rarely.",
      },
      {
        p: "In a full gym that means most of what you see on a given day is a staple. In a home gym or a bodyweight setup the plan still picks from what you have, so the less common moves come up when they're the right tool for your equipment.",
      },
      { cta: "plan" },
      { h2: "Star the lifts you like" },
      {
        p: "Tap the star on any exercise during a workout, or add it under **Settings › Workout › Plan details › Favourite exercises**. A starred exercise counts as a staple for you, however unusual it is, and is picked far more often whenever your gym has what it needs and the muscles it trains are ready. Today shows *a favourite* in its reason when that's why it was chosen.",
      },
      { h2: "Swap away the ones you don't" },
      {
        p: "When you swap an exercise for another one, Liftsmith takes the hint. The one you swapped away is picked less often, and the one you chose is picked a little more. Each swap counts for less as the weeks go by and is forgotten after a year, so a lift you skipped during a sore week comes back in time. No exercise is ever ruled out by swaps alone.",
      },
      {
        p: "Swapping something because your gym doesn't have it, or a machine is broken, is different: choose **Not available here** and the plan leaves that exercise out at that gym for two weeks, without counting it against the lift. If you change your mind about a lift, **Settings › Workout › Plan details › Picked less often** lists the exercises your swaps have lowered, and **Reset** puts one back to normal.",
      },
      { h2: "Safety still comes first" },
      {
        p: "These chances only decide between exercises that already fit. Your equipment, an injury you've told the app about, exercises marked not available at your gym and how recovered each muscle is all come first, and no like or swap can bring back an exercise one of them left out.",
      },
      { h2: "Yours on every device" },
      {
        p: "Your stars and swaps are already part of your training history, so the same chances follow you to your Android phone, your iPhone and the web app when you sign in, and nothing extra is sent anywhere. Each device keeps what it has worked out, so building a plan stays instant even with years of workouts. Read [how to build a workout routine](/blog/how-to-build-a-workout-routine/) for why a short list of lifts done well beats a long one, or open the app and start today's workout.",
      },
    ],
    faq: [
      [
        "Will I still see new exercises?",
        "Yes. Less common moves still come up now and then, more often in home and bodyweight gyms where they're the best fit. Lower the variety under Settings if you'd rather see the same lifts every week.",
      ],
      [
        "Does swapping an exercise once ban it?",
        "No. One swap makes it a little less likely for a while. It fades over a few months, and Reset under Picked less often undoes it straight away.",
      ],
      [
        "Does a like override an injury or missing equipment?",
        "No. Likes and swaps only choose between exercises that already fit your equipment, injuries and recovery.",
      ],
    ],
  },
];
