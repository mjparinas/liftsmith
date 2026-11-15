import type { Article } from "../articles";

// Blog, part twenty-nine: food coaching that follows your own numbers (Melvin picked it from the nutrition review,
// 2026-11-15, docs/decisions/food-from-health.md). Only what ships, and no other app named (seo.test.ts).
export const BLOG_AC: Article[] = [
  {
    slug: "food-coaching-from-your-own-numbers",
    kind: "blog",
    title: "Food coaching from your own numbers: measured maintenance",
    description:
      "Liftsmith now measures your real maintenance from your food app and weigh-ins, keeps one set of food targets for your goal, and lets food shape your training.",
    date: "2026-11-15",
    tag: "Nutrition",
    cta: "plan",
    body: [
      {
        p: "Liftsmith doesn't log food. You keep using the food app you like, it writes each day to Health Connect or Apple Health, and Liftsmith reads the totals and tells you one thing to do. This update makes that coaching follow your own numbers instead of a formula's guess.",
      },
      { h2: "Your maintenance, measured" },
      {
        p: "A calorie calculator guesses what you burn from your height, weight, age and how often you train. For most people it lands within 10 to 15%, which on a cut can be the whole deficit. Once you have two weeks of fully logged days and four weigh-ins spread over two weeks, Liftsmith works out your real maintenance: what you ate, plus what your weight trend says about the gap. Every kilogram gained or lost is about 7,700 kcal.",
      },
      {
        p: "Tools › TDEE shows the measured number with the formula's beside it, and Macros, your coach's notes and the Food card on Body all use it. The trend is a line through your weigh-ins, so one heavy morning after a salty dinner doesn't swing it.",
      },
      { cta: "plan" },
      { h2: "One set of targets" },
      {
        p: "Pick your goal in Tools › Macros: Lose fat, Maintain or Build muscle. Until you pick one, it follows your training goal. Your protein, calories, carbs and fat come from that goal and your maintenance, and everything that judges what you eat uses those same numbers. You won't be told you're eating too little to build muscle while you're cutting on purpose.",
      },
      {
        ul: [
          "Protein is 1.8 g per kg of body weight, or 2.2 g on a cut to keep your muscle.",
          "If your coach set targets for you, theirs win, number by number.",
          "The Food card on Body › Health shows your last week against them, with one tap to Macros.",
        ],
      },
      { h2: "Food that shapes the training" },
      {
        p: "What you eat changes what you can lift, so it now changes the plan. With Pro, two days in a row well under maintenance count toward readiness, so the day's call leans easier. A lift that stalls while you're eating well under maintenance gets the reason said plainly: strength rarely climbs in a deficit, and holding it is a win. With Pro, the plateau detective takes it as a cause and suggests a small step back that rebuilds with the reps.",
      },
      { h2: "Protein-only logging counts" },
      {
        p: "Some lifters only log their protein foods and shakes. Those days used to be dropped as half logged. Now a day that's mostly protein counts for protein, so the protein notes work for you too. Its calories still don't count, so a light day never reads as a crash diet.",
      },
      { h2: "Carbs and fat, and coaching" },
      {
        p: "Liftsmith now reads carbs and fat too. Coaches can set calories, protein, carbs and fat for each client, and a different calorie number for rest days, with one tap to fill them in from the client's weight and measured maintenance. Clients see their last week next to their coach's targets, and a coach is told when a client's food app has gone quiet.",
      },
      { h2: "Under 18" },
      {
        p: "Lifters under 18 get protein advice only. There's no Lose fat goal, no fat-loss number and no calorie notes, and a coach can set protein for an athlete under 18 but not calories, carbs or fat. Growing athletes should eat enough, not eat to a number.",
      },
      {
        tip: "Log a few full days a week rather than every day half done. A fully logged day is worth more than three partial ones, for your notes and for your measured maintenance.",
      },
    ],
    faq: [
      [
        "Do I have to log food in Liftsmith?",
        "No. Liftsmith never logs food. Use any food app that writes to Health Connect or Apple Health, and allow food in Body › Health.",
      ],
      [
        "Why is my measured maintenance different from the calculator?",
        "The calculator is an estimate for an average body. The measured number comes from what you actually ate and how your weight actually moved, so it fits you. It needs honest logging: missing snacks make it read low.",
      ],
      [
        "Does this work on the web app?",
        "A browser can't read Health Connect or Apple Health, so food comes from your phone. Once you sign in, it syncs, and the web app shows the same notes and targets.",
      ],
    ],
  },
];
