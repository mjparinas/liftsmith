import type { Article } from "../articles";

// Blog, part twenty-three: stats on every exercise (Melvin, 2026-11-13, docs/decisions/workout-history.md "Stats
// on every exercise"). Only what ships, and no other app named (seo.test.ts).
export const BLOG_W: Article[] = [
  {
    slug: "stats-for-every-exercise",
    kind: "blog",
    title: "Every exercise now has its own stats",
    description:
      "Tap any exercise for your sets, total weight lifted, estimated max, charts from a week to a year and how you compare with lifters like you.",
    date: "2026-11-13",
    tag: "Training",
    cta: "onerm",
    body: [
      {
        p: "Every exercise in Liftsmith already had its own page: what to lift next time and why, your best weight for each rep count and every session you've done. Today that page gets the numbers lifters kept asking for, and you can reach it for any of the 1,000 exercises in the library, not only the ones in your history.",
      },
      { h2: "Open any exercise" },
      {
        p: "On **Progress**, tap **All exercises** next to your personal records. Your own exercises come first, the ones you do most at the top, with how many sets you've logged and when you last did them. Below them, search or pick a muscle to browse every exercise. Tap one to open its page.",
      },
      { h2: "At a glance" },
      {
        p: "The page now opens its stats with four tiles: how many sets and workouts you've done, the total weight you've lifted on it and your **estimated one-rep max**. The estimate is the same one the one-rep max calculator uses: it reads your best recent sessions, how close each set was to failure and how long ago it was, so it doesn't jump around after one easy day. For fun, it also tells you what that total weighs: a family car, an elephant, and bigger things as the years go by.",
      },
      {
        p: "Bodyweight exercises show your total reps instead of weight, and holds, carries and cardio show the total time.",
      },
      { cta: "onerm" },
      { h2: "Charts from a week to a year" },
      {
        p: "Under **Which way it's going**, a chart shows the lift over time. It opens on the last three months and switches to a week, a month, six months or a year in a tap. Choose what it draws: your estimated max, each workout's volume or your heaviest set (most reps for bodyweight exercises). The days are to scale, so a two-week break shows as a gap, and a line under the chart says how much it moved over that range.",
      },
      {
        p: "A chart on its own doesn't tell you what to do, so it sits under the line that does: up and working, holding steady, stalled for a few weeks, or dropping, each with one thing to try next. The charts are part of Pro's advanced stats; free lifters see the card and what it would show.",
      },
      { h2: "Lifters like you" },
      {
        p: "For barbell, dumbbell, machine and cable lifts with an estimated max, a new card compares you with trained lifters who weigh about what you weigh, and with your age group and sex if you've added them under **Your stats**. It shows roughly what share of them you'd out-lift, your max as a multiple of your body weight, and a ladder from the 25th to the 95th percentile with where you sit on it.",
      },
      {
        p: "Then it gives you the next rung to aim for: how many more kilograms or pounds on your estimated max would put you ahead of the next step. That's a goal you can work toward over a block, not just a number to look at.",
      },
      {
        tip: "These comparisons come from published strength standards for trained lifters, adjusted for age and sex the way masters lifting coefficients are, not from other people's Liftsmith data. Treat them as a friendly yardstick, not a ranking.",
      },
      { h2: "Works offline, on every phone" },
      {
        p: "Everything on the page is worked out on your phone from the workouts you've logged, so it shows up instantly and works in a gym basement with no signal. It's part of the app's shared code, so it looks and works the same on Android, on iPhone and in the web app. Read [how to estimate your one-rep max](/blog/how-to-estimate-your-one-rep-max/) for more on how the estimate works.",
      },
    ],
    faq: [
      [
        "Is the comparison based on other Liftsmith users?",
        "No. It uses published strength standards for trained lifters at your body weight, adjusted for age and sex when you've added them. The page says so under the card.",
      ],
      [
        "Why doesn't the comparison use my height or BMI?",
        "Published strength standards are set by body weight, age and sex, not height or BMI, so the card uses the same numbers the standards are built on.",
      ],
      [
        "Are the stats free?",
        "Totals, the estimated max and the comparison are free. The charts over time are part of Pro's advanced stats.",
      ],
    ],
  },
];
