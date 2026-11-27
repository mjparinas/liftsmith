import type { Article } from "../articles";

// Blog: the free workout generator on the website (Melvin, 2026-11-27, docs/decisions/workout-generator.md). Only what
// ships, and no other app named (seo.test.ts).
export const BLOG_WORKOUT_GENERATOR: Article[] = [
  {
    slug: "free-workout-generator",
    kind: "blog",
    title: "A free workout generator that says why",
    description:
      "Pick your equipment, time and what to train, and get a free workout with sets, reps, rest and a reason for every exercise. No sign-up needed.",
    date: "2026-11-27",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Most days the hard part of training isn't the lifting, it's deciding what to lift. You have 40 minutes, a set of dumbbells and a vague plan to do something for your legs. Our new [workout generator](/tools/workout-generator/) answers that in a few taps, free, in your browser, with no account.",
      },
      { h2: "What you pick" },
      {
        ul: [
          "Equipment: a full gym, a home gym, dumbbells only, no equipment, or exactly what you have, piece by piece.",
          "Time: 15 to 90 minutes, in steps of five.",
          "What to train: full body, upper or lower body, push, pull or legs, or one area such as chest, back, shoulders, arms, glutes or core.",
          "Your goal (muscle, strength or general fitness) and how long you've been lifting.",
          "Whether to pair exercises into supersets, so more fits in the same time.",
        ],
      },
      {
        p: "Every change writes the workout again straight away. Another workout gives you a different one for the same choices.",
      },
      { h2: "The same engine as the app" },
      {
        p: "This isn't a list of random exercises. The generator runs the engine that plans every workout in Liftsmith, as it would for a brand-new lifter with your equipment. It keeps only the exercises your equipment can do and, if you picked an area, only the ones whose main muscles are all in it. The big muscles get the first picks, and each one starts with a compound lift while you're fresh; smaller lifts follow if there's time.",
      },
      {
        p: "Sets and reps follow your goal: 6 to 10 reps on compound lifts and 10 to 15 on smaller ones for muscle, fewer reps and longer rests for strength, the middle ground for general fitness. Planks, holds and carries are timed in seconds. Main lifts get warm-up sets, and the whole thing, rests included, fits the minutes you picked.",
      },
      { cta: "plan" },
      { h2: "A reason for every exercise" },
      {
        p: "Under each exercise is a short line saying why it's there: a compound lift first while you're fresh, a smaller lift to finish a muscle off, why that rep range suits your goal, why it gets an extra set, or why it's paired with the exercise after it. If the workout comes out shorter than the time you picked, because there are only so many exercises worth doing for your arms with no equipment, it says so rather than padding it out.",
      },
      {
        p: "Each exercise also says how many reps to leave in the tank. Pick a weight you could lift that many more times when the set ends with good form. That's how a new training block starts: a few reps short of failure, so you can learn the lifts and recover well.",
      },
      { h2: "Share it, or start it in the app" },
      {
        p: "Every workout has its own link, and the same link always gives the same workout, so you can send tomorrow's session to a training partner. Start this in the app opens the workout in Liftsmith as a routine, ready to save or start. On Android the app opens straight away; on iPhone and computers it opens the web app.",
      },
      {
        tip: "In the app, your own weights fill in as you lift and are saved for next time, the rest timer runs on its own, and tomorrow's workout follows from today's.",
      },
      { h2: "When you'll want more than a generator" },
      {
        p: "A generator starts from scratch every time. It can't know that your legs are still sore from Monday, that you've already done twelve sets of chest this week, or that you added a rep on your bench last time. Liftsmith remembers all of that, so every day's workout follows the last, weights go up when you're ready, and an easy day shows up when your recovery says so.",
      },
    ],
    faq: [
      ["Is the workout generator free?", "Yes. It's free, needs no account, and nothing you pick is kept."],
      [
        "Does it give me weights?",
        "It gives sets, reps, rest and how many reps to leave in the tank, so you can pick the weight. The app learns your real numbers from your first workout and plans every weight after that.",
      ],
      [
        "Can I use it with no equipment?",
        "Yes. Pick No equipment and it writes a bodyweight workout, or pick exactly what you have, such as a pull-up bar and resistance bands.",
      ],
    ],
  },
];
