import type { Article } from "../articles";

// Blog: 30-day challenges, with a printable calendar on the website and the day's number on Today (Melvin,
// 2026-11-27, traffic idea 2; docs/decisions/thirty-day-challenges.md). Only what ships, and no other app named.
export const BLOG_THIRTY_DAY: Article[] = [
  {
    slug: "30-day-challenges-printable-calendar",
    kind: "blog",
    title: "30-day challenges: print the calendar, or let the app count",
    seoTitle: "Free 30-day fitness challenges with printable calendars",
    description:
      "Twelve free 30-day challenges, from squats and push-ups to planks and pull-ups, at three levels. Print the calendar or track every day in Liftsmith.",
    date: "2026-11-27",
    tag: "Workouts",
    cta: "challenge",
    body: [
      {
        p: "A 30-day challenge is about the simplest training plan there is: one move, every day, a little more each time. It works because it's easy to start and easy to keep going, and by day 30 the move that felt hard on day 1 has become something you just do. Liftsmith now has twelve of them, each with a calendar you can print and a way to track it in the app.",
      },
      { h2: "Twelve challenges, three levels each" },
      {
        ul: [
          "Squats, push-ups, planks, pull-ups, sit-ups and glute bridges.",
          "Lunges, wall sits, burpees, dead hangs, calf raises and mountain climbers.",
          "Each one at Beginner, Intermediate and Advanced. Push-ups start on the knees at Beginner and pull-ups start with slow lowering reps, so nobody begins with a move they can't do yet.",
        ],
      },
      {
        p: "Every challenge climbs evenly from a day 1 number most people at that level can do today to a day 30 number about five to eight times bigger. Every fourth day is a rest day, because muscles get stronger while they recover, so day 30 lands as the biggest day of all.",
      },
      { h2: "Print it and stick it on the fridge" },
      {
        p: "Each challenge has its own page on the website with the whole month laid out. Pick your level and press **Print the calendar**: it prints on one page with a box to tick each day, a line for your name and start date, and a code that brings you back to the page. It's a good one for a family, an office or a class doing the same challenge together.",
      },
      { cta: "challenge" },
      { h2: "Or let the app keep count" },
      {
        p: "Press **Join in the app** on any challenge page, or open **Tools › 30-day challenges** in Liftsmith. Once you've joined, Today shows the day's number with a one-tap **Done**, and the challenge screen shows your 30 days filling in.",
      },
      {
        ul: [
          "Did more or less than the number? Change it with − and + before you tap Done, and that's what's saved.",
          "Each day says why it's that number: up from yesterday's, a rest day so you recover, or day 1 at your level.",
          "Missed a day? Nothing is lost. The challenge waits and you pick up on the day you're on, rather than jumping ahead to catch up.",
          "Run up to three at once, change level mid-way without losing your days, and Undo a day logged by mistake.",
        ],
      },
      {
        tip: "Split the day's number up however you like. Fifty squats can be five sets of ten across the day, and a two-minute plank can be four holds of thirty seconds: the seconds add up.",
      },
      { h2: "What a 30-day challenge does, and doesn't, do" },
      {
        p: "Thirty days of one move builds muscular endurance and makes the move feel easy, and the daily habit is often the bigger win. What it won't do on its own is build a lot of strength: past a point, more reps of the same bodyweight move mostly train you to do more reps. When you're done, go again at the next level, try a different challenge, or move on to a program with weights. Challenge days aren't counted as workouts, so they never change your plan, your streak or your weekly goal.",
      },
    ],
    faq: [
      ["Is it free?", "Yes. Every challenge, its printable calendar and tracking it in the app are free on Android, iPhone and the web."],
      [
        "Can I do a challenge and still follow my workouts?",
        "Yes. A challenge sits beside your training, and it never changes your plan. If a move is already in today's workout, count those reps toward the day if you like.",
      ],
      [
        "I'm pregnant. Can I join?",
        "Pregnancy mode leaves some moves out of your plans, such as lying on your back from week 14, and the challenge screen says so on those challenges. Pick another one, or check with your midwife or doctor first.",
      ],
    ],
  },
];
