import type { Article } from "../articles";

// Blog: phone-free workouts on the watch (Melvin asked for it from the watch ideas, 2026-11-26; docs/decisions/watch-apps.md
// "Phone-free workouts"). Only what ships, and no other app named (seo.test.ts).
export const BLOG_WATCH_ALONE: Article[] = [
  {
    slug: "workouts-on-your-watch-without-your-phone",
    kind: "blog",
    title: "Lift with just your watch: workouts with your phone away",
    description:
      "Today's plan rides along on your Wear OS, Apple Watch or Garmin watch. Start it on the wrist, log every set, and it's saved when your phone is near again.",
    date: "2026-11-26",
    tag: "Tracking",
    cta: "watch",
    body: [
      {
        p: "Some days the phone stays in the locker, the car or the bag at home. Until now that meant lifting without a plan on your wrist. Now the plan is already there: Liftsmith sends today's workout to your watch ahead of time, so you can start it, log it and finish it with no phone in sight.",
      },
      { h2: "How it works" },
      {
        p: "Whenever your plan for today changes, your phone works it out set by set, warm-ups included, and sends it to your watch: each exercise, each set's weight and reps, the rest after it and the weights your gym has around it. When no workout is running on your phone, the watch shows today's workout with a **Start on watch** button. On Garmin, press **START**.",
      },
      { h2: "On the wrist" },
      {
        p: "It looks and works like a workout from your phone: the set, the weight and reps, a rest countdown with a buzz when it ends, and **Log set** and **+30 s**. Change the weight or reps with the crown, the bezel or − and + (UP and DOWN on Garmin), and after an exercise's last set the watch asks how it felt. The next set of the same lift keeps what you dialled in. Heart rate comes from the watch's own sensor.",
      },
      {
        p: "When you're done, tap **Finish** (on Garmin, BACK and then yes). Finish asks for a second tap unless every set is logged, so a brush of the sleeve doesn't end your workout. Close the app between sets and nothing is lost: the watch keeps the workout as you go.",
      },
      { cta: "watch" },
      { h2: "Saved when your phone is back" },
      {
        p: "The watch holds the finished workout until your phone is near, minutes or days later, with the app open or not. Your phone then saves it exactly as if you'd logged it there: every set at its own time, your rest, warm-ups, the answers about how it felt, new bests and the next weights. It goes to Health Connect or Apple Health like any other workout, and a short note says how many sets came in. A workout that arrives twice is only saved once.",
      },
      { h2: "What stays on the phone" },
      {
        p: "Planning still happens on your phone, so the watch runs the plan it was sent and doesn't swap exercises: Machine taken and Change the plan wait until your phone is back. Cardio and the stretching or rehab parts of a workout stay on the phone too.",
      },
      {
        p: "It's free, like the rest of the watch apps. Read [what a smartwatch is good for in the gym](/blog/lifting-with-a-smartwatch/) for everything else the watch does.",
      },
    ],
    faq: [
      [
        "Do I need Pro to work out with just my watch?",
        "No. Phone-free workouts are free on Wear OS, Apple Watch and Garmin, like the rest of the watch apps.",
      ],
      [
        "What if my plan changes after the watch got it?",
        "Your phone sends the new plan whenever it changes. A workout you already ran on the watch is saved against the plan it was started from.",
      ],
      [
        "How long can the watch keep a workout?",
        "Until your phone is near again. Your phone keeps each plan it sent for two weeks, so a watch that's been away on a trip still brings its workouts home.",
      ],
    ],
  },
];
