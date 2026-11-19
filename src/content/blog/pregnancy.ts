import type { Article } from "../articles";

// Blog: pregnancy and postpartum mode (Melvin, 2026-11-19, docs/decisions/pregnancy.md). Only what ships, no other app
// named (seo.test.ts), and never medical advice: it says what the plan does and points to a doctor or midwife.
export const BLOG_PREGNANCY: Article[] = [
  {
    slug: "pregnancy-postpartum-mode",
    kind: "blog",
    title: "Lifting through pregnancy and after birth, week by week",
    description:
      "Pregnancy and postpartum mode changes every workout with the week: lighter loads, no all-out sets, and a gradual return after birth.",
    date: "2026-11-19",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Strength training during pregnancy is good for most people, and the guidelines doctors and midwives follow say so: keep moving if you were already active, and adjust as the weeks go by. Until now, Liftsmith only told you to check with your doctor. Now it adjusts the plan for you, the same way injury mode does.",
      },
      { h2: "Turn it on in a few taps" },
      {
        p: "Go to Settings › Body and units › Pregnancy and postpartum. Pick I'm pregnant or I've had my baby, set the weeks on a − / + stepper, and that's it. No dates to type. After birth, one switch says if it was a C-section.",
      },
      { h2: "What changes while you're pregnant" },
      {
        ul: [
          "First trimester: your usual loads, but every set stops at least two reps short of failure, and there are no push days or challenges.",
          "From week 14: loads at 90%, three or more reps in the tank, up to three sets, and nothing lying flat on your back or on your belly, no jumps and no crunches or sit-ups. Hip thrusts with your upper back on a bench, incline presses and side-lying work stay.",
          "From week 28: loads at 80%, with the same rules.",
        ],
      },
      { cta: "plan" },
      { h2: "A gradual return after birth" },
      {
        ul: [
          "Weeks 0 to 6: half your usual loads, two sets, and no running, jumping or crunches.",
          "Weeks 6 to 12: 70%, still no running or jumping.",
          "Weeks 12 to 16: 85%, and running and jumps come back.",
          "After that, 90% until you tell Liftsmith you're back to your usual training.",
        ],
      },
      { tip: "Had a C-section? The two gentlest phases each last two weeks longer." },
      { h2: "Every change says why" },
      {
        p: "Today shows where you are, such as Pregnancy · week 22, and each exercise carries a short line saying what the mode did to it. Sets done lighter don't count against your progress, so when the mode ends your plan picks up from where you were.",
      },
      { h2: "Your data stays yours" },
      {
        p: "The mode stays on your phone and only leaves through your own backup and sync. It's never used for analytics or ads. Turning it off removes your dates.",
      },
      {
        p: "This isn't medical advice. Check with your doctor or midwife before you train, and stop and call them if you notice bleeding, fluid leaking, painful contractions, dizziness, chest pain or your baby moving less.",
      },
    ],
    faq: [
      ["Is it Pro?", "No. Like injury mode, it's free for everyone, on Android, iPhone and the web."],
      [
        "Does it work with programs and routines?",
        "Yes. A fixed program or a saved routine keeps its shape: exercises the mode leaves out are swapped for the closest one that fits, and loads come down set by set. A rehab program from your physio stays as they wrote it.",
      ],
    ],
  },
];
